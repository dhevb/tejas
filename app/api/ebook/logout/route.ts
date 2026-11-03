import { EBOOK_COOKIE } from "@/lib/orders/ebook";
import { noStore, sameOrigin } from "@/lib/registration/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return noStore({ ok: false }, 403);
  const response = noStore({ ok: true });
  response.headers.append("Set-Cookie", `${EBOOK_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  return response;
}
