import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const PDFS = [
  "public/documents/tejas-olympiad-2026-27-brochure.pdf",
  "public/documents/tejas-olympiad-2026-27-invitation.pdf",
  "public/documents/dhe-english-olympiad-2025-brief-report.pdf",
] as const;

test("approved official document PDFs are published", () => {
  for (const file of PDFS) {
    assert.equal(existsSync(file), true, file);
    assert.ok(readFileSync(file).byteLength > 10_000, file);
  }
});

test("documents page uses schools/register and approved facts", () => {
  const page = readFileSync("app/documents/page.tsx", "utf8");
  assert.match(page, /\/schools\/register/);
  assert.match(page, /REGISTRATION_CLOSES_LABEL/);
  assert.match(page, /RESULT_PAGE_SENTENCE/);
  assert.match(page, /cash prizes, medals and e-certificates/i);
  assert.equal(page.includes("forms.gle"), false);
  assert.equal(page.includes("20 November 2026"), false);
});

test("navigation and sitemap expose /documents", () => {
  assert.match(readFileSync("config/navigation.ts", "utf8"), /href: "\/documents"/);
  assert.match(readFileSync("app/sitemap.ts", "utf8"), /"\/documents"/);
});
