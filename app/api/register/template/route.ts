import { buildTemplateBuffer } from "@/lib/registration/sheet";

export const runtime = "nodejs";

export function GET() {
  const body = buildTemplateBuffer();
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=\"tejas-2026-27-student-registration.xlsx\"",
      "Cache-Control": "no-store",
    },
  });
}
