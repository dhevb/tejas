import { serverKeyValue, supabaseOrigin } from "@/lib/registration/durable";

/** Tables the prepared registration migration would create. Column lists are names only. */
export const EXPECTED_TABLES: Record<string, readonly string[]> = {
  tejas_schools: ["id", "school_name", "school_address", "state_name", "district", "city", "pin_code", "pan", "pan_duplicate", "school_email", "school_mobile", "affiliation_board", "affiliation_number", "school_category", "created_at"],
  tejas_principals: ["school_id", "full_name", "mobile", "email", "designation"],
  tejas_coordinators: ["school_id", "full_name", "mobile", "email", "designation"],
  tejas_registrations: ["id", "school_id", "reference", "status", "created_at"],
  tejas_students: ["id", "registration_id", "full_name", "class_label", "section_name", "roll_number", "date_of_birth", "parent_name", "parent_mobile", "parent_email"],
  tejas_registration_streams: ["student_id", "stream_name"],
  tejas_payments: ["id", "registration_id", "status", "mode", "paid_on", "payer_name", "transaction_reference", "amount_due"],
  tejas_payment_proofs: ["payment_id", "storage_path", "content_type"],
  tejas_book_orders: ["registration_id", "quantity", "amount"],
  tejas_ebook_access: ["registration_id", "student_count", "amount", "activated"],
  tejas_admin_users: ["id", "email", "role_name"],
  tejas_audit_logs: ["id", "registration_id", "actor", "action_name", "note", "created_at"],
};

export const EXPECTED_BUCKET = {
  id: "tejas-payment-proofs",
  public: false,
  fileSizeLimit: 5_242_880,
  mimeTypes: ["image/jpeg", "image/png", "application/pdf"],
} as const;

const TABLE_NAME = /^[a-z_][a-z0-9_]*$/;
const SECRETISH = /sb_secret_[A-Za-z0-9_-]{8,}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/;
const TABLE_QUERY =
  "select table_schema, table_name from information_schema.tables where table_schema in ('public','storage') and table_type = 'BASE TABLE' order by 1, 2";

export type ColumnReport = { name: string; type: string; format: string | null; required: boolean };

export type BucketReport = { id: string; public: boolean; fileSizeLimit: number | null; mimeTypes: string[] | null };

export type SqlAttempt = { method: string; status: number | null; parsed: boolean };

export const CLIENT_KEY_NAMES = ["ANON", "SUPABASE_ANON_KEY", "SUPABASE_PUBLISHER_KEY", "Publishable_key"] as const;

export const DATABASE_ACCESS_NAMES = ["DATABASE_URL", "SUPABASE_DB_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING", "SUPABASE_ACCESS_TOKEN", "SUPABASE_DB_PASSWORD"] as const;

export type ClientProbe = {
  name: string;
  present: boolean;
  restStatus: number | null;
  rowCount: number | null;
  storageStatus: number | null;
  openApiStatus: number | null;
  seesTejasSchools: boolean | null;
};

export type InspectReport = {
  ok: boolean;
  reason: "ok" | "missing" | "unreachable";
  commit: string | null;
  openApiTables: string[];
  columns: { table: string; columns: ColumnReport[] }[];
  truncated: boolean;
  sqlAttempts: SqlAttempt[];
  sqlTables: string[] | null;
  buckets: BucketReport[];
  rowCounts: { table: string; count: number | null; httpStatus: number | null }[];
  comparison: ReturnType<typeof compareExpected>;
  clientProbes: ClientProbe[];
  databaseAccess: Record<string, boolean>;
};

export function presenceMap(names: readonly string[], env: Record<string, string | undefined>, minimum: number): Record<string, boolean> {
  return Object.fromEntries(names.map((name) => [name, (env[name] ?? "").trim().length >= minimum]));
}

function scrub(value: string): string {
  return SECRETISH.test(value) ? "[redacted]" : value;
}

function headers(key: string, accept = "application/json"): Headers {
  const h = new Headers();
  h.set("apikey", key);
  h.set("authorization", `Bearer ${key}`);
  h.set("accept", accept);
  return h;
}

