import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { LEARN_COOKIE } from "@/lib/portal/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const jar = await cookies();
  jar.delete(LEARN_COOKIE);
  return NextResponse.redirect(new URL("/learn", request.url), 303);
}
