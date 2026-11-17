import { calculatePrintedBooks, type Charge, type PayerKind } from "@/lib/registration/fee";
import { classIsEligible, parseClassValue, parseEmail, parseIndianMobile, parsePan, parsePin, validatePersonName } from "@/lib/registration/fields";
import { STREAMS, streamById, type StreamId } from "@/lib/registration/schema";

export type BookLine = { streamId: StreamId; classNumber: number; quantity: number };

export function bookLinesFromForm(source: FormData): { lines: BookLine[]; error?: string } {
  const lines: BookLine[] = [];
  for (const stream of STREAMS) {
    for (const classNumber of stream.classes) {
      const raw = String(source.get(`qty-${stream.id}-${classNumber}`) ?? "").trim();
      if (!raw) continue;
      const quantity = Number(raw);
      if (!Number.isInteger(quantity) || quantity < 0) return { lines: [], error: "Book quantities must be whole numbers." };
      if (quantity === 0) continue;
      if (!classIsEligible(classNumber, stream.classes)) return { lines: [], error: "A selected class is not eligible for that stream." };
      lines.push({ streamId: stream.id, classNumber, quantity });
    }
  }
  if (!lines.length) return { lines: [], error: "Enter a quantity for at least one stream and class." };
  return { lines };
}

export function chargeLines(lines: BookLine[], payer: PayerKind): Charge {
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  return calculatePrintedBooks(quantity, payer);
}

export type SchoolBookInput = {
  schoolName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  district: string;
  state: string;
  pin: string;
  contactName: string;
  contactMobile: string;
  contactEmail: string;
  lines: BookLine[];
  pan: string | null;
  charge: Charge;
};

export function readSchoolBookForm(source: FormData): { value: SchoolBookInput | null; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const schoolName = String(source.get("schoolName") ?? "").trim();
  if (schoolName.length < 3) errors.schoolName = "Enter the school name.";
  const phone = parseIndianMobile(String(source.get("phone") ?? ""));
  if (!phone) errors.phone = "Enter the school phone number.";
  const email = parseEmail(String(source.get("email") ?? ""));
  if (!email) errors.email = "Enter the school email address.";
  const deliveryAddress = String(source.get("deliveryAddress") ?? "").trim();
  if (deliveryAddress.length < 10) errors.deliveryAddress = "Enter the complete delivery address.";
  const district = String(source.get("district") ?? "").trim();
  const state = String(source.get("state") ?? "").trim();
  if (district.length < 2) errors.district = "Enter the district.";
  if (state.length < 2) errors.state = "Enter the state.";
  const pin = parsePin(String(source.get("pin") ?? ""));
  if (!pin) errors.pin = "Enter a 6-digit PIN code.";
  const contact = validatePersonName(String(source.get("contactName") ?? ""), "Contact name");
  if (!contact.ok) errors.contactName = contact.message;
  const contactMobile = parseIndianMobile(String(source.get("contactMobile") ?? ""));
  if (!contactMobile) errors.contactMobile = "Enter the contact mobile number.";
  const contactEmail = parseEmail(String(source.get("contactEmail") ?? ""));
  if (!contactEmail) errors.contactEmail = "Enter the contact email address.";
  const parsed = bookLinesFromForm(source);
  if (parsed.error) errors.lines = parsed.error;
  const charge = parsed.lines.length ? chargeLines(parsed.lines, "school") : null;
  const panRaw = String(source.get("pan") ?? "").trim();
  const pan = panRaw ? parsePan(panRaw) : null;
  if (charge?.panRequired && !pan) errors.pan = "PAN is required because this book order is more than ₹2,000.";
  if (panRaw && !pan) errors.pan = "Enter a valid PAN.";
  if (Object.keys(errors).length || !phone || !email || !pin || !contact.ok || !contactMobile || !contactEmail || !charge) {
    return { value: null, errors };
  }
  return {
    value: {
      schoolName,
      phone,
      email,
      deliveryAddress,
      district,
      state,
      pin,
      contactName: contact.value,
      contactMobile,
      contactEmail,
      lines: parsed.lines,
      pan,
      charge,
    },
    errors,
  };
}

export type IndividualBookInput = {
  studentName: string;
  parentName: string;
  mobile: string;
  email: string;
  schoolName: string;
  classNumber: number;
  streamId: StreamId;
  quantity: number;
  deliveryAddress: string;
  district: string;
  state: string;
  pin: string;
  pan: string | null;
  charge: Charge;
};

export function readIndividualBookForm(source: FormData): { value: IndividualBookInput | null; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const student = validatePersonName(String(source.get("studentName") ?? ""), "Student name");
  if (!student.ok) errors.studentName = student.message;
  const parent = validatePersonName(String(source.get("parentName") ?? ""), "Parent name");
  if (!parent.ok) errors.parentName = parent.message;
  const mobile = parseIndianMobile(String(source.get("mobile") ?? ""));
  if (!mobile) errors.mobile = "Enter a 10-digit Indian mobile number.";
  const email = parseEmail(String(source.get("email") ?? ""));
  if (!email) errors.email = "Enter a valid email address.";
  const schoolName = String(source.get("schoolName") ?? "").trim();
  if (schoolName.length < 3) errors.schoolName = "Enter the school name.";
  const classNumber = parseClassValue(String(source.get("className") ?? ""));
  if (classNumber === null) errors.className = "Enter the class as 3–10 or III–X.";
  const streamId = String(source.get("streamId") ?? "") as StreamId;
  if (!STREAMS.some((stream) => stream.id === streamId)) errors.streamId = "Select a stream.";
  else if (classNumber !== null && !classIsEligible(classNumber, streamById(streamId).classes)) errors.streamId = "This stream is not open for the selected class.";
  const quantity = Number(String(source.get("quantity") ?? "").trim());
  if (!Number.isInteger(quantity) || quantity < 1) errors.quantity = "Enter the number of books.";
  const deliveryAddress = String(source.get("deliveryAddress") ?? "").trim();
  if (deliveryAddress.length < 10) errors.deliveryAddress = "Enter the complete delivery address.";
  const district = String(source.get("district") ?? "").trim();
  const state = String(source.get("state") ?? "").trim();
  if (district.length < 2) errors.district = "Enter the district.";
  if (state.length < 2) errors.state = "Enter the state.";
  const pin = parsePin(String(source.get("pin") ?? ""));
  if (!pin) errors.pin = "Enter a 6-digit PIN code.";
  const charge = Number.isInteger(quantity) && quantity > 0 ? calculatePrintedBooks(quantity, "individual") : null;
  const panRaw = String(source.get("pan") ?? "").trim();
  const pan = panRaw ? parsePan(panRaw) : null;
  if (charge?.panRequired && !pan) errors.pan = "PAN is required because this book order is more than ₹2,000.";
  if (panRaw && !pan) errors.pan = "Enter a valid PAN.";
  if (Object.keys(errors).length || !student.ok || !parent.ok || !mobile || !email || classNumber === null || !pin || !charge || !STREAMS.some((stream) => stream.id === streamId)) {
    return { value: null, errors };
  }
  return {
    value: {
      studentName: student.value,
      parentName: parent.value,
      mobile,
      email,
      schoolName,
      classNumber,
      streamId,
      quantity,
      deliveryAddress,
      district,
      state,
      pin,
      pan,
      charge,
    },
    errors,
  };
}