async function statusAndText(url: string, init: RequestInit, maxChars: number): Promise<{ status: number | null; text: string; contentRange: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    const text = await response.text();
    return { status: response.status, text: text.slice(0, maxChars), contentRange: response.headers.get("content-range") };
  } catch {
    return { status: null, text: "", contentRange: null };
  } finally {
    clearTimeout(timer);
  }
}

export function parseOpenApiDocument(text: string): { tables: string[]; columns: { table: string; columns: ColumnReport[] }[]; truncated: boolean } {
  try {
    const spec = JSON.parse(text) as { paths?: Record<string, unknown>; definitions?: Record<string, { properties?: Record<string, { type?: unknown; format?: unknown }>; required?: unknown }> };
    const names = new Set<string>();
    for (const path of Object.keys(spec.paths ?? {})) {
      const name = path.split("/").filter(Boolean)[0] ?? "";
      if (TABLE_NAME.test(name) && !name.startsWith("rpc")) names.add(name);
    }
    const columns: { table: string; columns: ColumnReport[] }[] = [];
    let truncated = false;
    for (const [rawName, definition] of Object.entries(spec.definitions ?? {})) {
      if (!TABLE_NAME.test(rawName)) continue;
      names.add(rawName);
      const required = new Set(Array.isArray(definition.required) ? definition.required.filter((item): item is string => typeof item === "string") : []);
      const properties = definition.properties ?? {};
      const entries = Object.entries(properties);
      if (entries.length > 80) truncated = true;
      columns.push({
        table: scrub(rawName),
        columns: entries.slice(0, 80).map(([name, property]) => ({
          name: scrub(name),
          type: typeof property.type === "string" ? property.type : "unknown",
          format: typeof property.format === "string" ? property.format.slice(0, 40) : null,
          required: required.has(name),
        })),
      });
    }
    const tables = [...names].map(scrub).sort();
    const limitedTables = tables.slice(0, 100);
    const limitedColumns = columns.filter((item) => limitedTables.includes(item.table)).slice(0, 100);
    return { tables: limitedTables, columns: limitedColumns, truncated: truncated || tables.length > 100 || columns.length > 100 };
  } catch {
    return { tables: [], columns: [], truncated: false };
  }
}

export function namesFromSql(text: string): string[] | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    const rows = Array.isArray(parsed) ? parsed : (parsed as { result?: unknown }).result;
    if (!Array.isArray(rows)) return null;
    return rows
      .map((row) => {
        if (!row || typeof row !== "object") return "";
        const record = row as { table_schema?: unknown; table_name?: unknown };
        if (typeof record.table_name !== "string" || !TABLE_NAME.test(record.table_name)) return "";
        const schema = typeof record.table_schema === "string" && TABLE_NAME.test(record.table_schema) ? record.table_schema : "public";
        return scrub(`${schema}.${record.table_name}`);
      })
      .filter(Boolean)
      .sort();
  } catch {
    return null;
  }
}

export function parseBuckets(text: string): BucketReport[] {
  try {
    const parsed = JSON.parse(text) as { id?: unknown; name?: unknown; public?: unknown; file_size_limit?: unknown; allowed_mime_types?: unknown }[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 50).map((bucket) => {
      const id = typeof bucket.id === "string" ? bucket.id : typeof bucket.name === "string" ? bucket.name : "";
      const limit = typeof bucket.file_size_limit === "number" ? bucket.file_size_limit : typeof bucket.file_size_limit === "string" && /^\d+$/.test(bucket.file_size_limit) ? Number(bucket.file_size_limit) : null;
      const mime = Array.isArray(bucket.allowed_mime_types) ? bucket.allowed_mime_types.filter((item): item is string => typeof item === "string").slice(0, 20).map(scrub) : null;
      return { id: scrub(id).slice(0, 80), public: bucket.public === true, fileSizeLimit: limit, mimeTypes: mime };
    }).filter((bucket) => bucket.id.length > 0);
  } catch {
    return [];
  }
}

function countFromContentRange(header: string | null): number | null {
  const match = header?.match(/\/(\d+)\s*$/);
  if (!match) return null;
  const count = Number(match[1]);
  return Number.isSafeInteger(count) ? count : null;
}

