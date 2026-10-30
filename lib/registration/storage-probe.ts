import { serverKeyValue, supabaseOrigin } from "@/lib/registration/durable";
import { CLIENT_KEY_NAMES } from "@/lib/registration/supabase-inspect";

const PROBE_PAN = "ZZAAZ0000Z";
const PROOF_PATH = "probes/access-check.pdf";
const SHEET_PATH = "probes/access-check.csv";
const PDF = Buffer.from("%PDF-1.1\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");

export type KeyRead = { name: string; status: number | null; count: number | null; leaked: boolean };

export type StorageProbeReport = {
  ok: boolean;
  reason: "ok" | "missing";
  school: {
    insertStatus: number | null;
    serviceCount: number | null;
    clientReads: KeyRead[];
    deleteStatus: number | null;
    remaining: number | null;
  };
  proofs: {
    uploadStatus: number | null;
    serviceReadStatus: number | null;
    publicUrlStatus: number | null;
    unauthenticatedReadStatus: number | null;
    clientReads: KeyRead[];
    wrongMimeStatus: number | null;
    webpStatus: number | null;
    clientUploadStatus: number | null;
    oversizeStatus: number | null;
    deleteStatus: number | null;
    removed: string[];
    afterDeleteStatus: number | null;
    afterDeleteLeaked: boolean;
    remainingPaths: string[];
  };
  sheets: {
    uploadStatus: number | null;
    unauthenticatedReadStatus: number | null;
    clientReadStatus: number | null;
    wrongMimeStatus: number | null;
    deleteStatus: number | null;
    remainingPaths: string[];
  };
  clientBuckets: { name: string; status: number | null; ids: string[]; anyPublic: boolean | null }[];
};

function authHeaders(key: string, contentType?: string): Headers {
  const headers = new Headers();
  headers.set("apikey", key);
  headers.set("accept", "application/json");
  if (key.split(".").length === 3) headers.set("authorization", `Bearer ${key}`);
  if (contentType) headers.set("content-type", contentType);
  return headers;
}

async function call(url: string, init: RequestInit, timeoutMs = 8000): Promise<{ status: number | null; bytes: Buffer; contentRange: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    const bytes = Buffer.from(await response.arrayBuffer());
    return { status: response.status, bytes, contentRange: response.headers.get("content-range") };
  } catch {
    return { status: null, bytes: Buffer.alloc(0), contentRange: null };
  } finally {
    clearTimeout(timer);
  }
}

function countOf(header: string | null): number | null {
  const match = header?.match(/\/(\d+)\s*$/);
  return match ? Number(match[1]) : null;
}

function leakedPdf(status: number | null, bytes: Buffer): boolean {
  return status === 200 && bytes.subarray(0, 5).toString("utf8") === "%PDF-";
}

function presentClientKeys(): { name: string; value: string }[] {
  return CLIENT_KEY_NAMES.flatMap((name) => {
    const value = (process.env[name] ?? "").trim();
    return value.length >= 20 ? [{ name, value }] : [];
  });
}

export async function runStorageProbe(): Promise<StorageProbeReport> {
  const origin = supabaseOrigin();
  const key = serverKeyValue();
  const empty: StorageProbeReport = {
    ok: false,
    reason: "missing",
    school: { insertStatus: null, serviceCount: null, clientReads: [], deleteStatus: null, remaining: null },
    proofs: { uploadStatus: null, serviceReadStatus: null, publicUrlStatus: null, unauthenticatedReadStatus: null, clientReads: [], wrongMimeStatus: null, webpStatus: null, clientUploadStatus: null, oversizeStatus: null, deleteStatus: null, removed: [], afterDeleteStatus: null, afterDeleteLeaked: false, remainingPaths: [] },
    sheets: { uploadStatus: null, unauthenticatedReadStatus: null, clientReadStatus: null, wrongMimeStatus: null, deleteStatus: null, remainingPaths: [] },
    clientBuckets: [],
  };
  if (!origin || !key) return empty;
  const clients = presentClientKeys();
  const [school, proofs, sheets, clientBuckets] = await Promise.all([
    probeSchool(origin, key, clients),
    probeProofs(origin, key, clients),
    probeSheets(origin, key, clients),
    probeBucketLists(origin, clients),
  ]);
  return { ok: true, reason: "ok", school, proofs, sheets, clientBuckets };
}

