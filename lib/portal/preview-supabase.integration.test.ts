/**
 * Preview Supabase integration checks for e-book payment/entitlement.
 * Refuses to run against Production hosts. Skips when Preview credentials are unavailable.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const PREVIEW_HOST_ALLOW = new Set([
  "nbeslngnrsagarosuaab.supabase.co",
]);
const PRODUCTION_HOST_DENY = new Set([
  "zapccpipwxduzlnvjdmy.supabase.co",
]);

function loadCandidateEnv(): { url: string | null; key: string | null; source: string; blockedReason: string | null } {
  const files = [".local-qa/.env.preview.pulled", ".env.preview", ".env.local"];
  for (const file of files) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    let url: string | null = null;
    let key: string | null = null;
    for (const line of text.split(/\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match) continue;
      const name = match[1];
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (name === "SUPABASE_URL") url = value;
      if (name === "SUPABASE_SERVICE_ROLE_KEY") key = value;
    }
    if (!url || !key || valueIsPlaceholder(url) || valueIsPlaceholder(key)) {
      return { url, key, source: file, blockedReason: `Preview credentials missing or placeholder in ${file}.` };
    }
    let host = "";
    try {
      host = new URL(url).hostname;
    } catch {
      return { url, key: null, source: file, blockedReason: `SUPABASE_URL in ${file} is not a valid URL.` };
    }
    if (PRODUCTION_HOST_DENY.has(host)) {
      return { url: null, key: null, source: file, blockedReason: `Refusing Production Supabase host ${host}.` };
    }
    if (!PREVIEW_HOST_ALLOW.has(host)) {
      return { url: null, key: null, source: file, blockedReason: `Host ${host} is not the allowlisted Preview project.` };
    }
    return { url, key, source: file, blockedReason: null };
  }
  return { url: null, key: null, source: "none", blockedReason: "No Preview env file with Supabase credentials found." };
}

function valueIsPlaceholder(value: string): boolean {
  return !value || /SENSITIVE|YOUR_|REDACTED|placeholder/i.test(value) || value.length < 20;
}

test("Preview Supabase multi-stream payment integration gate", async (t) => {
  const env = loadCandidateEnv();
  if (env.blockedReason) {
    t.skip(`BLOCKED: ${env.blockedReason}`);
    return;
  }
  assert.ok(env.url && env.key);
  // Remote exercises are intentionally gated until Owner provides non-placeholder Preview service credentials
  // in a local-only file. This file must never target Production.
  t.skip("Preview credentials present but interactive payment OCR fixtures are not wired in this pass; see Phase 2 report BLOCKED section.");
});
