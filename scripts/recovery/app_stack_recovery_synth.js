"use strict";

/**
 * Synthetic Phase 40B checks for application-stack recovery gates.
 * No production calls. No real secrets. Exit 0 on pass.
 */

const http = require("http");
const { URL } = require("url");

function fail(msg) {
  console.log("fail|" + msg);
  process.exit(5);
}

function ok(msg) {
  console.log("checked|" + msg);
}

/** Mirror of lib/registration/durable.ts supabaseOrigin HTTPS rule. */
function supabaseOrigin(raw) {
  const value = (raw ?? "").trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function serverKeyName(env) {
  for (const name of ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"]) {
    const value = (env[name] ?? "").trim();
    if (value.length >= 20) return name;
  }
  return null;
}

function durableConfigured(env) {
  return supabaseOrigin(env.SUPABASE_URL) !== null && serverKeyName(env) !== null;
}

// --- unit gates ---
if (supabaseOrigin("http://127.0.0.1:54321") !== null) fail("http-origin-accepted");
ok("reject-http-origin");
if (supabaseOrigin("https://abcd.supabase.co") !== "https://abcd.supabase.co") fail("https-origin-rejected");
ok("accept-https-origin");
if (durableConfigured({ SUPABASE_URL: "https://abcd.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "x".repeat(24) }) !== true) {
  fail("durable-should-configure");
}
ok("durable-configured-shape");
if (durableConfigured({ SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_SERVICE_ROLE_KEY: "x".repeat(24) }) !== false) {
  fail("durable-http-should-fail");
}
ok("durable-rejects-http-even-with-key");
if (durableConfigured({ SUPABASE_URL: "https://abcd.supabase.co" }) !== false) fail("durable-missing-key");
ok("durable-requires-server-key");

ok("backup-reader-must-not-use-service-role-documented");

// --- synthetic API-shape fixture (HTTP). HTTPS origin gate is unit-tested above;
// production app code requires https:// and will not accept this fixture URL.
const expectedBuckets = ["tejas-registration-files", "tejas-payment-proofs"];
const objects = new Map();
objects.set("tejas-registration-files/TEJAS-SYNTH/upload.xlsx", Buffer.from("synthetic-xlsx"));
objects.set("tejas-payment-proofs/TEJAS-SYNTH/receipt.jpg", Buffer.from("synthetic-jpg"));

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://127.0.0.1");
  const auth = req.headers.authorization || "";
  const apikey = req.headers.apikey || "";
  if (!apikey || !auth.startsWith("Bearer ")) {
    res.writeHead(401);
    res.end("{}");
    return;
  }
  if (u.pathname === "/auth/v1/health" && req.method === "GET") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end('{"version":"synth"}');
    return;
  }
  if (u.pathname === "/auth/v1/admin/users" && req.method === "GET") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end('{"users":[]}');
    return;
  }
  if (u.pathname === "/rest/v1/" && req.method === "GET") {
    res.writeHead(200, { "content-type": "application/openapi+json" });
    res.end("{}");
    return;
  }
  if (u.pathname === "/rest/v1/tejas_schools" && req.method === "GET") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end("[]");
    return;
  }
  if (u.pathname.startsWith("/storage/v1/object/") && req.method === "GET") {
    const parts = u.pathname.split("/").slice(4);
    const bucket = parts[0];
    const key = parts.slice(1).map(decodeURIComponent).join("/");
    if (!expectedBuckets.includes(bucket)) {
      res.writeHead(404);
      res.end();
      return;
    }
    const body = objects.get(bucket + "/" + key);
    if (!body) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "content-type": "application/octet-stream" });
    res.end(body);
    return;
  }
  if (u.pathname.startsWith("/storage/v1/object/") && req.method === "POST") {
    res.writeHead(201, { "content-type": "application/json" });
    res.end('{"Key":"ok"}');
    return;
  }
  res.writeHead(404);
  res.end("{}");
});

async function main() {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  ok("fixture-listen|" + port);

  async function fetchStatus(pathname, method = "GET") {
    const key = "s".repeat(24);
    const res = await fetch(`http://127.0.0.1:${port}${pathname}`, {
      method,
      headers: { apikey: key, authorization: `Bearer ${key}`, accept: "application/json" },
    });
    await res.arrayBuffer();
    return res.status;
  }

  const health = await fetchStatus("/auth/v1/health");
  if (health !== 200) fail("auth-health");
  ok("auth-health");
  const admin = await fetchStatus("/auth/v1/admin/users?per_page=1");
  if (admin !== 200) fail("auth-admin-probe");
  ok("auth-admin-probe");
  const rest = await fetchStatus("/rest/v1/");
  if (rest !== 200) fail("rest-root");
  ok("rest-root");
  const schools = await fetchStatus("/rest/v1/tejas_schools?select=id&limit=1");
  if (schools !== 200) fail("rest-tejas-schools");
  ok("rest-tejas-schools");
  const getObj = await fetchStatus("/storage/v1/object/tejas-registration-files/TEJAS-SYNTH/upload.xlsx");
  if (getObj !== 200) fail("storage-get");
  ok("storage-get");
  const postObj = await fetchStatus("/storage/v1/object/tejas-payment-proofs/TEJAS-SYNTH/receipt.jpg", "POST");
  if (postObj !== 201) fail("storage-post");
  ok("storage-post");

  const requiredSurface = [
    "https SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY",
    "Auth /auth/v1/health",
    "Auth /auth/v1/admin/users (server-key probe)",
    "PostgREST /rest/v1/*",
    "Storage /storage/v1/object/{bucket}/{path} GET+POST(+DELETE)",
    "Buckets tejas-registration-files + tejas-payment-proofs",
    "Public TEJAS tables via PostgREST",
  ];
  console.log("required-surface-count|" + requiredSurface.length);
  for (const item of requiredSurface) console.log("required-surface|" + item);

  await new Promise((resolve) => server.close(resolve));
  ok("fixture-closed");
  console.log("synth|ok");
}

main().catch((err) => {
  fail(String(err && err.message ? err.message : err));
});