async function probeSchool(origin: string, key: string, clients: { name: string; value: string }[]): Promise<StorageProbeReport["school"]> {
  const schoolUrl = `${origin}/rest/v1/tejas_schools`;
  const headers = authHeaders(key, "application/json");
  headers.set("prefer", "return=minimal");
  await call(`${schoolUrl}?pan=eq.${PROBE_PAN}`, { method: "DELETE", headers });
  const insertHeaders = authHeaders(key, "application/json");
  insertHeaders.set("prefer", "return=minimal");
  const inserted = await call(schoolUrl, {
    method: "POST",
    headers: insertHeaders,
    body: JSON.stringify({
      school_name: "Tejas Probe School",
      school_address: "Probe Address Lane",
      state_name: "Probe",
      district: "Probe",
      city: "Probe",
      pin_code: "160001",
      pan: PROBE_PAN,
      pan_duplicate: false,
      school_email: "probe@example.test",
      school_mobile: "9876543210",
      affiliation_board: "Probe Board",
      school_category: "Private",
    }),
  });
  const serviceCount = await headCount(origin, key, `pan=eq.${PROBE_PAN}`);
  const clientReads = await Promise.all(clients.map(async (client) => readCount(origin, client.name, client.value)));
  const deleted = await call(`${schoolUrl}?pan=eq.${PROBE_PAN}`, { method: "DELETE", headers });
  const remaining = await headCount(origin, key, `pan=eq.${PROBE_PAN}`);
  return { insertStatus: inserted.status, serviceCount, clientReads, deleteStatus: deleted.status, remaining };
}

async function headCount(origin: string, key: string, filter: string): Promise<number | null> {
  const headers = authHeaders(key);
  headers.set("prefer", "count=exact");
  headers.set("range", "0-0");
  const result = await call(`${origin}/rest/v1/tejas_schools?select=id&${filter}`, { method: "HEAD", headers });
  return countOf(result.contentRange);
}

async function readCount(origin: string, name: string, key: string): Promise<KeyRead> {
  const headers = authHeaders(key);
  headers.set("prefer", "count=exact");
  headers.set("range", "0-0");
  const result = await call(`${origin}/rest/v1/tejas_schools?select=id&pan=eq.${PROBE_PAN}`, { method: "HEAD", headers });
  return { name, status: result.status, count: countOf(result.contentRange), leaked: false };
}

async function probeProofs(origin: string, key: string, clients: { name: string; value: string }[]): Promise<StorageProbeReport["proofs"]> {
  const objectUrl = `${origin}/storage/v1/object/tejas-payment-proofs/${PROOF_PATH}`;
  await call(objectUrl, { method: "DELETE", headers: authHeaders(key) });
  const uploadHeaders = authHeaders(key, "application/pdf");
  uploadHeaders.set("x-upsert", "true");
  const upload = await call(objectUrl, { method: "POST", headers: uploadHeaders, body: new Uint8Array(PDF) });
  const serviceRead = await call(objectUrl, { method: "GET", headers: authHeaders(key) });
  const publicUrl = await call(`${origin}/storage/v1/object/public/tejas-payment-proofs/${PROOF_PATH}`, { method: "GET" });
  const unauthenticated = await call(objectUrl, { method: "GET" });
  const clientReads = await Promise.all(clients.map(async (client) => {
    const result = await call(objectUrl, { method: "GET", headers: authHeaders(client.value) });
    return { name: client.name, status: result.status, count: null, leaked: leakedPdf(result.status, result.bytes) };
  }));
  const wrongMime = await call(`${origin}/storage/v1/object/tejas-payment-proofs/probes/wrong.txt`, {
    method: "POST",
    headers: authHeaders(key, "text/plain"),
    body: "not-a-proof",
  });
  const webp = await call(`${origin}/storage/v1/object/tejas-payment-proofs/probes/wrong.webp`, {
    method: "POST",
    headers: authHeaders(key, "image/webp"),
    body: "RIFF",
  });
  const anon = clients[0];
  const clientUpload = anon
    ? await call(`${origin}/storage/v1/object/tejas-payment-proofs/probes/client.pdf`, { method: "POST", headers: authHeaders(anon.value, "application/pdf"), body: new Uint8Array(PDF) })
    : { status: null };
  const oversize = await call(objectUrl, {
    method: "POST",
    headers: (() => { const h = authHeaders(key, "application/pdf"); h.set("x-upsert", "true"); return h; })(),
    body: new Uint8Array(5_242_881),
  }, 20000);
  const deleted = await removeObjects(origin, key, "tejas-payment-proofs", [
    PROOF_PATH,
    "probes/wrong.txt",
    "probes/wrong.webp",
    "probes/client.pdf",
  ]);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const freshHeaders = authHeaders(key);
  freshHeaders.set("cache-control", "no-cache");
  const after = await call(`${objectUrl}?cb=${Date.now()}`, { method: "GET", headers: freshHeaders });
  const remainingPaths = await listProbePaths(origin, key, "tejas-payment-proofs");
  return {
    uploadStatus: upload.status,
    serviceReadStatus: serviceRead.status,
    publicUrlStatus: publicUrl.status,
    unauthenticatedReadStatus: unauthenticated.status,
    clientReads,
    wrongMimeStatus: wrongMime.status,
    webpStatus: webp.status,
    clientUploadStatus: clientUpload.status,
    oversizeStatus: oversize.status,
    deleteStatus: deleted.status,
    removed: deleted.removed,
    afterDeleteStatus: after.status,
    afterDeleteLeaked: leakedPdf(after.status, after.bytes),
    remainingPaths,
  };
}

