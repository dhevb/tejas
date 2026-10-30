import * as XLSX from "xlsx";
import { calculateFee, type FeeBreakdown } from "@/lib/registration/fee";
import {
  classIsEligible,
  dateObjectToDob,
  excelSerialToDob,
  isExampleStudent,
  normaliseSchoolName,
  parseClassValue,
  parseEmail,
  parseIndianMobile,
  validateDob,
  validatePersonName,
} from "@/lib/registration/fields";
import {
  columnKeyForHeader,
  EXAMPLE_CLASS,
  EXAMPLE_DOB,
  EXAMPLE_PARENT_EMAIL,
  EXAMPLE_PARENT_MOBILE,
  EXAMPLE_PARENT_NAME,
  EXAMPLE_ROLL,
  EXAMPLE_SCHOOL,
  EXAMPLE_SECTION,
  EXAMPLE_STREAMS,
  EXAMPLE_STUDENT_NAME,
  MAX_STUDENT_ROWS,
  MAX_UPLOAD_BYTES,
  parseStreamToken,
  splitStreamCell,
  streamById,
  STREAMS,
  STUDENT_COLUMNS,
  type ColumnKey,
  type StreamId,
} from "@/lib/registration/schema";

export type StudentRecord = {
  row: number;
  fullName: string;
  parentName: string;
  parentMobile: string;
  parentEmail: string;
  dateOfBirth: string;
  classNumber: number;
  classLabel: string;
  section: string;
  rollNumber: string;
  schoolName: string;
  streams: StreamId[];
};

export type RowError = { row: number; messages: string[] };

export type SheetParse = {
  students: StudentRecord[];
  rowErrors: RowError[];
  formErrors: string[];
  fee: FeeBreakdown | null;
  provisional: boolean;
};

export type SheetKind = "xlsx" | "xls" | "csv";

export function detectSheetKind(filename: string, buf: Buffer): { kind: SheetKind } | { error: string } {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  const zip = buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b;
  const ole = buf.length > 8 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;
  if (ext === "xlsx") {
    if (!zip) return { error: "This file is named .xlsx but is not an Excel workbook." };
    return { kind: "xlsx" };
  }
  if (ext === "xls") {
    if (!ole) return { error: "This file is named .xls but is not an Excel 97–2003 workbook." };
    return { kind: "xls" };
  }
  if (ext === "csv") {
    if (zip || ole || buf.includes(0)) return { error: "This file is named .csv but its contents are not a text sheet." };
    return { kind: "csv" };
  }
  return { error: "Upload a .xlsx, .xls, or .csv file." };
}

function containsMacros(kind: SheetKind, buf: Buffer): boolean {
  if (kind === "csv") return false;
  if (kind === "xlsx" && buf.includes(Buffer.from("vbaProject"))) return true;
  if (kind === "xls" && buf.includes(Buffer.from("_VBA_PROJECT"))) return true;
  return false;
}

function pushError(bag: Map<number, string[]>, row: number, message: string) {
  const list = bag.get(row) ?? [];
  list.push(message);
  bag.set(row, list);
}

function cellLooksLikeFormulaWithoutValue(cell: XLSX.CellObject | undefined): boolean {
  return Boolean(cell?.f && (cell.v === undefined || cell.v === null) && !cell.w);
}

function textFromCell(cell: XLSX.CellObject | undefined): { text: string; formula: boolean } {
  if (!cell) return { text: "", formula: false };
  if (cellLooksLikeFormulaWithoutValue(cell)) return { text: "", formula: true };
  if (cell.v instanceof Date) {
    const parsed = dateObjectToDob(cell.v);
    return { text: parsed.ok ? parsed.value : String(cell.w ?? "").trim(), formula: Boolean(cell.f) };
  }
  return { text: String(cell.w ?? cell.v ?? "").trim(), formula: Boolean(cell.f) };
}

function readDob(cell: XLSX.CellObject | undefined): { result: ReturnType<typeof validateDob> | null; formula: boolean; blank: boolean } {
  if (!cell || (cell.v === undefined && !cell.w)) return { result: null, formula: false, blank: true };
  if (cellLooksLikeFormulaWithoutValue(cell)) return { result: null, formula: true, blank: false };
  if (cell.v instanceof Date) return { result: dateObjectToDob(cell.v), formula: Boolean(cell.f), blank: false };
  if (typeof cell.v === "number" && (cell.t === "n" || cell.t === "d")) {
    const formatted = cell.w && /\d/.test(cell.w) ? validateDob(cell.w) : null;
    if (formatted?.ok) return { result: formatted, formula: Boolean(cell.f), blank: false };
    return { result: excelSerialToDob(cell.v), formula: Boolean(cell.f), blank: false };
  }
  const text = String(cell.w ?? cell.v ?? "").trim();
  if (!text) return { result: null, formula: Boolean(cell.f), blank: true };
  return { result: validateDob(text), formula: Boolean(cell.f), blank: false };
}

