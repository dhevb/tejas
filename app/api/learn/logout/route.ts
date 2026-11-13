import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { currentStudent } from "@/lib/portal/current";
import { LEARN_COOKIE } from "@/lib/portal/session";
import { rotateSession } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const student = await currentStudent();
  if (student) await rotateSession(student.id);
  const jar = await cookies();
  jar.delete(LEARN_COOKIE);
  return NextResponse.redirect(new URL("/learn", request.url), 303);
}
