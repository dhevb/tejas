import assert from "node:assert/strict";
import test from "node:test";
import {
  ALLOWED_PREVIEW_ORIGIN,
  ALLOWED_PREVIEW_REF,
  PRODUCTION_REF,
  buildSeedSpecs,
  decideRegistrationSeedAction,
  parsePreviewSupabaseUrl,
  proofUploadsEnabled,
  resolvePreviewSeedConfig,
  storageUploadHeaders,
  summarizeSeedCatalog,
  validatePreviewServiceRoleKey,
} from "./seed-preview-synthetic.mjs";

const VALID_KEY = "preview-service-role-key-for-tests-only";

test("allowlist accepts only nbeslngnrsagarosuaab Preview origin", () => {
  const ok = parsePreviewSupabaseUrl(ALLOWED_PREVIEW_ORIGIN);
  assert.equal(ok.ok, true);
  assert.equal(ok.projectRef, ALLOWED_PREVIEW_REF);
  assert.equal(ok.origin, ALLOWED_PREVIEW_ORIGIN);

  const trailing = parsePreviewSupabaseUrl(`${ALLOWED_PREVIEW_ORIGIN}/`);
  assert.equal(trailing.ok, true);
  assert.equal(trailing.projectRef, ALLOWED_PREVIEW_REF);
});

test("allowlist rejects Production project ref", () => {
  const result = parsePreviewSupabaseUrl(`https://${PRODUCTION_REF}.supabase.co`);
  assert.equal(result.ok, false);
  assert.match(result.error, /Production/i);
});

test("allowlist rejects another non-Production Supabase project", () => {
  const result = parsePreviewSupabaseUrl("https://abcdefghijklmnop.supabase.co");
  assert.equal(result.ok, false);
  assert.match(result.error, /must be nbeslngnrsagarosuaab\.supabase\.co/);
});

test("allowlist rejects malformed, http, path, query, and missing URL", () => {
  assert.equal(parsePreviewSupabaseUrl("").ok, false);
  assert.equal(parsePreviewSupabaseUrl(undefined).ok, false);
  assert.equal(parsePreviewSupabaseUrl("not-a-url").ok, false);
  assert.equal(parsePreviewSupabaseUrl(`http://${ALLOWED_PREVIEW_REF}.supabase.co`).ok, false);
  assert.equal(parsePreviewSupabaseUrl(`${ALLOWED_PREVIEW_ORIGIN}/rest/v1`).ok, false);
  assert.equal(parsePreviewSupabaseUrl(`${ALLOWED_PREVIEW_ORIGIN}?x=1`).ok, false);
  assert.equal(parsePreviewSupabaseUrl(`https://user:pass@${ALLOWED_PREVIEW_REF}.supabase.co`).ok, false);
});

test("resolvePreviewSeedConfig requires PREVIEW_* only and never uses SUPABASE_* fallbacks", () => {
  const denied = resolvePreviewSeedConfig({
    SUPABASE_URL: ALLOWED_PREVIEW_ORIGIN,
    SUPABASE_SERVICE_ROLE_KEY: VALID_KEY,
  });
  assert.equal(denied.ok, false);

  const productionEnv = resolvePreviewSeedConfig({
    PREVIEW_SUPABASE_URL: `https://${PRODUCTION_REF}.supabase.co`,
    PREVIEW_SUPABASE_SERVICE_ROLE_KEY: VALID_KEY,
  });
  assert.equal(productionEnv.ok, false);

  const otherProject = resolvePreviewSeedConfig({
    PREVIEW_SUPABASE_URL: "https://zzzzzzzzzzzzzzzzzz.supabase.co",
    PREVIEW_SUPABASE_SERVICE_ROLE_KEY: VALID_KEY,
  });
  assert.equal(otherProject.ok, false);

  const ok = resolvePreviewSeedConfig({
    PREVIEW_SUPABASE_URL: ALLOWED_PREVIEW_ORIGIN,
    PREVIEW_SUPABASE_SERVICE_ROLE_KEY: VALID_KEY,
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.projectRef, ALLOWED_PREVIEW_REF);
  assert.equal(ok.proofUploadsEnabled, false);
});

test("service role key must be present and long enough", () => {
  assert.equal(validatePreviewServiceRoleKey("").ok, false);
  assert.equal(validatePreviewServiceRoleKey("short").ok, false);
  assert.equal(validatePreviewServiceRoleKey(VALID_KEY).ok, true);
});

test("proof uploads disabled by default and enabled only with PREVIEW_SEED_UPLOAD_PROOFS=1", () => {
  assert.equal(proofUploadsEnabled(undefined), false);
  assert.equal(proofUploadsEnabled(""), false);
  assert.equal(proofUploadsEnabled("0"), false);
  assert.equal(proofUploadsEnabled("true"), false);
  assert.equal(proofUploadsEnabled("yes"), false);
  assert.equal(proofUploadsEnabled("1"), true);

  const off = resolvePreviewSeedConfig({
    PREVIEW_SUPABASE_URL: ALLOWED_PREVIEW_ORIGIN,
    PREVIEW_SUPABASE_SERVICE_ROLE_KEY: VALID_KEY,
  });
  assert.equal(off.proofUploadsEnabled, false);

  const on = resolvePreviewSeedConfig({
    PREVIEW_SUPABASE_URL: ALLOWED_PREVIEW_ORIGIN,
    PREVIEW_SUPABASE_SERVICE_ROLE_KEY: VALID_KEY,
    PREVIEW_SEED_UPLOAD_PROOFS: "1",
  });
  assert.equal(on.proofUploadsEnabled, true);
});

test("storage uploads never set x-upsert overwrite", () => {
  const headers = storageUploadHeaders("image/png");
  assert.equal(headers["x-upsert"], "false");
  assert.equal(headers["content-type"], "image/png");
});

test("skip-existing never overwrites registration rows", () => {
  assert.deepEqual(decideRegistrationSeedAction(true), { action: "skip_existing", overwrite: false });
  assert.deepEqual(decideRegistrationSeedAction(false), { action: "insert", overwrite: false });
});

test("catalog counts are exact (5 regs / 8 students / 5 payments / 5 xlsx / 3 proof candidates)", () => {
  const specs = buildSeedSpecs();
  const summary = summarizeSeedCatalog(specs);
  assert.equal(summary.registrations, 5);
  assert.equal(summary.uniqueStudents, 8);
  assert.equal(summary.payments, 5);
  assert.equal(summary.xlsxFiles, 5);
  assert.equal(summary.proofFilesIfOptIn, 3);
  assert.deepEqual(summary.statusCounts, {
    awaiting_payment: 1,
    reported: 1,
    confirmed: 1,
    rejected: 1,
    refund_pending: 1,
  });
  assert.equal(specs.filter((s) => s.withProof).length, 3);
  assert.equal(
    specs.reduce((n, s) => n + s.students.length, 0),
    8,
  );
});
