import { parseEmail, parseIndianMobile, validatePersonName } from "@/lib/registration/fields";

export type SchoolForm = {
  schoolName: string;
  schoolAddress: string;
  principalName: string;
  principalEmail: string;
  coordinatorName: string;
  coordinatorMobile: string;
  coordinatorEmail: string;
  previousParticipation: boolean;
  previousReference: string | null;
};

export type SchoolField =
  | "schoolName"
  | "schoolAddress"
  | "principalName"
  | "principalEmail"
  | "coordinatorName"
  | "coordinatorMobile"
  | "coordinatorEmail"
  | "previousParticipation"
  | "previousReference"
  | "authorised"
  | "privacy"
  | "transactionReference";

export type SchoolErrors = Partial<Record<SchoolField, string>>;

function cleanLine(value: string, max: number): string {
  return value.normalize("NFKC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function readSchoolForm(source: FormData | Record<string, string>): { value: SchoolForm | null; errors: SchoolErrors } {
  const get = (key: string) => {
    if (source instanceof FormData) return String(source.get(key) ?? "");
    return source[key] ?? "";
  };
  const errors: SchoolErrors = {};
  const schoolName = cleanLine(get("schoolName"), 200);
  const schoolAddress = cleanLine(get("schoolAddress"), 500);
  const principalRaw = cleanLine(get("principalName"), 120);
  const coordinatorRaw = cleanLine(get("coordinatorName"), 120);
  const principalEmail = parseEmail(get("principalEmail"));
  const coordinatorEmail = parseEmail(get("coordinatorEmail"));
  const coordinatorMobile = parseIndianMobile(get("coordinatorMobile"));
  const previousRaw = get("previousParticipation").trim().toLowerCase();
  const previousReferenceRaw = cleanLine(get("previousReference"), 80);

  if (schoolName.length < 3 || !/\p{L}/u.test(schoolName)) errors.schoolName = "Enter the school name.";
  if (schoolAddress.length < 10) errors.schoolAddress = "Enter the school address.";
  const principal = validatePersonName(principalRaw, "Principal's name");
  if (!principal.ok) errors.principalName = principal.message;
  if (!principalEmail) errors.principalEmail = "Enter the principal's official email address.";
  const coordinator = validatePersonName(coordinatorRaw, "Coordinator's name");
  if (!coordinator.ok) errors.coordinatorName = coordinator.message;
  if (!coordinatorMobile) errors.coordinatorMobile = "Enter a 10-digit Indian mobile number.";
  if (!coordinatorEmail) errors.coordinatorEmail = "Enter the coordinator's email address.";
  if (previousRaw !== "yes" && previousRaw !== "no") {
    errors.previousParticipation = "Say whether the school took part in the 1st DHE English Olympiad.";
  }
  let previousReference: string | null = null;
  if (previousRaw === "yes" && previousReferenceRaw) {
    if (!/^[A-Za-z0-9][A-Za-z0-9./-]{0,79}$/.test(previousReferenceRaw)) {
      errors.previousReference = "The earlier reference can contain letters, numbers, dots, and hyphens.";
    } else {
      previousReference = previousReferenceRaw;
    }
  }
  if (get("authorised") !== "yes") errors.authorised = "Confirm that you are authorised to submit this registration.";
  if (get("privacy") !== "yes") errors.privacy = "Acknowledge the registration privacy notice.";

  if (Object.keys(errors).length || !principal.ok || !coordinator.ok || !principalEmail || !coordinatorMobile || !coordinatorEmail) {
    return { value: null, errors };
  }
  return {
    value: {
      schoolName,
      schoolAddress,
      principalName: principal.value,
      principalEmail,
      coordinatorName: coordinator.value,
      coordinatorMobile,
      coordinatorEmail,
      previousParticipation: previousRaw === "yes",
      previousReference,
    },
    errors,
  };
}

export function validateTransactionReference(value: string): string | null {
  const text = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9-]{5,39}$/.test(text)) return null;
  return text;
}
