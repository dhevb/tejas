export const REGISTRATION_REQUEST_MS = 25_000;

export type RegistrationReply = {
  ok?: boolean;
  formErrors?: string[];
  fieldErrors?: Record<string, string>;
  rowErrors?: { row: number; messages: string[] }[];
  registration?: { reference?: string };
};

export type RegistrationOutcome =
  | { state: "confirmed"; reference: string }
  | { state: "rejected"; formErrors: string[]; fieldErrors: Record<string, string>; rowErrors: { row: number; messages: string[] }[] };

export function registrationTransportMessage(kind: "timeout" | "unreachable"): string {
  if (kind === "timeout") {
    return "The request timed out. It may still be processing. Stay on this page and try again. A repeat uses the same submission and does not create a second registration.";
  }
  return "The registration could not be confirmed. Check the connection and try again from this page. A repeat does not create a second registration.";
}

export function interpretRegistrationReply(body: RegistrationReply | null): RegistrationOutcome {
  const reference = body?.registration?.reference?.trim() ?? "";
  if (body?.ok === true && reference) return { state: "confirmed", reference };
  const formErrors = (body?.formErrors ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
  return {
    state: "rejected",
    formErrors: formErrors.length > 0 ? formErrors : ["The registration was not saved. No registration was confirmed."],
    fieldErrors: body?.fieldErrors ?? {},
    rowErrors: body?.rowErrors ?? [],
  };
}

export async function readRegistrationReply(response: Response): Promise<RegistrationReply | null> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    const parsed = JSON.parse(text) as RegistrationReply;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
