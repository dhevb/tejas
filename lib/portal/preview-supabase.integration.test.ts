/**
 * Preview Supabase integration for e-book payment/entitlement.
 *
 * - Allowlist: nbeslngnrsagarosuaab.supabase.co only
 * - Hard-deny: zapccpipwxduzlnvjdmy.supabase.co
 * - Credentials from ignored local env files only; never printed
 * - When credentials are missing: FAIL with BLOCKED (not PASS, not a soft skip-as-success)
 * - When credentials are present: run real remote operations (never t.skip)
 */
import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const PREVIEW_HOST = "nbeslngnrsagarosuaab.supabase.co";
const PRODUCTION_HOST = "zapccpipwxduzlnvjdmy.supabase.co";
const STATUS_FILE = path.join(process.cwd(), ".local-qa", "preview-integration-status.json");

type EnvLoad = {
  url: string | null;
  keyPresent: boolean;
  source: string;
  host: string | null;
  blockedReason: string | null;
};

function valueIsPlaceholder(value: string): boolean {
  return !value || /SENSITIVE|YOUR_|REDACTED|placeholder/i.test(value) || value.length < 20;
}

/** Reject truncated or non-service keys (JWT or sb_secret_ of sufficient length). */
function serviceRoleKeyLooksUsable(value: string): boolean {
  if (!value || valueIsPlaceholder(value)) return false;
  if (/^eyJ/.test(value) && value.length >= 100) return true;
  if (/^sb_secret_/.test(value) && value.length >= 40) return true;
  return false;
}

function loadCandidateEnv(): EnvLoad {
  const files = [
    ".local-qa/.env.preview.supabase",
    ".env.preview",
    ".env.local",
    ".local-qa/.env.preview.pulled",
  ];
  for (const file of files) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    let url: string | null = null;
    let key: string | null = null;
    for (const raw of text.split(/\n/)) {
      // Strip BOM/CR/whitespace — Windows CRLF leaves `\r` which breaks `(.*)$` because `.` does not match `\r`.
      const line = raw.replace(/^\uFEFF/, "").replace(/\r/g, "").trim();
      if (!line || line.startsWith("#")) continue;
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (match[1] === "PREVIEW_SUPABASE_URL" || match[1] === "SUPABASE_URL") url = value;
      if (match[1] === "PREVIEW_SUPABASE_SERVICE_ROLE_KEY" || match[1] === "SUPABASE_SERVICE_ROLE_KEY") key = value;
    }
    if (!url || !key || valueIsPlaceholder(url) || valueIsPlaceholder(key) || !serviceRoleKeyLooksUsable(key)) {
      return {
        url,
        keyPresent: Boolean(key && !valueIsPlaceholder(key) && serviceRoleKeyLooksUsable(key)),
        source: file,
        host: null,
        blockedReason: `Preview credentials missing, placeholder, or unusable service-role key shape in ${file}.`,
      };
    }
    let host = "";
    try {
      host = new URL(url).hostname;
    } catch {
      return {
        url: null,
        keyPresent: false,
        source: file,
        host: null,
        blockedReason: `SUPABASE_URL in ${file} is not a valid URL.`,
      };
    }
    if (host === PRODUCTION_HOST) {
      return {
        url: null,
        keyPresent: false,
        source: file,
        host,
        blockedReason: `Refusing Production Supabase host ${host}.`,
      };
    }
    if (host !== PREVIEW_HOST) {
      return {
        url: null,
        keyPresent: false,
        source: file,
        host,
        blockedReason: `Host ${host} is not the allowlisted Preview project ${PREVIEW_HOST}.`,
      };
    }
    return { url, keyPresent: true, source: file, host, blockedReason: null };
  }
  return {
    url: null,
    keyPresent: false,
    source: "none",
    host: null,
    blockedReason: "No Preview env file with Supabase credentials found (.local-qa/.env.preview.supabase recommended).",
  };
}

function writeStatus(status: Record<string, unknown>) {
  mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
  writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
}

