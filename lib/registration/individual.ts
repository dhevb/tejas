import { calculateIndividualRegistration, type Charge } from "@/lib/registration/fee";
import {
  classIsEligible,
  parseClassValue,
  parseEmail,
  parseIndianMobile,
  validateDob,
  validatePersonName,
} from "@/lib/registration/fields";
import { parseStreamToken, splitStreamCell, streamById, type StreamId } from "@/lib/registration/schema";
import type { StudentRecord } from "@/lib/registration/sheet";
import type { SchoolForm } from "@/lib/registration/school";

export type IndividualInput = {
  fullName: string;
  parentName: string;
  dateOfBirth: string;
  classLabel: string;
  schoolName: string;
  section: string;
  rollNumber: string;
  mobile: string;
  email: string;
  streams: StreamId[];
};

export function readIndividualForm(source: FormData): { value: IndividualInput | null; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = validatePersonName(String(source.get("fullName") ?? ""), "Student name");
  if (!name.ok) errors.fullName = name.message;
  const parent = validatePersonName(String(source.get("parentName") ?? ""), "Father's or mother's name");
  if (!parent.ok) errors.parentName = parent.message;
  const dob = validateDob(String(source.get("dateOfBirth") ?? ""));
  if (!dob.ok) errors.dateOfBirth = dob.message;
  const classLabel = String(source.get("className") ?? "").trim();
  const classNumber = parseClassValue(classLabel);
  if (!classLabel || classNumber === null) errors.className = "Enter the class as 3–10 or III–X.";
  const schoolName = String(source.get("schoolName") ?? "").trim();
  if (schoolName.length < 3) errors.schoolName = "Enter the school name.";
  const section = String(source.get("section") ?? "").trim();
  const rollNumber = String(source.get("rollNumber") ?? "").trim();
  if (section.length > 20) errors.section = "Section is too long.";
  if (rollNumber.length > 20) errors.rollNumber = "Roll number is too long.";
  const mobile = parseIndianMobile(String(source.get("mobile") ?? ""));
  if (!mobile) errors.mobile = "Enter a 10-digit Indian mobile number.";
  const email = parseEmail(String(source.get("email") ?? ""));
  if (!email) errors.email = "Enter a valid email address.";
  const tokens = splitStreamCell(String(source.get("streams") ?? ""));
  const streams: StreamId[] = [];
  const seen = new Set<StreamId>();
  if (!tokens.length) errors.streams = "Select at least one stream.";
  for (const token of tokens) {
    const id = parseStreamToken(token);
    if (!id) {
      errors.streams = "Use TEJAS English, TEJAS Mathematics, or TEJAS Future Tech.";
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    streams.push(id);
  }
  if (classNumber !== null && streams.length) {
    const blocked = streams.filter((id) => !classIsEligible(classNumber, streamById(id).classes));
    if (blocked.length) errors.streams = `${blocked.map((id) => streamById(id).name).join(", ")} is not open for this class.`;
  }
  if (Object.keys(errors).length || !name.ok || !parent.ok || !dob.ok || classNumber === null || !mobile || !email) {
    return { value: null, errors };
  }
  return {
    value: {
      fullName: name.value,
      parentName: parent.value,
      dateOfBirth: dob.value,
      classLabel,
      schoolName,
      section: section || "-",
      rollNumber: rollNumber || "-",
      mobile,
      email,
      streams,
    },
    errors,
  };
}

export function individualCharge(streams: number): Charge {
  return calculateIndividualRegistration(streams);
}

export function individualStudent(input: IndividualInput): StudentRecord {
  const classNumber = parseClassValue(input.classLabel);
  if (classNumber === null) throw new Error("Class is not valid.");
  return {
    row: 2,
    fullName: input.fullName,
    parentName: input.parentName,
    parentMobile: input.mobile,
    parentEmail: input.email,
    dateOfBirth: input.dateOfBirth,
    classNumber,
    classLabel: input.classLabel,
    section: input.section,
    rollNumber: input.rollNumber,
    schoolName: input.schoolName,
    streams: input.streams,
  };
}

export function individualSchool(input: IndividualInput): SchoolForm {
  return {
    schoolName: input.schoolName,
    schoolAddress: "Individual student registration",
    state: "",
    district: "",
    city: "",
    pin: "",
    pan: "",
    panHolder: null,
    panDuplicate: false,
    schoolEmail: input.email,
    schoolMobile: input.mobile,
    affiliationBoard: "",
    affiliationNumber: null,
    schoolCategory: "Other recognised school",
    principalName: input.parentName,
    principalMobile: input.mobile,
    principalEmail: input.email,
    principalDesignation: "Parent / Guardian",
    coordinatorName: input.parentName,
    coordinatorMobile: input.mobile,
    coordinatorEmail: input.email,
    coordinatorDesignation: "Parent / Guardian",
    previousParticipation: false,
    previousReference: null,
    printedBooks: "no",
    bookQuantity: 0,
    ebookAccess: "no",
    representativeName: null,
    representativeDesignation: null,
  };
}