function projectRef(origin: string): string | null {
  try {
    const ref = new URL(origin).hostname.split(".")[0] ?? "";
    return /^[a-z0-9]{12,30}$/.test(ref) ? ref : null;
  } catch {
    return null;
  }
}

function commitLabel(): string | null {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? "";
  return /^[0-9a-f]{7,40}$/.test(sha) ? sha.slice(0, 12) : null;
}

export function compareExpected(input: { openApiTables: string[]; columns: { table: string; columns: ColumnReport[] }[]; sqlTables: string[] | null; buckets: BucketReport[] }) {
  const expected = Object.keys(EXPECTED_TABLES);
  const openApi = new Set(input.openApiTables);
  const openApiMissingTables = expected.filter((table) => !openApi.has(table));
  const openApiPresentTables = expected.filter((table) => openApi.has(table));
  const described = new Set(input.columns.map((item) => item.table));
  const openApiUndescribedTables = openApiPresentTables.filter((table) => !described.has(table));
  const openApiExtraTejasTables = input.openApiTables.filter((table) => table.startsWith("tejas_") && !expected.includes(table));
  const columnGaps = input.columns
    .filter((item) => expected.includes(item.table))
    .map((item) => {
      const live = new Set(item.columns.map((column) => column.name));
      const wanted = EXPECTED_TABLES[item.table] ?? [];
      return {
        table: item.table,
        missing: wanted.filter((column) => !live.has(column)),
        extra: item.columns.map((column) => column.name).filter((column) => !wanted.includes(column)),
      };
    })
    .filter((item) => item.missing.length > 0 || item.extra.length > 0);
  const sqlNames = input.sqlTables?.map((name) => name.split(".").pop() ?? name) ?? null;
  const sqlSet = sqlNames ? new Set(sqlNames) : null;
  const bucket = input.buckets.find((item) => item.id === EXPECTED_BUCKET.id) ?? null;
  const mimeOk = bucket?.mimeTypes ? EXPECTED_BUCKET.mimeTypes.every((type) => bucket.mimeTypes?.includes(type)) && bucket.mimeTypes.length === EXPECTED_BUCKET.mimeTypes.length : null;
  return {
    openApiMissingTables,
    openApiPresentTables,
    openApiUndescribedTables,
    openApiExtraTejasTables,
    columnGaps,
    sqlMissingTables: sqlSet ? expected.filter((table) => !sqlSet.has(table)) : null,
    sqlExtraPublicTables: input.sqlTables?.filter((name) => name.startsWith("public.") && !expected.includes(name.slice("public.".length))) ?? null,
    bucket: {
      present: bucket !== null,
      public: bucket?.public ?? null,
      fileSizeLimit: bucket?.fileSizeLimit ?? null,
      mimeTypes: bucket?.mimeTypes ?? null,
      private: bucket ? bucket.public === false : null,
      sizeOk: bucket ? bucket.fileSizeLimit === EXPECTED_BUCKET.fileSizeLimit : null,
      mimeOk,
    },
    schemaSource: input.sqlTables ? "sql" as const : input.openApiTables.length > 0 || input.columns.length > 0 ? "openapi" as const : "none" as const,
    indexesVisible: false,
    policiesVisible: false,
    backupVerified: false as const,
  };
}

function clientHeaders(key: string, accept = "application/json"): Headers {
  const h = new Headers();
  h.set("apikey", key);
  h.set("accept", accept);
  if (key.split(".").length === 3) h.set("authorization", `Bearer ${key}`);
  return h;
}

function absentProbe(name: string, present: boolean): ClientProbe {
  return { name, present, restStatus: null, rowCount: null, storageStatus: null, openApiStatus: null, seesTejasSchools: null };
}

