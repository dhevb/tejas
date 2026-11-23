import assert from "node:assert/strict";
import test from "node:test";

test("ocr probe route is declared as Node.js runtime and hard-disabled on Production via VERCEL_ENV", async () => {
  const mod = await import("@/app/api/register/ocr-probe/route");
  assert.equal(mod.runtime, "nodejs");
  assert.equal(typeof mod.GET, "function");
  assert.equal(typeof mod.POST, "function");

  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    const response = await mod.GET();
    assert.equal(response.status, 404);
    const body = (await response.json()) as { ok: boolean };
    assert.equal(body.ok, false);
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});