async function supabaseRest(url: string, key: string, pathname: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("authorization", `Bearer ${key}`);
  headers.set("accept", "application/json");
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(`${url}${pathname}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = null;
    }
  }
  return { status: response.status, json };
}

test("Preview Supabase e-book payment integration", async () => {
  const env = loadCandidateEnv();
  if (env.blockedReason) {
    writeStatus({
      status: "BLOCKED",
      reason: env.blockedReason,
      hostAllowlist: PREVIEW_HOST,
      productionDenied: PRODUCTION_HOST,
      at: new Date().toISOString(),
    });
    assert.fail(`BLOCKED: ${env.blockedReason}`);
  }

  assert.ok(env.url && env.host === PREVIEW_HOST && env.keyPresent);
  // Load key only inside the running process from the same file (never log it).
  const text = readFileSync(env.source, "utf8");
  let key = "";
  for (const raw of text.split(/\n/)) {
    const line = raw.replace(/^\uFEFF/, "").replace(/\r/g, "").trim();
    const match = line.match(/^(PREVIEW_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY)=(.*)$/);
    if (!match) continue;
    key = match[2].trim().replace(/^["']|["']$/g, "");
  }
  assert.ok(key && !valueIsPlaceholder(key) && serviceRoleKeyLooksUsable(key));

  const marker = `phase21_${Date.now()}`;
  const email = `tejas.phase21.${marker}@example.test`;
  const created: { studentIds: string[]; entitlementIds: string[]; utrKeys: string[] } = {
    studentIds: [],
    entitlementIds: [],
    utrKeys: [],
  };

  try {
    // Probe learn tables exist without dumping rows.
    const studentsProbe = await supabaseRest(
      env.url!,
      key,
      "/rest/v1/tejas_learn_students?select=id&limit=1",
      { method: "GET" },
    );
    if (studentsProbe.status !== 200) {
      writeStatus({
        status: "BLOCKED",
        reason: `tejas_learn_students not readable on Preview (HTTP ${studentsProbe.status}). Schema may be missing.`,
        host: env.host,
        at: new Date().toISOString(),
      });
      assert.fail(`BLOCKED: Preview learn tables not available (HTTP ${studentsProbe.status}). Provide schema proposal — do not apply SQL here.`);
    }

    // Enrolment is exercised through application APIs with env pointing at Preview.
    process.env.SUPABASE_URL = env.url!;
    process.env.SUPABASE_SERVICE_ROLE_KEY = key;
    delete process.env.TEJAS_PORTAL_STORE;

    const { registerStudent, reportPayment, reviewPayment, accessFor, readStudent, portalPersistence } = await import("@/lib/portal/store");
    assert.equal(portalPersistence(), "remote");

    const reg = await registerStudent({
      fullName: "Phase21 Test Student",
      parentName: "Phase21 Parent",
      mobile: "9876500001",
      email,
      schoolName: "Phase21 Test School",
      password: "phase21-pass-8",
      streamIds: ["english", "mathematics", "technology"],
      classLevel: 7,
    });
    assert.equal(reg.ok, true, "multi-stream enrolment must succeed");
    if (!reg.ok) return;
    created.studentIds.push(reg.student.id);

    const student = await readStudent(reg.student.id);
    assert.ok(student);

    // One UTR per stream — exact references.
    const payments = [
      { stream: "english" as const, utr: `P21E${marker}`.slice(0, 20), bookId: "eng-class-07" },
      { stream: "mathematics" as const, utr: `P21M${marker}`.slice(0, 20), bookId: "mat-class-07" },
      { stream: "technology" as const, utr: `P21T${marker}`.slice(0, 20), bookId: "ft-book-1" },
    ];

    for (const payment of payments) {
      const reported = await reportPayment(student!.id, payment.utr, [payment.stream]);
      // Remote RPC currently requires students.stream_id = books.stream_id for report_payment.
      // Primary stream should succeed; secondary streams may be blocked by existing RPC — capture evidence.
      if (!reported.ok && payment.stream !== student!.streamId) {
        writeStatus({
          status: "BLOCKED",
          reason: "tejas_learn_report_payment requires books.stream_id = students.stream_id; secondary-stream payments need Owner-approved RPC/schema change.",
          primaryStream: student!.streamId,
          failedStream: payment.stream,
          error: reported.error,
          at: new Date().toISOString(),
        });
        assert.fail(`BLOCKED: secondary-stream payment refused by existing RPC (${payment.stream}): ${reported.error}`);
      }
      assert.equal(reported.ok, true, reported.ok ? "" : reported.error);
    }

    // Duplicate UTR rejection
    const dup = await reportPayment(student!.id, payments[0].utr, ["english"]);
    assert.equal(dup.ok, true); // idempotent same stream+UTR

    const otherEmail = `tejas.phase21.other.${marker}@example.test`;
    const other = await registerStudent({
      fullName: "Phase21 Other Student",
      parentName: "Phase21 Other Parent",
      mobile: "9876500002",
      email: otherEmail,
      schoolName: "Phase21 Test School",
      password: "phase21-pass-8",
      streamId: "english",
      classLevel: 7,
    });
    assert.equal(other.ok, true);
    if (other.ok) {
      created.studentIds.push(other.student.id);
      const stolen = await reportPayment(other.student.id, payments[0].utr, ["english"]);
      assert.equal(stolen.ok, false);
    }

    // Pending must not unlock
    assert.equal((await accessFor(student!, "eng-class-07")).ok, false);

    const verified = await reviewPayment({
      actor: "phase21-preview",
      studentId: student!.id,
      bookId: payments[0].bookId,
      decision: "verified",
      note: "Phase 2.1 Preview integration verify English only.",
    });
    assert.equal(verified.ok, true);

    // Publication may still block reading; unpaid reason vs unpublished — either is not cross-stream grant.
    const engAccess = await accessFor(student!, "eng-class-07");
    const matAccess = await accessFor(student!, "mat-class-07");
    if (engAccess.ok) {
      assert.equal(matAccess.ok, false);
    } else if (!engAccess.ok) {
      assert.notEqual(engAccess.reason, "wrong_stream");
    }

    writeStatus({
      status: "PASS",
      host: env.host,
      studentCountCreated: created.studentIds.length,
      emailDomain: "@example.test",
      marker,
      at: new Date().toISOString(),
      note: "Personal fields omitted. Test students use example.test emails.",
    });
  } finally {
    // Best-effort cleanup of test students only (example.test marker).
    for (const id of created.studentIds) {
      await supabaseRest(
        env.url!,
        key,
        `/rest/v1/tejas_learn_entitlements?student_id=eq.${encodeURIComponent(id)}`,
        { method: "DELETE", headers: { prefer: "return=minimal" } },
      );
      await supabaseRest(
        env.url!,
        key,
        `/rest/v1/tejas_learn_students?id=eq.${encodeURIComponent(id)}&email=like.*phase21*`,
        { method: "DELETE", headers: { prefer: "return=minimal" } },
      );
    }
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});
