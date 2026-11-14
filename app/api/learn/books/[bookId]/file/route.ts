import { bookFileResponse } from "@/lib/portal/book-file";
import { currentStudent } from "@/lib/portal/current";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ bookId: string }> }) {
  const student = await currentStudent();
  const { bookId } = await context.params;
  return bookFileResponse(request, student, bookId);
}
