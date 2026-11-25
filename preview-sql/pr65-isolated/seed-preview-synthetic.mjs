/**
 * Seed clearly fictional TEST DATA into the allowlisted Preview Supabase project.
 *
 * Usage (secrets via env only — never commit values):
 *   set PREVIEW_SUPABASE_URL=https://nbeslngnrsagarosuaab.supabase.co
 *   set PREVIEW_SUPABASE_SERVICE_ROLE_KEY=<preview-service-role>
 *   set PREVIEW_SEED_UPLOAD_PROOFS=1   # optional; omit to skip payment-proof PNGs
 *   node preview-sql/pr65-isolated/seed-preview-synthetic.mjs
 *
 * Allowlist: only project ref nbeslngnrsagarosuaab.
 * Refuses Production project ref zapccpipwxduzlnvjdmy and every other Supabase project.
 * Does not print credentials. Does not read SUPABASE_* / Production env names.
 * Does not create public Storage links. Does not change bucket policies.
 *
 * Storage:
 *   - Synthetic student XLSX → tejas-registration-files (always on new inserts; needed for file/dashboard QA).
 *   - Synthetic 1×1 PNG proofs → tejas-payment-proofs only when PREVIEW_SEED_UPLOAD_PROOFS=1.
 *   - Uploads use x-upsert:false (never overwrite existing objects).
 *
 * Re-run / partial failure:
 *   - If tejas_registrations.reference already exists → SKIP that registration (no DB overwrite).
 *   - No automatic DELETE/cleanup.
 *   - If a prior run left Storage objects but no registration row, resume may fail on upload
 *     (409/duplicate); remove the orphan Preview object manually, then re-run.
 *   - If a prior run left a school row without registration, re-run inserts another school +
 *     completes the registration (orphan school possible; no auto-cleanup).
 *
 * Counts (exact catalog): 5 registrations, 8 students, 5 payments, 5 XLSX, 3 proof PNGs (if opt-in).
 */
import * as XLSX from "xlsx";
import { pathToFileURL } from "node:url";

export const PRODUCTION_REF = "zapccpipwxduzlnvjdmy";
export const ALLOWED_PREVIEW_REF = "nbeslngnrsagarosuaab";
export const ALLOWED_PREVIEW_ORIGIN = `https://${ALLOWED_PREVIEW_REF}.supabase.co`;

/** @param {string | undefined | null} raw */
export function parsePreviewSupabaseUrl(raw) {
  const trimmed = String(raw ?? "").trim().replace(/\/$/, "");
  if (!trimmed) {
    return { ok: false, error: "PREVIEW_SUPABASE_URL is required" };
  }
  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, error: "PREVIEW_SUPABASE_URL is malformed" };
  }
  if (url.protocol !== "https:") {
    return { ok: false, error: "PREVIEW_SUPABASE_URL must use https" };
  }
  if (url.hostname !== `${ALLOWED_PREVIEW_REF}.supabase.co`) {
    if (url.hostname.includes(PRODUCTION_REF)) {
      return { ok: false, error: "Refusing Production project ref — Preview allowlist only" };
    }
    return {
      ok: false,
      error: `PREVIEW_SUPABASE_URL host must be ${ALLOWED_PREVIEW_REF}.supabase.co`,
    };
  }
  if (url.pathname && url.pathname !== "/") {
    return { ok: false, error: "PREVIEW_SUPABASE_URL must not include a path" };
  }
  if (url.search || url.hash || url.username || url.password) {
    return { ok: false, error: "PREVIEW_SUPABASE_URL must not include credentials, query, or hash" };
  }
  return { ok: true, origin: ALLOWED_PREVIEW_ORIGIN, projectRef: ALLOWED_PREVIEW_REF };
}