async function probeClientKey(origin: string, name: string): Promise<ClientProbe> {
  const key = (process.env[name] ?? "").trim();
  if (key.length < 20) return absentProbe(name, false);
  const [rest, storage, spec] = await Promise.all([
    statusAndText(`${origin}/rest/v1/tejas_schools?select=id`, { method: "HEAD", headers: (() => { const h = clientHeaders(key); h.set("prefer", "count=exact"); h.set("range", "0-0"); return h; })() }, 0),
    statusAndText(`${origin}/storage/v1/bucket`, { method: "GET", headers: clientHeaders(key) }, 0),
    statusAndText(`${origin}/rest/v1/`, { method: "GET", headers: clientHeaders(key, "application/openapi+json") }, 3_000_000),
  ]);
  const seesTejasSchools = spec.status === 200 ? parseOpenApiDocument(spec.text).tables.includes("tejas_schools") : null;
  return {
    name,
    present: true,
    restStatus: rest.status,
    rowCount: countFromContentRange(rest.contentRange),
    storageStatus: storage.status,
    openApiStatus: spec.status,
    seesTejasSchools,
  };
}

export async function inspectSupabase(): Promise<InspectReport> {
  const databaseAccess = presenceMap(DATABASE_ACCESS_NAMES, process.env, 8);
  const origin = supabaseOrigin();
  const key = serverKeyValue();
  if (!origin || !key) {
    const comparison = compareExpected({ openApiTables: [], columns: [], sqlTables: null, buckets: [] });
    return {
      ok: false,
      reason: "missing",
      commit: commitLabel(),
      openApiTables: [],
      columns: [],
      truncated: false,
      sqlAttempts: [],
      sqlTables: null,
      buckets: [],
      rowCounts: [],
      comparison,
      clientProbes: CLIENT_KEY_NAMES.map((name) => absentProbe(name, (process.env[name] ?? "").trim().length >= 20)),
      databaseAccess,
    };
  }
  const ref = projectRef(origin);
  const sqlTargets: { method: string; url: string }[] = [];
  if (ref) sqlTargets.push({ method: "management", url: `https://api.supabase.com/v1/projects/${ref}/database/query` });
  sqlTargets.push({ method: "pg", url: `${origin}/pg/query` }, { method: "pg-meta", url: `${origin}/pg-meta/default/query` });
  const [spec, bucketRes, sqlAttempts] = await Promise.all([
    statusAndText(`${origin}/rest/v1/`, { method: "GET", headers: headers(key, "application/openapi+json") }, 3_000_000),
    statusAndText(`${origin}/storage/v1/bucket`, { method: "GET", headers: headers(key) }, 100_000),
    Promise.all(sqlTargets.map(async (target) => {
      const result = await statusAndText(target.url, {
        method: "POST",
        headers: headers(key),
        body: JSON.stringify({ query: TABLE_QUERY, read_only: true }),
      }, 100_000);
      const tables = result.status === 200 || result.status === 201 ? namesFromSql(result.text) : null;
      return { method: target.method, status: result.status, parsed: tables !== null, tables };
    })),
  ]);
  const parsedSpec = spec.status === 200 ? parseOpenApiDocument(spec.text) : { tables: [], columns: [], truncated: false };
  const sqlHit = sqlAttempts.find((attempt) => attempt.tables);
  const sqlTables = sqlHit?.tables ?? null;
  const buckets = bucketRes.status === 200 ? parseBuckets(bucketRes.text) : [];
  const tejasTables = parsedSpec.tables.filter((name) => name.startsWith("tejas_")).slice(0, 30);
  const [rowCounts, clientProbes] = await Promise.all([
    Promise.all(tejasTables.map(async (table) => {
      const h = headers(key);
      h.set("prefer", "count=exact");
      h.set("range", "0-0");
      const result = await statusAndText(`${origin}/rest/v1/${table}?select=*`, { method: "HEAD", headers: h }, 0);
      return { table, count: countFromContentRange(result.contentRange), httpStatus: result.status };
    })),
    Promise.all(CLIENT_KEY_NAMES.map((name) => probeClientKey(origin, name))),
  ]);
  return {
    ok: spec.status === 200,
    reason: spec.status === 200 ? "ok" : "unreachable",
    commit: commitLabel(),
    openApiTables: parsedSpec.tables,
    columns: parsedSpec.columns,
    truncated: parsedSpec.truncated,
    sqlAttempts: sqlAttempts.map(({ method, status, parsed }) => ({ method, status, parsed })),
    sqlTables,
    buckets,
    rowCounts,
    comparison: compareExpected({ openApiTables: parsedSpec.tables, columns: parsedSpec.columns, sqlTables, buckets }),
    clientProbes,
    databaseAccess,
  };
}
