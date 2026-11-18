import assert from "node:assert/strict";
import test from "node:test";

test("staff provisioning stays closed when the portal database is not configured", async () => {
  const saved = {
    url: process.env.SUPABASE_URL,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
    secret: process.env.SUPABASE_SECRET_KEY,
  };
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SECRET_KEY;
  try {
    const { authenticateStaff, createStaffAccount } = await import("./staff-directory");
    const created = await createStaffAccount({ email: "reviewer@example.com", password: "fixture-password" });
    assert.equal(created.ok, false);
    if (!created.ok) assert.match(created.error, /portal database/);
    assert.equal(await authenticateStaff("reviewer@example.com", "fixture-password"), "unavailable");
  } finally {
    if (saved.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = saved.url;
    if (saved.service === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = saved.service;
    if (saved.secret === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = saved.secret;
  }
});