/** @param {string | undefined | null} key */
export function validatePreviewServiceRoleKey(key) {
  const value = String(key ?? "").trim();
  if (!value) return { ok: false, error: "PREVIEW_SUPABASE_SERVICE_ROLE_KEY is required" };
  if (value.length < 20) return { ok: false, error: "PREVIEW_SUPABASE_SERVICE_ROLE_KEY missing or too short" };
  return { ok: true };
}

/**
 * Resolve Preview env for seeding. Only PREVIEW_* names — never SUPABASE_* fallbacks.
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 */
export function resolvePreviewSeedConfig(env = process.env) {
  const urlResult = parsePreviewSupabaseUrl(env.PREVIEW_SUPABASE_URL);
  if (!urlResult.ok) return urlResult;
  const keyResult = validatePreviewServiceRoleKey(env.PREVIEW_SUPABASE_SERVICE_ROLE_KEY);
  if (!keyResult.ok) return keyResult;
  return {
    ok: true,
    origin: urlResult.origin,
    projectRef: urlResult.projectRef,
    proofUploadsEnabled: proofUploadsEnabled(env.PREVIEW_SEED_UPLOAD_PROOFS),
  };
}

/** @param {string | undefined | null} value */
export function proofUploadsEnabled(value) {
  return String(value ?? "").trim() === "1";
}

/** Headers for private-bucket object create — never upsert/overwrite. */
export function storageUploadHeaders(contentType) {
  return {
    "content-type": contentType,
    "x-upsert": "false",
  };
}

function alphabetRef(suffix) {
  // Must match referenceIsValid: TEJAS-2026- + 20 chars from this alphabet (no 0/1/I/O).
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = `TESTDATA${suffix}`.toUpperCase().replace(/[^A-Z0-9]/g, "");
  out = out
    .replace(/0/g, "2")
    .replace(/1/g, "3")
    .replace(/I/g, "J")
    .replace(/O/g, "P");
  out = [...out].filter((ch) => alphabet.includes(ch)).join("");
  while (out.length < 20) out += alphabet[out.length % alphabet.length];
  return `TEJAS-2026-${out.slice(0, 20)}`;
}

function feeForStreams(totalStreams) {
  const gross = totalStreams * 150;
  const school = totalStreams * 30;
  const tejas = totalStreams * 120;
  return {
    studentStreamRegistrations: totalStreams,
    totalStudentFees: gross,
    payableToTejas: tejas,
    schoolShare: school,
    schoolShareApproved: true,
    registrationSchoolShare: school,
    registrationPayable: tejas,
    amountDue: tejas,
    grossTotal: gross,
    printedBookAmount: 0,
    bookSchoolShare: 0,
    bookPayable: 0,
    ebookAmount: 0,
    printedBooks: 0,
    ebookAccess: 0,
  };
}

function student(partial) {
  return {
    row: partial.row,
    fullName: partial.fullName,
    parentName: partial.parentName,
    parentMobile: partial.parentMobile,
    parentEmail: partial.parentEmail,
    dateOfBirth: partial.dateOfBirth,
    classLabel: partial.classLabel,
    classNumber: partial.classNumber,
    section: partial.section,
    rollNumber: partial.rollNumber,
    schoolName: partial.schoolName,
    streams: partial.streams,
  };
}

function tinyPng() {
  // 1x1 PNG — synthetic placeholder only
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
}

