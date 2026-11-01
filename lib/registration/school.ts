import { EBOOK_SALE_OPEN } from "@/lib/registration/fee";
import { parseEmail, parseIndianMobile, parsePan, parsePin, validatePersonName } from "@/lib/registration/fields";

export const SCHOOL_CATEGORIES = ["Government", "Government-aided", "Private", "Other recognised school"] as const;
export const PAYMENT_MODES = ["UPI", "NEFT", "IMPS", "RTGS", "Bank Transfer", "Cheque", "Other"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export type SchoolForm = {
  schoolName: string;
  schoolAddress: string;
  state: string;
  district: string;
  city: string;
  pin: string;
  pan: string;
  panDuplicate: boolean;
  schoolEmail: string;
  schoolMobile: string;
  affiliationBoard: string;
  affiliationNumber: string | null;
  schoolCategory: (typeof SCHOOL_CATEGORIES)[number];
  principalName: string;
  principalMobile: string;
  principalEmail: string;
  principalDesignation: string;
  coordinatorName: string;
  coordinatorMobile: string;
  coordinatorEmail: string;
  coordinatorDesignation: string;
  previousParticipation: boolean;
  previousReference: string | null;
  printedBooks: "yes" | "no";
  bookQuantity: number;
  ebookAccess: "yes" | "no";
  representativeName: string | null;
  representativeDesignation: string | null;
};

export type SchoolField =
  | "schoolName"
  | "schoolAddress"
  | "state"
  | "district"
  | "city"
  | "pin"
  | "pan"
  | "schoolEmail"
  | "schoolMobile"
  | "affiliationBoard"
  | "affiliationNumber"
  | "schoolCategory"
  | "principalName"
  | "principalMobile"
  | "principalEmail"
  | "principalDesignation"
  | "coordinatorName"
  | "coordinatorMobile"
  | "coordinatorEmail"
  | "coordinatorDesignation"
  | "previousParticipation"
  | "previousReference"
  | "printedBooks"
  | "bookQuantity"
  | "ebookAccess"
  | "representativeName"
  | "representativeDesignation"
  | "accurate"
  | "studentsChecked"
  | "streamsCorrect"
  | "feeUnderstood"
  | "paymentGenuine"
  | "authorised"
  | "rules"
  | "transactionReference"
  | "paymentMode"
  | "paymentDate"
  | "payerName";

export type SchoolErrors = Partial<Record<SchoolField, string>>;

function cleanLine(value: string, max: number): string {
  return value.normalize("NFKC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

function placeName(value: string, label: string, errors: SchoolErrors, key: SchoolField) {
  const text = cleanLine(value, 80);
  if (text.length < 2 || !/\p{L}/u.test(text)) errors[key] = `Enter the ${label}.`;
  return text;
}

export function readSchoolForm(source: FormData | Record<string, string>): { value: SchoolForm | null; errors: SchoolErrors } {
  const get = (key: string) => {
    if (source instanceof FormData) return String(source.get(key) ?? "");
    return source[key] ?? "";
  };
  const errors: SchoolErrors = {};
  const schoolName = cleanLine(get("schoolName"), 200);
  const schoolAddress = cleanLine(get("schoolAddress"), 500);
  const state = placeName(get("state"), "state", errors, "state");
  const district = placeName(get("district"), "district", errors, "district");
  const city = placeName(get("city"), "city or block", errors, "city");
  const pin = parsePin(get("pin"));
  const pan = parsePan(get("pan"));
  const schoolEmail = parseEmail(get("schoolEmail"));
  const schoolMobile = parseIndianMobile(get("schoolMobile"));
  const affiliationBoard = cleanLine(get("affiliationBoard"), 120);
  const affiliationChoice = get("affiliationHasNumber").trim().toLowerCase();
  const affiliationRaw = cleanLine(get("affiliationNumber"), 40);
  const categoryRaw = cleanLine(get("schoolCategory"), 80);
  const principalRaw = cleanLine(get("principalName"), 120);
  const principalMobile = parseIndianMobile(get("principalMobile"));
  const principalEmail = parseEmail(get("principalEmail"));
  const coordinatorRaw = cleanLine(get("coordinatorName"), 120);
  const coordinatorMobile = parseIndianMobile(get("coordinatorMobile"));
  const coordinatorEmail = parseEmail(get("coordinatorEmail"));
  const coordinatorDesignation = cleanLine(get("coordinatorDesignation"), 80);
  const previousRaw = get("previousParticipation").trim().toLowerCase();
  const previousReferenceRaw = cleanLine(get("previousReference"), 80);
  const printedBooks = get("printedBooks").trim().toLowerCase();
  const ebookAccess = get("ebookAccess").trim().toLowerCase();

  if (schoolName.length < 3 || !/\p{L}/u.test(schoolName)) errors.schoolName = "Enter the full registered school name.";
  if (schoolAddress.length < 10) errors.schoolAddress = "Enter the complete school address.";
  if (!pin) errors.pin = "Enter a 6-digit PIN code.";
  if (!pan) errors.pan = "Enter the school's PAN in the standard format. Dummy or blank values are not accepted.";
  if (!schoolEmail) errors.schoolEmail = "Enter the school's email address.";
  if (!schoolMobile) errors.schoolMobile = "Enter the school's 10-digit contact mobile number.";
  if (affiliationBoard.length < 2) errors.affiliationBoard = "Enter the affiliation or recognition board.";
  let affiliationNumber: string | null = null;
  if (affiliationChoice !== "yes" && affiliationChoice !== "no") {
    errors.affiliationNumber = "Say whether the school has an affiliation or recognition number.";
  } else if (affiliationChoice === "yes") {
    if (!/^[A-Za-z0-9][A-Za-z0-9./-]{1,39}$/.test(affiliationRaw)) errors.affiliationNumber = "Enter the affiliation or recognition number.";
    else affiliationNumber = affiliationRaw;
  }
  if (!SCHOOL_CATEGORIES.includes(categoryRaw as (typeof SCHOOL_CATEGORIES)[number])) {
    errors.schoolCategory = "Select the school category.";
  }
  const principal = validatePersonName(principalRaw, "Principal's name");
  if (!principal.ok) errors.principalName = principal.message;
  if (!principalMobile) errors.principalMobile = "Enter the principal's 10-digit mobile number.";
  if (!principalEmail) errors.principalEmail = "Enter the principal's official email address.";
  const coordinator = validatePersonName(coordinatorRaw, "Coordinator's name");
  if (!coordinator.ok) errors.coordinatorName = coordinator.message;
  if (!coordinatorMobile) errors.coordinatorMobile = "Enter the coordinator's 10-digit mobile number.";
  if (!coordinatorEmail) errors.coordinatorEmail = "Enter the coordinator's email address.";
  if (coordinatorDesignation.length < 2) errors.coordinatorDesignation = "Enter the coordinator's designation.";
  if (principalMobile && coordinatorMobile && principalMobile === coordinatorMobile && principal.ok && coordinator.ok && principal.value === coordinator.value) {
    errors.coordinatorMobile = "Enter the coordinator's own mobile number. Do not reuse the principal's number for a different person.";
  }
  if (previousRaw !== "yes" && previousRaw !== "no") {
    errors.previousParticipation = "Say whether the school took part in the 1st DHE English Olympiad.";
  }
  let previousReference: string | null = null;
  if (previousRaw === "yes" && previousReferenceRaw) {
    if (!/^[A-Za-z0-9][A-Za-z0-9./-]{0,79}$/.test(previousReferenceRaw)) {
      errors.previousReference = "The earlier reference can contain letters, numbers, dots, and hyphens.";
    } else previousReference = previousReferenceRaw;
  }
  if (printedBooks !== "yes" && printedBooks !== "no") errors.printedBooks = "Choose whether the school wants printed books.";
  let bookQuantity = 0;
  if (printedBooks === "yes") {
    const quantity = Number(get("bookQuantity").trim());
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) errors.bookQuantity = "Enter how many printed books are required.";
    else bookQuantity = quantity;
  }
  const ebookChoice: "yes" | "no" = EBOOK_SALE_OPEN && ebookAccess === "yes" ? "yes" : "no";
  if (EBOOK_SALE_OPEN && ebookAccess !== "yes" && ebookAccess !== "no") errors.ebookAccess = "Choose whether the school wants e-book access.";
  for (const key of ["accurate", "studentsChecked", "streamsCorrect", "feeUnderstood", "paymentGenuine", "authorised", "rules"] as const) {
    if (get(key) !== "yes") errors[key] = "This declaration is required.";
  }

  if (
    Object.keys(errors).length ||
    !principal.ok ||
    !coordinator.ok ||
    !pin ||
    !pan ||
    !schoolEmail ||
    !schoolMobile ||
    !principalMobile ||
    !principalEmail ||
    !coordinatorMobile ||
    !coordinatorEmail
  ) {
    return { value: null, errors };
  }
  return {
    value: {
      schoolName,
      schoolAddress,
      state,
      district,
      city,
      pin,
      pan,
      panDuplicate: false,
      schoolEmail,
      schoolMobile,
      affiliationBoard,
      affiliationNumber,
      schoolCategory: categoryRaw as (typeof SCHOOL_CATEGORIES)[number],
      principalName: principal.value,
      principalMobile,
      principalEmail,
      principalDesignation: "Principal",
      coordinatorName: coordinator.value,
      coordinatorMobile,
      coordinatorEmail,
      coordinatorDesignation,
      previousParticipation: previousRaw === "yes",
      previousReference,
      printedBooks: printedBooks as "yes" | "no",
      bookQuantity,
      ebookAccess: ebookChoice,
      representativeName: null,
      representativeDesignation: null,
    },
    errors,
  };
}

export function validateTransactionReference(value: string, mode: PaymentMode): string | null {
  const text = value.trim();
  if (mode === "Cheque") {
    return /^[0-9]{6,12}$/.test(text) ? text : null;
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9-]{5,39}$/.test(text)) return null;
  return text;
}

export function readPaymentSubmission(source: FormData, amountDue: number): { value: { mode: PaymentMode; paidOn: string; payerName: string; transactionReference: string } | null; errors: SchoolErrors } {
  const modeRaw = String(source.get("paymentMode") ?? "").trim();
  const errors: SchoolErrors = {};
  if (!PAYMENT_MODES.includes(modeRaw as PaymentMode)) {
    errors.paymentMode = "Select the payment mode.";
    return { value: null, errors };
  }
  const mode = modeRaw as PaymentMode;
  const paidOn = String(source.get("paymentDate") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) errors.paymentDate = "Enter the payment date.";
  const payer = validatePersonName(String(source.get("payerName") ?? ""), "Payer's name");
  if (!payer.ok) errors.payerName = payer.message;
  const reference = validateTransactionReference(String(source.get("transactionReference") ?? ""), mode);
  if (!reference) {
    errors.transactionReference = mode === "Cheque" ? "Enter the cheque number." : mode === "UPI" ? "Enter the UPI transaction reference." : "Enter the bank reference or UTR.";
  }
  const amount = Number(String(source.get("amountPaid") ?? "").trim());
  if (amount !== amountDue) errors.transactionReference = errors.transactionReference ?? `The amount paid must be exactly ₹${amountDue.toLocaleString("en-IN")}, calculated on the server.`;
  if (Object.keys(errors).length || !payer.ok || !reference) return { value: null, errors };
  return { value: { mode, paidOn, payerName: payer.value, transactionReference: reference }, errors };
}
