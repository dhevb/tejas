import { cookies } from "next/headers";
import { STAFF_COOKIE, sessionIsValid } from "@/lib/registration/auth";

export async function staffAuthorised(): Promise<boolean> {
  const jar = await cookies();
  return sessionIsValid(jar.get(STAFF_COOKIE)?.value);
}
