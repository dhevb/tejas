import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("export and file routes keep owner auth and no-store cache", () => {
  const exportSource = readFileSync("app/api/register/admin/export/route.ts", "utf8");
  const fileSource = readFileSync("app/api/register/admin/registrations/[reference]/file/route.ts", "utf8");
  assert.ok(exportSource.includes("registrationOwnerAuthorised"));
  assert.ok(exportSource.includes("resolveOwnerExportOrigin"));
  assert.ok(exportSource.includes('"Cache-Control": "no-store"') || exportSource.includes("Cache-Control\": \"no-store\""));
  assert.ok(!exportSource.includes("x-forwarded-host"));
  assert.ok(fileSource.includes("registrationOwnerAuthorised"));
  assert.ok(fileSource.includes("referenceIsValid"));
  assert.ok(fileSource.includes("Cache-Control\": \"no-store\"") || fileSource.includes('"Cache-Control": "no-store"'));
  assert.ok(!fileSource.includes("getPublicUrl"));
  assert.ok(!exportSource.includes("getPublicUrl"));
});