function fail(formErrors: string[]): SheetParse {
  return { students: [], rowErrors: [], formErrors, fee: null, provisional: false };
}

export function parseStudentSheet(buf: Buffer, filename: string, schoolName: string): SheetParse {
  if (buf.length === 0) return fail(["The uploaded file is empty."]);
  if (buf.length > MAX_UPLOAD_BYTES) return fail(["The file is larger than 10 MB."]);
  const detected = detectSheetKind(filename, buf);
  if ("error" in detected) return fail([detected.error]);
  const kind = detected.kind;
  if (containsMacros(kind, buf)) return fail(["This spreadsheet contains macros and was rejected. Save a copy with values only."]);

  let workbook: XLSX.WorkBook;
  try {
    workbook =
      kind === "csv"
        ? XLSX.read(buf.toString("utf8").replace(/^\uFEFF/, ""), { type: "string", cellDates: true, raw: false })
        : XLSX.read(buf, { type: "buffer", cellDates: true, bookVBA: false, sheetRows: MAX_STUDENT_ROWS + 15, dense: false });
  } catch {
    return fail(["This spreadsheet could not be read. Save it again as .xlsx or .csv and upload that file."]);
  }
  if (workbook.vbaraw) return fail(["This spreadsheet contains macros and was rejected."]);

  const sheetName = workbook.SheetNames.find((name) => name.toLowerCase() === "students") ?? workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet || !sheet["!ref"]) return fail(["The workbook has no student sheet."]);

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  let headerRow = -1;
  const columns = new Map<ColumnKey, number>();
  const scanUntil = Math.min(range.e.r, range.s.r + 9);
  for (let r = range.s.r; r <= scanUntil; r += 1) {
    const found = new Map<ColumnKey, number>();
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined;
      const key = columnKeyForHeader(String(cell?.w ?? cell?.v ?? ""));
      if (key && !found.has(key)) found.set(key, c);
    }
    if (found.has("fullName") && found.has("streams")) {
      headerRow = r;
      found.forEach((column, key) => columns.set(key, column));
      break;
    }
  }
  if (headerRow < 0) {
    return fail(["The column headings were not found. Download the sample template and keep its header row."]);
  }
  const missing = STUDENT_COLUMNS.filter((column) => !columns.has(column.key)).map((column) => column.header);
  if (missing.length) return fail([`The sheet is missing required columns: ${missing.join(", ")}.`]);

  const errors = new Map<number, string[]>();
  const students: StudentRecord[] = [];
  const seenStudents = new Map<string, number>();
  const seenRolls = new Map<string, number>();
  const expectedSchool = normaliseSchoolName(schoolName);
  let dataRows = 0;

  for (let r = headerRow + 1; r <= range.e.r; r += 1) {
    const rowNumber = r + 1;
    const cells = new Map<ColumnKey, XLSX.CellObject | undefined>();
    STUDENT_COLUMNS.forEach((column) => {
      const index = columns.get(column.key);
      cells.set(column.key, index === undefined ? undefined : (sheet[XLSX.utils.encode_cell({ r, c: index })] as XLSX.CellObject | undefined));
    });
    const texts = new Map<ColumnKey, string>();
    let formulaBlank = false;
    cells.forEach((cell, key) => {
      const read = textFromCell(cell);
      if (read.formula && !read.text) formulaBlank = true;
      texts.set(key, read.text);
    });
    if ([...texts.values()].every((value) => !value)) continue;
    dataRows += 1;
    if (dataRows > MAX_STUDENT_ROWS) {
      return fail([`The sheet has more than ${MAX_STUDENT_ROWS} student rows. Split it, or write to the convener.`]);
    }
    if (formulaBlank) {
      pushError(errors, rowNumber, "A cell contains a formula without a stored value. Paste values and upload the sheet again.");
      continue;
    }

    const rawName = texts.get("fullName") ?? "";
    if (isExampleStudent(rawName)) {
      pushError(errors, rowNumber, "This is the sample example row. Delete it before submitting. It is not registered.");
      continue;
    }

    const name = validatePersonName(rawName, "Full name");
    const parent = validatePersonName(texts.get("parentName") ?? "", "Father's or mother's name");
    const parentMobile = parseIndianMobile(texts.get("parentMobile") ?? "");
    const parentEmail = parseEmail(texts.get("parentEmail") ?? "");
    if (!name.ok) pushError(errors, rowNumber, name.message);
    if (!parent.ok) pushError(errors, rowNumber, parent.message);
    if (!parentMobile) pushError(errors, rowNumber, "Parent or guardian mobile must be a 10-digit Indian mobile number.");
    if (!parentEmail) pushError(errors, rowNumber, "Parent or guardian email is missing or not a valid email address.");

    const dobCell = cells.get("dob");
    const dob = readDob(dobCell);
    let dateOfBirth = "";
    if (dob.formula) pushError(errors, rowNumber, "Date of birth contains a formula without a stored value.");
    else if (dob.blank) pushError(errors, rowNumber, "Date of birth is missing.");
    else if (dob.result && !dob.result.ok) pushError(errors, rowNumber, dob.result.message);
    else if (dob.result?.ok) dateOfBirth = dob.result.value;

    const classLabel = texts.get("className") ?? "";
    const classNumber = parseClassValue(classLabel);
    if (!classLabel.trim()) pushError(errors, rowNumber, "Class is missing.");
    else if (classNumber === null) pushError(errors, rowNumber, `Class "${classLabel}" was not understood. Use 3–10 or III–X.`);

    const section = (texts.get("section") ?? "").trim();
    if (!section) pushError(errors, rowNumber, "Section is missing. If the school does not use sections, enter a hyphen.");
    else if (section.length > 20 || /[\r\n=]/.test(section)) pushError(errors, rowNumber, "Section cannot be accepted.");

    const rollNumber = (texts.get("rollNumber") ?? "").trim();
    if (!rollNumber) pushError(errors, rowNumber, "Roll number or admission number is missing.");
    else if (rollNumber.length > 20 || /[\r\n=+]/.test(rollNumber)) pushError(errors, rowNumber, "Roll number cannot be accepted.");

    const rowSchool = texts.get("schoolName") ?? "";
    if (!rowSchool.trim()) pushError(errors, rowNumber, "School name is blank in the sheet.");
    else if (!expectedSchool) pushError(errors, rowNumber, "Enter the school name on the form before the sheet can be checked.");
    else if (normaliseSchoolName(rowSchool) !== expectedSchool) {
      pushError(errors, rowNumber, `School name "${rowSchool}" does not match "${schoolName.trim()}".`);
    }

    const streamTokens = splitStreamCell(texts.get("streams") ?? "");
    const streams: StreamId[] = [];
    if (!streamTokens.length) pushError(errors, rowNumber, "Select at least one stream: TEJAS English, TEJAS Mathematics, or TEJAS Future Tech.");
    const seenStream = new Set<StreamId>();
    for (const token of streamTokens) {
      const id = parseStreamToken(token);
      if (!id) {
        pushError(errors, rowNumber, `"${token}" is not a TEJAS stream. Use TEJAS English, TEJAS Mathematics, or TEJAS Future Tech.`);
        continue;
      }
      if (seenStream.has(id)) {
        pushError(errors, rowNumber, `${streamById(id).name} is repeated for this student.`);
        continue;
      }
      seenStream.add(id);
      streams.push(id);
    }
    if (classNumber !== null && streams.length) {
      const ineligible = streams.filter((id) => !classIsEligible(classNumber, streamById(id).classes));
      if (ineligible.length) {
        pushError(
          errors,
          rowNumber,
          `Class ${classLabel.trim()} is not eligible for ${ineligible.map((id) => streamById(id).name).join(", ")}. The brochure states Classes III–X for the Olympiad and does not print a separate range for each stream.`,
        );
      }
    }

    if (name.ok && dateOfBirth) {
      const key = `${name.value.toLowerCase()}|${dateOfBirth}`;
      const first = seenStudents.get(key);
      if (first) {
        pushError(errors, rowNumber, `This student matches row ${first}.`);
        pushError(errors, first, `This student is repeated on row ${rowNumber}.`);
        const index = students.findIndex((student) => student.row === first);
        if (index >= 0) students.splice(index, 1);
      } else seenStudents.set(key, rowNumber);
    }
    if (rollNumber && classNumber !== null && section) {
      const rollKey = `${classNumber}|${section.toLowerCase()}|${rollNumber.toLowerCase()}`;
      const first = seenRolls.get(rollKey);
      if (first) {
        pushError(errors, rowNumber, `Roll number ${rollNumber} is already used in this class and section on row ${first}.`);
        pushError(errors, first, `Roll number ${rollNumber} is repeated on row ${rowNumber}.`);
        const index = students.findIndex((student) => student.row === first);
        if (index >= 0) students.splice(index, 1);
      } else seenRolls.set(rollKey, rowNumber);
    }

    if (errors.has(rowNumber) || !name.ok || !parent.ok || !parentMobile || !parentEmail || !dateOfBirth || classNumber === null || !rollNumber) continue;
    const blocked = streams.some((id) => !classIsEligible(classNumber, streamById(id).classes));
    if (blocked || !streams.length || !section || !rowSchool.trim() || normaliseSchoolName(rowSchool) !== expectedSchool) continue;
    students.push({
      row: rowNumber,
      fullName: name.value,
      parentName: parent.value,
      parentMobile,
      parentEmail,
      dateOfBirth,
      classNumber,
      classLabel: classLabel.trim(),
      section,
      rollNumber,
      schoolName: schoolName.trim(),
      streams,
    });
  }

  if (!dataRows) return fail(["The sheet has no student rows. Add students below the header, and delete the sample example."]);

  const rowErrors = [...errors.entries()]
    .map(([row, messages]) => ({ row, messages: [...new Set(messages)] }))
    .sort((a, b) => a.row - b.row);
  const registrations = students.reduce((sum, student) => sum + student.streams.length, 0);
  return {
    students,
    rowErrors,
    formErrors: [],
    fee: calculateFee(registrations),
    provisional: rowErrors.length > 0,
  };
}

