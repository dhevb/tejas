import { NextResponse } from "next/server";
import { clearLearnCookieHeader, currentStudent } from "@/lib/portal/current";
import { rotateSession } from "@/lib/portal/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const student = await currentStudent();
    if (student) await rotateSession(student.id);
  } catch {
    console.error("student logout could not revoke the stored session");
  }
  const response = NextResponse.redirect(new URL("/learn", request.url), 303);
  response.headers.append("Set-Cookie", clearLearnCookieHeader());
  return response;
}
