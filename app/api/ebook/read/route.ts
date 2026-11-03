import { authoriseEbookRead } from "@/lib/orders/ebook";
import { noStore } from "@/lib/registration/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const stream = new URL(request.url).searchParams.get("stream") ?? "";
  const decision = await authoriseEbookRead(request.headers.get("cookie"), stream);
  const response = noStore(decision.body, decision.status);
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}