function studentsWorkbook(students) {
  const rows = [
    ["Full Name of Student", "Father's/Mother's Name", "Parent/Guardian Mobile", "Parent/Guardian Email", "Date of Birth (DD-MM-YYYY)", "Class", "Section", "Roll Number", "School Name", "Selected TEJAS Stream(s)"],
    ...students.map((s) => [
      s.fullName,
      s.parentName,
      s.parentMobile,
      s.parentEmail,
      s.dateOfBirth,
      s.classLabel,
      s.section,
      s.rollNumber,
      s.schoolName,
      s.streams
        .map((id) => (id === "english" ? "TEJAS English" : id === "mathematics" ? "TEJAS Mathematics" : "TEJAS Future Tech"))
        .join("; "),
    ]),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Students");
  return Buffer.from(XLSX.write(book, { type: "buffer", bookType: "xlsx" }));
}

/** Exact seed catalog (no network). */
export function buildSeedSpecs() {
  const schoolA = "TEST DATA School Alpha Preview";
  const schoolB = "TEST DATA School Beta Preview";

  return [
    {
      reference: alphabetRef("AAAA01PEND"),
      schoolName: schoolA,
      schoolAddress: "TEST DATA Lane 1, Preview City Block",
      schoolEmail: "alpha-preview-test@example.test",
      schoolMobile: "9000000001",
      pan: "AAAAA0000A",
      principalName: "TEST DATA Principal Alpha",
      principalMobile: "9000000011",
      principalEmail: "principal-alpha@example.test",
      coordinatorName: "TEST DATA Coord Alpha",
      coordinatorMobile: "9000000021",
      coordinatorEmail: "coord-alpha@example.test",
      paymentStatus: "awaiting_payment",
      withProof: false,
      students: [
        student({
          row: 2,
          fullName: "TEST DATA Student Eng Only",
          parentName: "TEST DATA Parent One",
          parentMobile: "9111111111",
          parentEmail: "parent1@example.test",
          dateOfBirth: "01-01-2014",
          classLabel: "V",
          classNumber: 5,
          section: "A",
          rollNumber: "1",
          schoolName: schoolA,
          streams: ["english"],
        }),
        student({
          row: 3,
          fullName: "TEST DATA Student Math Only",
          parentName: "TEST DATA Parent Two",
          parentMobile: "9222222222",
          parentEmail: "parent2@example.test",
          dateOfBirth: "02-02-2014",
          classLabel: "VI",
          classNumber: 6,
          section: "B",
          rollNumber: "2",
          schoolName: schoolA,
          streams: ["mathematics"],
        }),
        student({
          row: 4,
          fullName: "TEST DATA Student FT Only",
          parentName: "TEST DATA Parent Three",
          parentMobile: "9333333333",
          parentEmail: "parent3@example.test",
          dateOfBirth: "03-03-2013",
          classLabel: "VII",
          classNumber: 7,
          section: "C",
          rollNumber: "3",
          schoolName: schoolA,
          streams: ["technology"],
        }),
        student({
          row: 5,
          fullName: "TEST DATA Student All Streams",
          parentName: "TEST DATA Parent Four",
          parentMobile: "9444444444",
          parentEmail: "parent4@example.test",
          dateOfBirth: "04-04-2012",
          classLabel: "VIII",
          classNumber: 8,
          section: "D",
          rollNumber: "4",
          schoolName: schoolA,
          streams: ["english", "mathematics", "technology"],
        }),
      ],
    },
    {
      reference: alphabetRef("BBBB02REPT"),
      schoolName: schoolB,
      schoolAddress: "TEST DATA Road 2, Preview District Area",
      schoolEmail: "beta-preview-test@example.test",
      schoolMobile: "9000000002",
      pan: "BBBBB1111B",
      principalName: "TEST DATA Principal Beta",
      principalMobile: "9000000012",
      principalEmail: "principal-beta@example.test",
      coordinatorName: "TEST DATA Coord Beta",
      coordinatorMobile: "9000000022",
      coordinatorEmail: "coord-beta@example.test",
      paymentStatus: "reported",
      mode: "upi",
      paidOn: "2026-11-20",
      payerName: "TEST DATA Payer Beta",
      utr: "TESTUTR0000000001",
      extractedUtr: "TESTUTR0000000001",
      approvalMethod: "pending_exception",
      verificationLabel: "screenshot_ocr_exception",
      withProof: true,
      students: [
        student({
          row: 2,
          fullName: "TEST DATA Student Two Streams",
          parentName: "TEST DATA Parent Five",
          parentMobile: "9555555555",
          parentEmail: "parent5@example.test",
          dateOfBirth: "05-05-2013",
          classLabel: "IX",
          classNumber: 9,
          section: "A",
          rollNumber: "1",
          schoolName: schoolB,
          streams: ["english", "mathematics"],
        }),
      ],
    },
    {
      reference: alphabetRef("CCCC03CONF"),
      schoolName: "TEST DATA School Gamma Preview",
      schoolAddress: "TEST DATA Avenue 3, Preview Zone Place",
      schoolEmail: "gamma-preview-test@example.test",
      schoolMobile: "9000000003",
      pan: "CCCCC2222C",
      principalName: "TEST DATA Principal Gamma",
      principalMobile: "9000000013",
      principalEmail: "principal-gamma@example.test",
      coordinatorName: "TEST DATA Coord Gamma",
      coordinatorMobile: "9000000023",
      coordinatorEmail: "coord-gamma@example.test",
      paymentStatus: "confirmed",
      mode: "neft",
      paidOn: "2026-11-18",
      payerName: "TEST DATA Payer Gamma",
      utr: "TESTUTR0000000002",
      extractedUtr: "TESTUTR0000000002",
      approvalMethod: "screenshot_ocr_automatic",
      verificationLabel: "screenshot_ocr_match",
      beneficiaryMatch: "match",
      amountMatch: true,
      withProof: true,
      students: [
        student({
          row: 2,
          fullName: "TEST DATA Confirmed Student",
          parentName: "TEST DATA Parent Six",
          parentMobile: "9666666666",
          parentEmail: "parent6@example.test",
          dateOfBirth: "06-06-2011",
          classLabel: "X",
          classNumber: 10,
          section: "A",
          rollNumber: "1",
          schoolName: "TEST DATA School Gamma Preview",
          streams: ["english"],
        }),
      ],
    },
    {
      reference: alphabetRef("DDDD04REJ"),
      schoolName: "TEST DATA School Delta Preview",
      schoolAddress: "TEST DATA Street 4, Preview Sector Block",
      schoolEmail: "delta-preview-test@example.test",
      schoolMobile: "9000000004",
      pan: "DDDDD3333D",
      principalName: "TEST DATA Principal Delta",
      principalMobile: "9000000014",
      principalEmail: "principal-delta@example.test",
      coordinatorName: "TEST DATA Coord Delta",
      coordinatorMobile: "9000000024",
      coordinatorEmail: "coord-delta@example.test",
      paymentStatus: "rejected",
      reviewNote: "TEST DATA rejection note for Preview QA",
      utr: "TESTUTR0000000003",
      withProof: true,
      students: [
        student({
          row: 2,
          fullName: "TEST DATA Rejected Student",
          parentName: "TEST DATA Parent Seven",
          parentMobile: "9777777777",
          parentEmail: "parent7@example.test",
          dateOfBirth: "07-07-2012",
          classLabel: "VI",
          classNumber: 6,
          section: "B",
          rollNumber: "1",
          schoolName: "TEST DATA School Delta Preview",
          streams: ["mathematics", "technology"],
        }),
      ],
    },
    {
      reference: alphabetRef("EEEE05REF"),
      schoolName: "TEST DATA School Epsilon Preview",
      schoolAddress: "TEST DATA Boulevard 5, Preview Area Road",
      schoolEmail: "epsilon-preview-test@example.test",
      schoolMobile: "9000000005",
      pan: "EEEEE4444E",
      principalName: "TEST DATA Principal Epsilon",
      principalMobile: "9000000015",
      principalEmail: "principal-epsilon@example.test",
      coordinatorName: "TEST DATA Coord Epsilon",
      coordinatorMobile: "9000000025",
      coordinatorEmail: "coord-epsilon@example.test",
      paymentStatus: "refund_pending",
      reviewNote: "TEST DATA refund pending note",
      utr: "TESTUTR0000000004",
      withProof: false,
      students: [
        student({
          row: 2,
          fullName: "TEST DATA Refund Student",
          parentName: "TEST DATA Parent Eight",
          parentMobile: "9888888888",
          parentEmail: "parent8@example.test",
          dateOfBirth: "08-08-2010",
          classLabel: "IX",
          classNumber: 9,
          section: "C",
          rollNumber: "1",
          schoolName: "TEST DATA School Epsilon Preview",
          streams: ["english", "mathematics", "technology"],
        }),
      ],
    },
  ];
}

/** Exact counts derived from the catalog (proofs = catalog withProof flags; gated at runtime). */
export function summarizeSeedCatalog(specs = buildSeedSpecs()) {
  const statusCounts = {};
  let students = 0;
  let proofCandidates = 0;
  for (const spec of specs) {
    statusCounts[spec.paymentStatus] = (statusCounts[spec.paymentStatus] || 0) + 1;
    students += spec.students.length;
    if (spec.withProof) proofCandidates += 1;
  }
  return {
    registrations: specs.length,
    uniqueStudents: students,
    payments: specs.length,
    xlsxFiles: specs.length,
    proofFilesIfOptIn: proofCandidates,
    statusCounts,
  };
}

/**
 * Pure skip/overwrite decision helper for tests and insert path.
 * @param {boolean} exists
 */
export function decideRegistrationSeedAction(exists) {
  if (exists) return { action: "skip_existing", overwrite: false };
  return { action: "insert", overwrite: false };
}

function fail(message) {
  console.error(JSON.stringify({ ok: false, error: message }));
  process.exit(1);
}

async function main() {
  const config = resolvePreviewSeedConfig(process.env);
  if (!config.ok) fail(config.error);

  const ORIGIN = config.origin;
  const KEY = String(process.env.PREVIEW_SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const proofEnabled = config.proofUploadsEnabled;

  async function rest(path, init = {}) {
    const response = await fetch(`${ORIGIN}${path}`, {
      ...init,
      headers: {
        apikey: KEY,
        authorization: `Bearer ${KEY}`,
        accept: "application/json",
        ...(init.headers || {}),
      },
    });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { status: response.status, json, text };
  }

  async function upload(bucket, objectPath, bytes, contentType) {
    const response = await fetch(`${ORIGIN}/storage/v1/object/${bucket}/${objectPath}`, {
      method: "POST",
      headers: {
        apikey: KEY,
        authorization: `Bearer ${KEY}`,
        ...storageUploadHeaders(contentType),
      },
      body: bytes,
    });
    if (!response.ok) {
      fail(
        `Storage upload failed ${bucket}/${objectPath} HTTP ${response.status} (no overwrite; remove orphan Preview object if resuming a partial run)`,
      );
    }
  }

  async function registrationExists(reference) {
    const result = await rest(
      `/rest/v1/tejas_registrations?reference=eq.${encodeURIComponent(reference)}&select=reference`,
      { method: "GET" },
    );
    return result.status === 200 && Array.isArray(result.json) && result.json.length > 0;
  }

  async function insertRegistration(spec) {
    const exists = await registrationExists(spec.reference);
    const decision = decideRegistrationSeedAction(exists);
    if (decision.action === "skip_existing") {
      return { reference: spec.reference, status: "skipped_existing", streams: null, proofUpload: "skipped_existing" };
    }

    const fee = feeForStreams(spec.students.reduce((n, s) => n + s.streams.length, 0));
    const createdAt = spec.createdAt || new Date().toISOString();
    const wantProof = Boolean(spec.withProof) && proofEnabled;
    const record = {
      reference: spec.reference,
      createdAt,
      channel: "school-registration",
      school: {
        schoolName: spec.schoolName,
        schoolAddress: spec.schoolAddress,
        state: "Delhi",
        district: "New Delhi",
        city: "Delhi",
        pin: "110001",
        pan: spec.pan,
        panHolder: "school",
        panDuplicate: false,
        schoolEmail: spec.schoolEmail,
        schoolMobile: spec.schoolMobile,
        affiliationBoard: "CBSE",
        affiliationNumber: "TEST-AFF-0001",
        schoolCategory: "private",
        previousParticipation: false,
        previousReference: null,
        principalName: spec.principalName,
        principalMobile: spec.principalMobile,
        principalEmail: spec.principalEmail,
        coordinatorName: spec.coordinatorName,
        coordinatorMobile: spec.coordinatorMobile,
        coordinatorEmail: spec.coordinatorEmail,
        coordinatorDesignation: "Teacher",
        printedBooks: "no",
        bookQuantity: 0,
        ebookAccess: "no",
      },
      students: spec.students,
      fee,
      payment: {
        status: spec.paymentStatus,
        transactionReference: spec.utr || null,
        reviewNote: spec.reviewNote || null,
        mode: spec.mode || null,
        paidOn: spec.paidOn || null,
        payerName: spec.payerName || null,
        history: [{ at: createdAt, status: spec.paymentStatus, note: "TEST DATA seed" }],
        enteredUtr: spec.utr || null,
        extractedUtr: spec.extractedUtr || null,
        approvalMethod: spec.approvalMethod || null,
        verificationLabel: spec.verificationLabel || null,
        beneficiaryMatch: spec.beneficiaryMatch || null,
        amountMatch: spec.amountMatch ?? null,
      },
      uploadExt: "xlsx",
      receiptExt: wantProof ? "png" : null,
    };

    const schoolRes = await rest("/rest/v1/tejas_schools", {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify({
        school_name: record.school.schoolName,
        school_address: record.school.schoolAddress,
        state_name: record.school.state,
        district: record.school.district,
        city: record.school.city,
        pin_code: record.school.pin,
        pan: record.school.pan,
        pan_holder: record.school.panHolder,
        pan_duplicate: false,
        school_email: record.school.schoolEmail,
        school_mobile: record.school.schoolMobile,
        affiliation_board: record.school.affiliationBoard,
        affiliation_number: record.school.affiliationNumber,
        school_category: record.school.schoolCategory,
        previous_participation: false,
        previous_reference: null,
      }),
    });
    if (schoolRes.status !== 201 && schoolRes.status !== 200) fail(`school insert ${spec.reference} HTTP ${schoolRes.status}`);
    const schoolId = schoolRes.json[0].id;

    await rest("/rest/v1/tejas_principals", {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({
        school_id: schoolId,
        full_name: record.school.principalName,
        mobile: record.school.principalMobile,
        email: record.school.principalEmail,
        designation: "Principal",
      }),
    });
    await rest("/rest/v1/tejas_coordinators", {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({
        school_id: schoolId,
        full_name: record.school.coordinatorName,
        mobile: record.school.coordinatorMobile,
        email: record.school.coordinatorEmail,
        designation: record.school.coordinatorDesignation,
      }),
    });

    const regRes = await rest("/rest/v1/tejas_registrations", {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify({
        school_id: schoolId,
        reference: record.reference,
        status: record.payment.status,
        record_snapshot: record,
      }),
    });
    if (regRes.status !== 201 && regRes.status !== 200) fail(`registration insert ${spec.reference} HTTP ${regRes.status}`);
    const registrationId = regRes.json[0].id;

    for (const s of record.students) {
      const stRes = await rest("/rest/v1/tejas_students", {
        method: "POST",
        headers: { "content-type": "application/json", prefer: "return=representation" },
        body: JSON.stringify({
          registration_id: registrationId,
          full_name: s.fullName,
          class_label: s.classLabel,
          section_name: s.section,
          roll_number: s.rollNumber,
          date_of_birth: s.dateOfBirth.split("-").reverse().join("-"),
          parent_name: s.parentName,
          parent_mobile: s.parentMobile,
          parent_email: s.parentEmail,
        }),
      });
      const studentId = stRes.json[0].id;
      const streamRows = s.streams.map((id) => ({
        student_id: studentId,
        stream_name: id === "english" ? "TEJAS English" : id === "mathematics" ? "TEJAS Mathematics" : "TEJAS Future Tech",
      }));
      await rest("/rest/v1/tejas_registration_streams", {
        method: "POST",
        headers: { "content-type": "application/json", prefer: "return=minimal" },
        body: JSON.stringify(streamRows),
      });
    }

    const payRes = await rest("/rest/v1/tejas_payments", {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify({
        registration_id: registrationId,
        status: record.payment.status,
        mode: record.payment.mode,
        paid_on: record.payment.paidOn,
        payer_name: record.payment.payerName,
        transaction_reference: record.payment.transactionReference,
        amount_due: fee.amountDue,
        review_note: record.payment.reviewNote,
        history: record.payment.history,
        entered_utr: record.payment.enteredUtr,
        extracted_utr: record.payment.extractedUtr,
        approval_method: record.payment.approvalMethod,
        verification_label: record.payment.verificationLabel,
        beneficiary_match: record.payment.beneficiaryMatch,
        amount_match: record.payment.amountMatch,
      }),
    });
    const paymentId = payRes.json[0].id;

    await rest("/rest/v1/tejas_ebook_access", {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ registration_id: registrationId, student_count: 0, amount: 0, activated: false }),
    });

    // Synthetic XLSX is required for registration-file / dashboard QA paths.
    const uploadBytes = studentsWorkbook(record.students);
    const uploadPath = `${record.reference}/upload.xlsx`;
    await upload("tejas-registration-files", uploadPath, uploadBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    await rest("/rest/v1/tejas_registration_files", {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({
        registration_id: registrationId,
        storage_path: uploadPath,
        content_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        byte_size: uploadBytes.length,
      }),
    });

    let proofUpload = "skipped_opt_out";
    if (spec.withProof && !proofEnabled) {
      proofUpload = "skipped_opt_out";
    } else if (wantProof) {
      const receiptPath = `${record.reference}/receipt.png`;
      await upload("tejas-payment-proofs", receiptPath, tinyPng(), "image/png");
      await rest("/rest/v1/tejas_payment_proofs", {
        method: "POST",
        headers: { "content-type": "application/json", prefer: "return=minimal" },
        body: JSON.stringify({ payment_id: paymentId, storage_path: receiptPath, content_type: "image/png" }),
      });
      proofUpload = "uploaded";
    } else {
      proofUpload = "not_requested";
    }

    await rest("/rest/v1/tejas_audit_logs", {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({
        registration_id: registrationId,
        actor: "preview-seed",
        action_name: "registration_submitted",
        note: "TEST DATA",
      }),
    });

    return {
      reference: record.reference,
      status: record.payment.status,
      streams: fee.studentStreamRegistrations,
      proofUpload,
    };
  }

  const specs = buildSeedSpecs();
  const catalog = summarizeSeedCatalog(specs);
  const results = [];
  for (const spec of specs) {
    results.push(await insertRegistration(spec));
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        previewProjectRef: config.projectRef,
        allowedPreviewRef: ALLOWED_PREVIEW_REF,
        productionRefBlocked: PRODUCTION_REF,
        proofUploadsEnabled: proofEnabled,
        proofUploadsNote: proofEnabled
          ? "PREVIEW_SEED_UPLOAD_PROOFS=1 — synthetic payment-proof PNGs will upload for withProof specs"
          : "Proof uploads skipped (set PREVIEW_SEED_UPLOAD_PROOFS=1 to opt in)",
        xlsxUploads: "Synthetic student XLSX uploaded on new inserts for dashboard file QA (x-upsert:false)",
        catalog,
        seeded: results,
        note: "All names/PAN/UTR are fictional TEST DATA. Secrets not printed. Seed not run against Production.",
      },
      null,
      2,
    ),
  );
}

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entry) {
  await main();
}