async function probeSheets(origin: string, key: string, clients: { name: string; value: string }[]): Promise<StorageProbeReport["sheets"]> {
  const objectUrl = `${origin}/storage/v1/object/tejas-registration-files/${SHEET_PATH}`;
  const sheetHeaders = authHeaders(key, "text/csv");
  sheetHeaders.set("x-upsert", "true");
  const upload = await call(objectUrl, { method: "POST", headers: sheetHeaders, body: "name\nProbe Student\n" });
  const unauthenticated = await call(objectUrl, { method: "GET" });
  const client = clients[0];
  const clientRead = client ? await call(objectUrl, { method: "GET", headers: authHeaders(client.value) }) : { status: null };
  const wrongMime = await call(`${origin}/storage/v1/object/tejas-registration-files/probes/wrong.pdf`, {
    method: "POST",
    headers: authHeaders(key, "application/pdf"),
    body: new Uint8Array(PDF),
  });
  const deleted = await removeObjects(origin, key, "tejas-registration-files", [SHEET_PATH, "probes/wrong.pdf"]);
  return {
    uploadStatus: upload.status,
    unauthenticatedReadStatus: unauthenticated.status,
    clientReadStatus: clientRead.status,
    wrongMimeStatus: wrongMime.status,
    deleteStatus: deleted.status,
    remainingPaths: await listProbePaths(origin, key, "tejas-registration-files"),
  };
}

async function listProbePaths(origin: string, key: string, bucket: string): Promise<string[]> {
  const result = await call(`${origin}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: authHeaders(key, "application/json"),
    body: JSON.stringify({ prefix: "", limit: 100 }),
  });
  try {
    const parsed = JSON.parse(result.bytes.toString("utf8")) as { name?: string }[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => item.name ?? "").filter(Boolean).slice(0, 20);
  } catch {
    return [];
  }
}

async function removeObjects(origin: string, key: string, bucket: string, paths: string[]): Promise<{ status: number | null; removed: string[] }> {
  const listed = await listProbePaths(origin, key, bucket);
  const prefixes = [...new Set([...paths, ...listed.map((name) => name.startsWith("probes/") ? name : `probes/${name}`)])];
  const result = await call(`${origin}/storage/v1/object/${bucket}`, {
    method: "DELETE",
    headers: authHeaders(key, "application/json"),
    body: JSON.stringify({ prefixes }),
  });
  let removed: string[] = [];
  try {
    const parsed = JSON.parse(result.bytes.toString("utf8")) as { name?: string }[];
    if (Array.isArray(parsed)) removed = parsed.map((item) => item.name ?? "").filter((name) => name.startsWith("probes/")).slice(0, 10);
  } catch {
    removed = [];
  }
  return { status: result.status, removed };
}

async function probeBucketLists(origin: string, clients: { name: string; value: string }[]): Promise<StorageProbeReport["clientBuckets"]> {
  return Promise.all(clients.map(async (client) => {
    const result = await call(`${origin}/storage/v1/bucket`, { method: "GET", headers: authHeaders(client.value) });
    let ids: string[] = [];
    let anyPublic: boolean | null = null;
    try {
      const parsed = JSON.parse(result.bytes.toString("utf8")) as { id?: string; public?: boolean }[];
      if (Array.isArray(parsed)) {
        ids = parsed.map((bucket) => String(bucket.id ?? "")).filter(Boolean).slice(0, 20);
        anyPublic = parsed.some((bucket) => bucket.public === true);
      }
    } catch {
      ids = [];
    }
    return { name: client.name, status: result.status, ids, anyPublic };
  }));
}
