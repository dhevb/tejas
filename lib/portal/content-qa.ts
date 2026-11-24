/**
 * Content-QA allowlist: one organisation-controlled account may open all
 * published e-books and mock tests in the student-facing UI without payment
 * and without stream/class locks, and may start a new mock attempt when the
 * global retake flag is off. Ordinary students are unchanged.
 *
 * Prefer TEJAS_CONTENT_QA_STUDENT_ID (authenticated account UUID from the
 * signed session → DB load). Fall back to TEJAS_CONTENT_QA_EMAIL matched
 * against the server-loaded student email only — never against client body,
 * headers, or query parameters.
 *
 * Never commit the password. This identity must not receive staff overview /
 * payment / PII powers.
 */

export type ContentQaIdentity = {
  id: string;
  email: string;
};

export function contentQaStudentId(): string {
  return (process.env.TEJAS_CONTENT_QA_STUDENT_ID ?? "").trim();
}

export function contentQaEmail(): string {
  return (process.env.TEJAS_CONTENT_QA_EMAIL ?? "").trim().toLowerCase();
}

/** Exact email match helper (server-loaded email only). Prefer isContentQaStudent. */
export function isContentQaAccount(email: string | null | undefined): boolean {
  const allowed = contentQaEmail();
  if (!allowed || !email) return false;
  return email.trim().toLowerCase() === allowed;
}

/**
 * True only for the dedicated content-QA identity after server-side session
 * resolution (cookie → studentId → readStudent). When TEJAS_CONTENT_QA_STUDENT_ID
 * is set, the stable UUID wins and email is ignored for privilege decisions.
 */
export function isContentQaStudent(student: ContentQaIdentity | null | undefined): boolean {
  if (!student?.id) return false;
  const allowedId = contentQaStudentId();
  if (allowedId) return student.id === allowedId;
  return isContentQaAccount(student.email);
}

/**
 * Retakes stay closed for ordinary learners unless TEJAS_PORTAL_RETAKES=allow.
 * The dedicated content-QA account may retake without enabling the global flag.
 */
export function retakesAllowedFor(student: ContentQaIdentity): boolean {
  if (process.env.TEJAS_PORTAL_RETAKES === "allow") return true;
  return isContentQaStudent(student);
}
