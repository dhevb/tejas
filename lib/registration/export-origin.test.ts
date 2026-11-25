import assert from "node:assert/strict";
import test from "node:test";
import {
  TEJAS_PRODUCTION_HOST,
  isAllowedTejasExportHost,
  resolveOwnerExportOrigin,
} from "@/lib/registration/export-origin";

test("allowlist accepts Production and Preview TEJAS hosts only", () => {
  assert.equal(isAllowedTejasExportHost(TEJAS_PRODUCTION_HOST), true);
  assert.equal(isAllowedTejasExportHost("tejas-rh73rhaqj-dhe-projects.vercel.app"), true);
  assert.equal(isAllowedTejasExportHost("tejas-git-feat-owner-dashboard-class-export-c2c54b-dhe-projects.vercel.app"), true);
  assert.equal(isAllowedTejasExportHost("localhost"), true);
  assert.equal(isAllowedTejasExportHost("127.0.0.1:3010"), true);
  assert.equal(isAllowedTejasExportHost("evil.example.com"), false);
  assert.equal(isAllowedTejasExportHost("tejas.dhe.org.in.evil.com"), false);
  assert.equal(isAllowedTejasExportHost("attacker-dhe-projects.vercel.app"), false);
});

test("resolveOwnerExportOrigin ignores attacker x-forwarded-host and uses Host", () => {
  const request = new Request("https://tejas.dhe.org.in/api/register/admin/export?report=complete", {
    headers: {
      host: "tejas.dhe.org.in",
      "x-forwarded-host": "evil.example.com",
      "x-forwarded-proto": "http",
    },
  });
  const result = resolveOwnerExportOrigin(request);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.origin, "https://tejas.dhe.org.in");
  assert.equal(result.source, "host-header");
});

test("resolveOwnerExportOrigin rejects when only untrusted forwarded host is present", () => {
  const request = new Request("https://evil.example.com/api/register/admin/export?report=complete", {
    headers: {
      host: "evil.example.com",
      "x-forwarded-host": "tejas.dhe.org.in",
      "x-forwarded-proto": "https",
    },
  });
  const result = resolveOwnerExportOrigin(request);
  assert.equal(result.ok, false);
});

test("resolveOwnerExportOrigin accepts Preview Host and forces https", () => {
  const host = "tejas-abcdef12-dhe-projects.vercel.app";
  const request = new Request(`https://${host}/api/register/admin/export?report=complete`, {
    headers: {
      host,
      "x-forwarded-proto": "http",
    },
  });
  const result = resolveOwnerExportOrigin(request);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.origin, `https://${host}`);
});

test("resolveOwnerExportOrigin accepts localhost for local QA", () => {
  const request = new Request("http://localhost:3010/api/register/admin/export?report=complete", {
    headers: { host: "localhost:3010" },
  });
  const result = resolveOwnerExportOrigin(request);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.origin, "http://localhost:3010");
});
