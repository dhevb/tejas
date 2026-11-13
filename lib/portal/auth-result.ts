export async function authResult(response: Response, fallback: string): Promise<{ ok: true } | { ok: false; error: string }> {
  let body: { ok?: boolean; error?: string } | null = null;
  try {
    body = (await response.json()) as { ok?: boolean; error?: string };
  } catch {
    body = null;
  }
  if (!response.ok || body?.ok !== true) return { ok: false, error: body?.error || fallback };
  return { ok: true };
}