export function buildTemplateBuffer(): Buffer {
  const headers = STUDENT_COLUMNS.map((column) => column.header);
  const example = [EXAMPLE_STUDENT_NAME, EXAMPLE_PARENT_NAME, EXAMPLE_PARENT_MOBILE, EXAMPLE_PARENT_EMAIL, EXAMPLE_DOB, EXAMPLE_CLASS, EXAMPLE_SECTION, EXAMPLE_ROLL, EXAMPLE_SCHOOL, EXAMPLE_STREAMS];
  const students = XLSX.utils.aoa_to_sheet([headers, example]);
  students["!cols"] = headers.map((header) => ({ wch: Math.max(header.length + 2, 22) }));
  const instructions = XLSX.utils.aoa_to_sheet([
    ["TEJAS Olympiad 2026–27 student registration template"],
    ["Delete the example row on the Students sheet before you upload. That row is fictional and will be rejected."],
    ["Date of birth must be DD-MM-YYYY."],
    ["Class is III–X for TEJAS English, TEJAS Mathematics, and TEJAS Future Tech. The brochure does not print a separate range for each stream."],
    ["Streams: TEJAS English, TEJAS Mathematics, TEJAS Future Tech. Separate more than one with a comma."],
    ["Every column is compulsory, including roll number, parent mobile, and parent email."],
    ["School name in every row must match the school name on the registration form."],
    ["Do not include macros, passwords, or hidden sheets."],
    [`Approved stream names: ${STREAMS.map((stream) => stream.name).join(", ")}.`],
  ]);
  instructions["!cols"] = [{ wch: 120 }];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, students, "Students");
  XLSX.utils.book_append_sheet(book, instructions, "Instructions");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function studentsToWorkbook(students: StudentRecord[]): Buffer {
  const rows = [
    STUDENT_COLUMNS.map((column) => column.header),
    ...students.map((student) => [
      safeExport(student.fullName),
      safeExport(student.parentName),
      safeExport(student.parentMobile),
      safeExport(student.parentEmail),
      safeExport(student.dateOfBirth),
      safeExport(student.classLabel),
      safeExport(student.section),
      safeExport(student.rollNumber),
      safeExport(student.schoolName),
      safeExport(student.streams.map((id) => streamById(id).name).join(", ")),
    ]),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Students");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function safeExport(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function previewStudents(students: StudentRecord[]) {
  return students.map((student) => ({
    row: student.row,
    fullName: student.fullName,
    parentName: student.parentName,
    parentMobile: student.parentMobile,
    className: student.classLabel,
    dateOfBirth: student.dateOfBirth,
    classLabel: student.classLabel,
    section: student.section,
    rollNumber: student.rollNumber,
    streams: student.streams.map((id) => streamById(id).name),
    streamCount: student.streams.length,
  }));
}
