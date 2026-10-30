import assert from "node:assert/strict";
import test from "node:test";
import { EXPECTED_BUCKET, EXPECTED_TABLES, compareExpected, namesFromSql, parseBuckets, parseOpenApiDocument } from "@/lib/registration/supabase-inspect";

const SECRET = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature";

test("OpenAPI parsing keeps table and column names only", () => {
  const parsed = parseOpenApiDocument(JSON.stringify({
    paths: { "/": {}, "/tejas_schools": {}, "/rpc/hidden": {} },
    definitions: {
      tejas_schools: {
        required: ["pan"],
        properties: {
          id: { type: "string", format: "uuid", description: SECRET },
          pan: { type: "string", description: "full pan value" },
          [SECRET]: { type: "string" },
        },
      },
    },
  }));
  assert.deepEqual(parsed.tables, ["tejas_schools"]);
  assert.equal(JSON.stringify(parsed).includes(SECRET), false);
  assert.equal(JSON.stringify(parsed).includes("full pan"), false);
  assert.equal(parsed.columns[0]?.columns.find((column) => column.name === "pan")?.required, true);
  assert.equal(parsed.columns[0]?.columns.some((column) => column.name === "[redacted]"), true);
});

test("SQL error bodies are dropped and table names are schema-qualified", () => {
  assert.equal(namesFromSql(`<html>${SECRET}</html>`), null);
  assert.equal(namesFromSql(JSON.stringify({ message: "sb_secret_abcdefghijklmnopqrstuvwxyz" })), null);
  assert.deepEqual(
    namesFromSql(JSON.stringify([
      { table_schema: "public", table_name: "tejas_schools" },
      { table_schema: "storage", table_name: "buckets" },
    ])),
    ["public.tejas_schools", "storage.buckets"],
  );
  assert.deepEqual(namesFromSql(JSON.stringify({ result: [{ table_schema: "public", table_name: "tejas_payments" }] })), ["public.tejas_payments"]);
});

test("bucket parsing keeps access limits and drops other fields", () => {
  const buckets = parseBuckets(JSON.stringify([
    { id: EXPECTED_BUCKET.id, public: false, file_size_limit: "5242880", allowed_mime_types: [...EXPECTED_BUCKET.mimeTypes], owner: SECRET },
  ]));
  assert.equal(buckets.length, 1);
  assert.equal(buckets[0]?.public, false);
  assert.equal(buckets[0]?.fileSizeLimit, EXPECTED_BUCKET.fileSizeLimit);
  assert.deepEqual(buckets[0]?.mimeTypes, [...EXPECTED_BUCKET.mimeTypes]);
  assert.equal(JSON.stringify(buckets).includes(SECRET), false);
});

test("an empty project does not match the prepared registration schema", () => {
  const comparison = compareExpected({ openApiTables: [], columns: [], sqlTables: [], buckets: [] });
  assert.deepEqual(comparison.openApiMissingTables, Object.keys(EXPECTED_TABLES));
  assert.deepEqual(comparison.sqlMissingTables, Object.keys(EXPECTED_TABLES));
  assert.equal(comparison.bucket.present, false);
  assert.equal(comparison.backupVerified, false);
  assert.equal(comparison.indexesVisible, false);
  assert.equal(comparison.policiesVisible, false);
  assert.equal(comparison.schemaSource, "sql");
});

test("comparison flags missing columns and accepts the private proof bucket", () => {
  const comparison = compareExpected({
    openApiTables: ["tejas_schools"],
    columns: [{ table: "tejas_schools", columns: [{ name: "id", type: "string", format: "uuid", required: true }] }],
    sqlTables: ["public.tejas_schools", "public.unrelated"],
    buckets: [{ id: EXPECTED_BUCKET.id, public: false, fileSizeLimit: EXPECTED_BUCKET.fileSizeLimit, mimeTypes: [...EXPECTED_BUCKET.mimeTypes] }],
  });
  assert.equal(comparison.columnGaps[0]?.table, "tejas_schools");
  assert.equal(comparison.columnGaps[0]?.missing.includes("pan"), true);
  assert.deepEqual(comparison.sqlExtraPublicTables, ["public.unrelated"]);
  assert.equal(comparison.bucket.private, true);
  assert.equal(comparison.bucket.sizeOk, true);
  assert.equal(comparison.bucket.mimeOk, true);
  assert.equal(comparison.schemaSource, "sql");
  assert.equal(comparison.backupVerified, false);
});
