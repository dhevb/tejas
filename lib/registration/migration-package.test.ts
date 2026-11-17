import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { BOOK_BANK, REGISTRATION_BANK } from "@/lib/registration/official-bank";
import { BOOK_PAN_THRESHOLD, BOOK_PRICE, BOOK_SCHOOL_SHARE, BOOK_TEJAS, FEE_SCHOOL, FEE_TEJAS, FEE_TOTAL, calculateIndividualRegistration, calculatePrintedBooks } from "@/lib/registration/fee";
import { utrKey } from "@/lib/registration/utr-claim";

const root = path.resolve(__dirname, "../..");
const database = "tejas_pr25_mig_pkg";

function psql(db: string, sql: string): string {
  if (db.includes("supabase") || sql.includes("zapccpipwxduzlnvjdmy") || sql.includes("supabase.co")) {
    throw new Error("Refusing to run this test against a hosted database.");
  }
  const result = spawnSync("sudo", ["-n", "-u", "postgres", "psql", "-d", db, "-v", "ON_ERROR_STOP=1", "-P", "pager=off", "-tA", "-c", sql], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.trim();
}

function psqlFile(db: string, file: string): { ok: boolean; output: string } {
  const result = spawnSync("sudo", ["-n", "-u", "postgres", "psql", "-d", db, "-v", "ON_ERROR_STOP=1", "-P", "pager=off", "-f", file], { encoding: "utf8" });
  return { ok: result.status === 0, output: `${result.stdout}\n${result.stderr}` };
}

function migration(name: string): string {
  return path.join(root, "supabase/migrations", name);
}

function reset(): void {
  psql("postgres", `drop database if exists ${database}`);
  psql("postgres", `create database ${database}`);
  psql(database, `
    create schema if not exists storage;
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
    end $$;
    create table storage.buckets (
      id text primary key,
      public boolean not null,
      file_size_limit bigint,
      allowed_mime_types text[]
    );
    insert into storage.buckets values ('tejas-payment-proofs', false, 5242880, array['image/jpeg','image/png','application/pdf']);
    create table tejas_registrations (
      id uuid primary key,
      reference text unique not null,
      status text not null,
      record_snapshot jsonb
    );
    create table tejas_payments (
      id uuid primary key,
      registration_id uuid not null references tejas_registrations(id),
      status text not null,
      transaction_reference text,
      amount_due integer not null
    );
    create table tejas_learn_entitlements (
      id uuid primary key,
      student_id uuid not null,
      book_id text not null,
      status text not null,
      transaction_reference text,
      amount_inr integer not null,
      reported_at timestamptz
    );
    insert into tejas_registrations values
      ('3a18b60e-cfd0-4329-a5b4-8833ca1d97ed', 'TEJAS-2026-NS553XMZZG2N8XE7DHV3', 'confirmed', '{"payment":{"transactionReference":"AXISCN1379239046","status":"confirmed"}}'),
      ('31be3f28-4a62-4f7e-b173-0f383701ccea', 'TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ', 'reported', '{"payment":{"transactionReference":"AXISCN1379239048","status":"reported"}}'),
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'TEJAS-2026-ABCDEFGHJKLMNPQRSTUV', 'reported', '{"payment":{"transactionReference":"upi 654321","status":"reported"}}');
    insert into tejas_payments values
      ('5f9e1b28-f6c1-45f4-b17c-386d7b4cbde9', '3a18b60e-cfd0-4329-a5b4-8833ca1d97ed', 'confirmed', 'AXISCN1379239046', 150),
      ('c37d68d5-bd39-42ce-8abe-7c7ad1e3ddc4', '31be3f28-4a62-4f7e-b173-0f383701ccea', 'reported', 'AXISCN1379239048', 150),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'reported', 'upi 654321', 150);
    insert into tejas_learn_entitlements values
      ('4326d3dc-91b1-4db2-aa42-69d6134e3e8a', '7e94efb3-2bd9-4646-91e6-eea7f3c15b44', 'ft-book-1', 'verified', 'AXISCN1379239046', 49, '2026-11-13 19:34:38+00'),
      ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '200ae663-c374-4982-bea8-4e799c085059', 'ft-book-2', 'unpaid', null, 49, null);
  `);
}

function applyCaseAndClassify(): void {
  assert.equal(psqlFile(database, migration("20261114_payment_utr_registry.sql")).ok, true);
  assert.equal(psqlFile(database, migration("20261114_payment_verification.sql")).ok, true, "case-file migration");
  psql(database, `
    insert into tejas_case_files (reference, channel, status, record_snapshot) values
      ('TEJAS-2026-WXYZ23456789ABCDEFGH', 'individual-registration', 'reported', '{"channel":"individual-registration","payment":{"status":"reported","transactionReference":"INDV654321"},"record":{"fee":{"amountDue":150}}}'),
      ('TEJAS-2026-JKLMNPQRSTUVWXYZ2345', 'school-book', 'reported', '{"channel":"school-book","payment":{"status":"reported","transactionReference":"SCHB654321"},"charge":{"payableToTejas":136},"proofExt":"png"}'),
      ('TEJAS-2026-NPQRSTUVWXYZ23456789', 'individual-book', 'confirmed', '{"channel":"individual-book","payment":{"status":"confirmed","transactionReference":"INDB654321"},"charge":{"payableToTejas":170},"proofExt":"webp"}');
  `);
}

test.before(() => {
  reset();
});

test.after(() => {
  psql("postgres", `drop database if exists ${database}`);
});

test("financial rules and bank accounts stay on the approved figures", () => {
  assert.equal(FEE_TOTAL, 150);
  assert.equal(FEE_SCHOOL, 30);
  assert.equal(FEE_TEJAS, 120);
  assert.equal(BOOK_PRICE, 170);
  assert.equal(BOOK_SCHOOL_SHARE, 34);
  assert.equal(BOOK_TEJAS, 136);
  assert.equal(BOOK_PAN_THRESHOLD, 2000);
  assert.equal(calculateIndividualRegistration(1).schoolShare, 0);
  assert.equal(calculateIndividualRegistration(1).payableToTejas, 150);
  assert.equal(calculatePrintedBooks(1, "school").schoolShare, 34);
  assert.equal(calculatePrintedBooks(1, "school").payableToTejas, 136);
  assert.equal(calculatePrintedBooks(1, "individual").schoolShare, 0);
  assert.equal(calculatePrintedBooks(1, "individual").payableToTejas, 170);
  assert.equal(calculatePrintedBooks(11, "individual").panRequired, false);
  assert.equal(calculatePrintedBooks(12, "individual").panRequired, true);
  assert.equal(REGISTRATION_BANK.accountNumber, "45726198627");
  assert.equal(REGISTRATION_BANK.ifsc, "SBIN0000628");
  assert.equal(BOOK_BANK.accountNumber, "535402010016278");
  assert.equal(BOOK_BANK.ifsc, "UBIN0553549");
});

test("withdrawn registry file does not skip collisions", () => {
  const withdrawn = readFileSync(migration("20261114_payment_utr_registry.sql"), "utf8").replace(/--.*$/gm, "");
  assert.equal(/on conflict/i.test(withdrawn), false);
  assert.equal(/insert\s+into/i.test(withdrawn), false);
});

test("happy path classifies only the three test identities and backfills every genuine category", () => {
  applyCaseAndClassify();
  const classified = psqlFile(database, migration("20261115_01_test_record_classification.sql"));
  assert.equal(classified.ok, true, classified.output);
  const registry = psqlFile(database, migration("20261115_02_payment_utr_registry.sql"));
  assert.equal(registry.ok, true, registry.output);
  const bucket = psqlFile(database, migration("20261115_03_payment_proof_bucket.sql"));
  assert.equal(bucket.ok, true, bucket.output);

  assert.equal(psql(database, "select count(*) from tejas_test_record_classifications"), "3");
  assert.equal(psql(database, "select string_agg(owner_reference, ',' order by owner_reference) from tejas_test_record_classifications"),
    "ebook:7e94efb3-2bd9-4646-91e6-eea7f3c15b44:ft-book-1,school-registration:TEJAS-2026-NS553XMZZG2N8XE7DHV3,school-registration:TEJAS-2026-P8ZHXTS26PJSMD2EMUJZ");
  assert.equal(psql(database, "select count(*) from tejas_test_record_classifications where reason = 'owner-confirmed testing'"), "3");
  assert.equal(psql(database, "select count(*) from tejas_payment_utrs where utr_key in ('AXISCN1379239046', 'AXISCN1379239048')"), "0");
  assert.equal(psql(database, "select utr_text || '|' || utr_key || '|' || category || '|' || owner_reference || '|' || payment_status from tejas_payment_utrs where owner_reference = 'school-registration:TEJAS-2026-ABCDEFGHJKLMNPQRSTUV'"),
    "upi 654321|UPI654321|school-registration|school-registration:TEJAS-2026-ABCDEFGHJKLMNPQRSTUV|reported");
  assert.equal(psql(database, "select category || ':' || payment_status || ':' || amount_due::text from tejas_payment_utrs where utr_key = 'INDV654321'"), "individual-registration:reported:150");
  assert.equal(psql(database, "select category || ':' || proof_ext || ':' || amount_due::text from tejas_payment_utrs where utr_key = 'SCHB654321'"), "school-book:png:136");
  assert.equal(psql(database, "select category || ':' || proof_ext || ':' || amount_due::text from tejas_payment_utrs where utr_key = 'INDB654321'"), "individual-book:webp:170");
  assert.equal(psql(database, "select status || '|' || transaction_reference from tejas_payments where id = '5f9e1b28-f6c1-45f4-b17c-386d7b4cbde9'"), "confirmed|AXISCN1379239046");
  assert.equal(psql(database, "select status || '|' || transaction_reference from tejas_payments where id = 'c37d68d5-bd39-42ce-8abe-7c7ad1e3ddc4'"), "reported|AXISCN1379239048");
  assert.equal(psql(database, "select status || '|' || transaction_reference from tejas_learn_entitlements where id = '4326d3dc-91b1-4db2-aa42-69d6134e3e8a'"), "verified|AXISCN1379239046");
  assert.equal(psql(database, "select allowed_mime_types::text || '|' || public::text || '|' || file_size_limit::text from storage.buckets where id = 'tejas-payment-proofs'"),
    "{image/jpeg,image/png,image/webp,application/pdf}|false|5242880");

  const samples = ["neft 445566", "neft\u00a0445566", "ab\u2003cd12", "AXISCN1379239046"];
  for (const sample of samples) {
    const quoted = sample.replace(/'/g, "''");
    assert.equal(psql(database, `select public.tejas_utr_key('${quoted}')`), utrKey(sample));
  }

  assert.equal(psql(database, "select has_table_privilege('anon', 'public.tejas_payment_utrs', 'select')"), "f");
  assert.equal(psql(database, "select has_table_privilege('authenticated', 'public.tejas_case_files', 'select')"), "f");
  assert.equal(psql(database, "select has_table_privilege('public', 'public.tejas_test_record_classifications', 'select')"), "f");
  assert.equal(psql(database, "select has_function_privilege('anon', 'public.tejas_utr_key(text)', 'execute')"), "f");
  assert.equal(psql(database, "select relrowsecurity::text from pg_class where relname = 'tejas_payment_utrs'"), "true");
  assert.equal(psql(database, "select count(*) from pg_policies where tablename in ('tejas_payment_utrs', 'tejas_case_files', 'tejas_test_record_classifications')"), "0");
  const post = psqlFile(database, path.join(root, "supabase/verification/PR25_post_migration_verification.sql"));
  assert.equal(post.ok, true, post.output);
  const preflight = psqlFile(database, path.join(root, "supabase/verification/PR25_preflight.sql"));
  assert.equal(preflight.ok, true, preflight.output);
  const casePreflight = psqlFile(database, path.join(root, "supabase/verification/PR25_preflight_case_files.sql"));
  assert.equal(casePreflight.ok, true, casePreflight.output);
});

test("a different record cannot inherit the test classification", () => {
  const inserted = spawnSync("sudo", ["-n", "-u", "postgres", "psql", "-d", database, "-v", "ON_ERROR_STOP=1", "-c",
    "insert into tejas_test_record_classifications (category, owner_reference, source_reference, utr_text, payment_status, reason) values ('ebook', 'ebook:200ae663-c374-4982-bea8-4e799c085059:ft-book-2', '200ae663-c374-4982-bea8-4e799c085059:ft-book-2', 'AXISCN1379239046', 'verified', 'owner-confirmed testing')"], { encoding: "utf8" });
  assert.notEqual(inserted.status, 0);
  assert.match(inserted.stderr, /tejas_test_record_classifications_exact|check constraint/i);
  const removed = spawnSync("sudo", ["-n", "-u", "postgres", "psql", "-d", database, "-v", "ON_ERROR_STOP=1", "-c",
    "delete from tejas_test_record_classifications where category = 'ebook'"], { encoding: "utf8" });
  assert.notEqual(removed.status, 0);
  assert.match(removed.stderr, /append-only/);
  assert.equal(psql(database, "select count(*) from tejas_test_record_classifications"), "3");
});

test("a test UTR on another identity aborts classification and leaves sources unchanged", () => {
  reset();
  assert.equal(psqlFile(database, migration("20261114_payment_verification.sql")).ok, true);
  psql(database, "insert into tejas_case_files (reference, channel, status, record_snapshot) values ('TEJAS-2026-JKLMNPQRSTUVWXYZ2345', 'school-book', 'reported', '{\"payment\":{\"transactionReference\":\"AXISCN1379239046\",\"status\":\"reported\"}}')");
  const result = psqlFile(database, migration("20261115_01_test_record_classification.sql"));
  assert.equal(result.ok, false);
  assert.match(result.output, /not owner-confirmed/);
  assert.equal(psql(database, "select to_regclass('public.tejas_test_record_classifications') is null"), "t");
  assert.equal(psql(database, "select transaction_reference || '|' || status from tejas_payments where transaction_reference = 'AXISCN1379239046'"), "AXISCN1379239046|confirmed");
  assert.equal(psql(database, "select count(*) from tejas_case_files"), "1");
});

test("a genuine duplicate UTR rolls back the registry and preserves source rows", () => {
  reset();
  applyCaseAndClassify();
  assert.equal(psqlFile(database, migration("20261115_01_test_record_classification.sql")).ok, true);
  psql(database, `
    insert into tejas_registrations values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'TEJAS-2026-QRSTUVWXYZ23456789AB', 'confirmed', '{"payment":{"transactionReference":"NEFT 445566","status":"confirmed"}}');
    insert into tejas_payments values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'confirmed', 'NEFT 445566', 150);
    insert into tejas_registrations values ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'TEJAS-2026-STUVWXYZ23456789ABCD', 'reported', '{"payment":{"transactionReference":"neft445566","status":"reported"}}');
    insert into tejas_payments values ('99999999-9999-4999-8999-999999999999', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'reported', 'neft445566', 150);
  `);
  const result = psqlFile(database, migration("20261115_02_payment_utr_registry.sql"));
  assert.equal(result.ok, false);
  assert.match(result.output, /genuine UTR collision/);
  assert.equal(psql(database, "select to_regclass('public.tejas_payment_utrs') is null"), "t");
  assert.equal(psql(database, "select transaction_reference from tejas_payments where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'"), "NEFT 445566");
  assert.equal(psql(database, "select transaction_reference from tejas_payments where id = '99999999-9999-4999-8999-999999999999'"), "neft445566");
  assert.equal(psql(database, "select status from tejas_payments where id = '5f9e1b28-f6c1-45f4-b17c-386d7b4cbde9'"), "confirmed");
  assert.equal(psql(database, "select count(*) from tejas_test_record_classifications"), "3");
});

test("registry claim, same-owner retry, and release follow the primary key", async () => {
  reset();
  applyCaseAndClassify();
  assert.equal(psqlFile(database, migration("20261115_01_test_record_classification.sql")).ok, true);
  assert.equal(psqlFile(database, migration("20261115_02_payment_utr_registry.sql")).ok, true);
  psql(database, "insert into tejas_payment_utrs (utr_key, utr_text, category, owner_reference, payment_status) values ('RETRY123456', 'retry 123456', 'school-book', 'school-book:TEJAS-2026-RETRYCLAIMAAAAAAA', 'reported')");
  const retry = spawnSync("sudo", ["-n", "-u", "postgres", "psql", "-d", database, "-v", "ON_ERROR_STOP=1", "-c",
    "insert into tejas_payment_utrs (utr_key, utr_text, category, owner_reference) values ('RETRY123456', 'RETRY123456', 'school-book', 'school-book:TEJAS-2026-RETRYCLAIMAAAAAAA')"], { encoding: "utf8" });
  assert.notEqual(retry.status, 0);
  assert.match(retry.stderr, /duplicate key|unique/i);
  assert.equal(psql(database, "select utr_text from tejas_payment_utrs where utr_key = 'RETRY123456'"), "retry 123456");
  psql(database, "delete from tejas_payment_utrs where utr_key = 'RETRY123456' and owner_reference = 'school-book:SOMEONE-ELSE'");
  assert.equal(psql(database, "select count(*) from tejas_payment_utrs where utr_key = 'RETRY123456'"), "1");
  psql(database, "delete from tejas_payment_utrs where utr_key = 'RETRY123456' and owner_reference = 'school-book:TEJAS-2026-RETRYCLAIMAAAAAAA'");
  assert.equal(psql(database, "select count(*) from tejas_payment_utrs where utr_key = 'RETRY123456'"), "0");

  const first = spawn("sudo", ["-n", "-u", "postgres", "psql", "-d", database, "-v", "ON_ERROR_STOP=1", "-c",
    "begin; insert into tejas_payment_utrs (utr_key, utr_text, category, owner_reference) values ('CONCUR12345', 'CONCUR12345', 'ebook', 'ebook:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:ft-book-1'); select pg_sleep(2); commit;"], { stdio: "pipe" });
  await new Promise((resolve) => setTimeout(resolve, 400));
  const second = spawnSync("sudo", ["-n", "-u", "postgres", "psql", "-d", database, "-v", "ON_ERROR_STOP=1", "-c",
    "insert into tejas_payment_utrs (utr_key, utr_text, category, owner_reference) values ('CONCUR12345', 'other text', 'individual-book', 'individual-book:TEJAS-2026-NPQRSTUVWXYZ23456789')"], { encoding: "utf8" });
  const firstExit = await new Promise<number>((resolve) => first.on("exit", (code) => resolve(code ?? 1)));
  assert.equal(firstExit, 0);
  assert.notEqual(second.status, 0);
  assert.equal(psql(database, "select count(*) from tejas_payment_utrs where utr_key = 'CONCUR12345'"), "1");
  assert.equal(psql(database, "select utr_text || '|' || owner_reference from tejas_payment_utrs where utr_key = 'CONCUR12345'"), "CONCUR12345|ebook:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:ft-book-1");
});
