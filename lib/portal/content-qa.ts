/**
 * Content-QA allowlist: one organisation-controlled email may open all
 * published e-books and mock tests in the student-facing UI without payment
 * and without stream/class locks. Ordinary students are unchanged.
 *
 * Set TEJAS_CONTENT_QA_EMAIL in Production. Never commit the password.
 * This identity must not receive staff overview / payment / PII powers.
 */
export function contentQaEmail(): string {
  return (process.env.TEJAS_CONTENT_QA_EMAIL ?? "").trim().toLowerCase();
}

export function isContentQaAccount(email: string | null | undefined): boolean {
  const allowed = contentQaEmail();
  if (!allowed || !email) return false;
  return email.trim().toLowerCase() === allowed;
}
