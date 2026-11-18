-- New read-only inventory. This is not the historical 15 November counting script.
-- Historical claims this script does not reproduce, and must not be edited to force:
-- 9 schemas, 116 functions, and 189 indexes.
-- The 18 November 2026 reading of these rules was 10 durable schemas, 117 function OIDs, and 190 indexes.
-- System schemas are pg_catalog, information_schema, and pg_toast.
-- Temporary schemas pg_temp_* and pg_toast_temp_* are session artifacts and are excluded.
-- Tables are ordinary relations (relkind r) and partitioned tables (relkind p).
-- Views, materialized views, sequences, indexes, and toast tables are not tables.
-- Functions are pg_proc rows with prokind f outside the system schemas, counted by OID.
-- Run the whole file inside one read-only transaction.

SELECT 'schema' AS kind, nspname AS name, '' AS detail
FROM pg_namespace
WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND nspname NOT LIKE 'pg_temp_%'
  AND nspname NOT LIKE 'pg_toast_temp_%'
ORDER BY 2;

SELECT 'table' AS kind, n.nspname || '.' || c.relname AS name, c.relkind AS detail
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg_temp_%'
  AND n.nspname NOT LIKE 'pg_toast_temp_%'
  AND c.relkind IN ('r', 'p')
ORDER BY 2;

SELECT 'summary' AS kind, 'schemas' AS name, count(*)::text AS detail
FROM pg_namespace
WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND nspname NOT LIKE 'pg_temp_%'
  AND nspname NOT LIKE 'pg_toast_temp_%';

SELECT 'summary' AS kind, 'tables_r_p' AS name, count(*)::text AS detail
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg_temp_%'
  AND n.nspname NOT LIKE 'pg_toast_temp_%'
  AND c.relkind IN ('r', 'p');

SELECT 'summary' AS kind, 'indexes' AS name, count(*)::text AS detail
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg_temp_%'
  AND n.nspname NOT LIKE 'pg_toast_temp_%'
  AND c.relkind IN ('i', 'I');

SELECT 'summary' AS kind, 'constraints' AS name, count(*)::text AS detail
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg_temp_%'
  AND n.nspname NOT LIKE 'pg_toast_temp_%';

SELECT 'summary' AS kind, 'sequences' AS name, count(*)::text AS detail
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg_temp_%'
  AND n.nspname NOT LIKE 'pg_toast_temp_%'
  AND c.relkind = 'S';

SELECT 'summary' AS kind, 'functions' AS name, count(*)::text AS detail
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg_temp_%'
  AND n.nspname NOT LIKE 'pg_toast_temp_%'
  AND p.prokind = 'f';

SELECT 'summary' AS kind, 'triggers' AS name, count(*)::text AS detail
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND n.nspname NOT LIKE 'pg_temp_%'
  AND n.nspname NOT LIKE 'pg_toast_temp_%';

SELECT 'summary' AS kind, 'policies' AS name, count(*)::text AS detail
FROM pg_policy;

SELECT 'summary' AS kind, 'extensions' AS name, count(*)::text AS detail
FROM pg_extension;

SELECT 'extension' AS kind, extname AS name, extversion AS detail
FROM pg_extension
ORDER BY 2;

SELECT 'history' AS kind, version AS name, encode(sha256(statements::text::bytea), 'hex') AS detail
FROM supabase_migrations.schema_migrations
ORDER BY version;

SELECT 'rows' AS kind, 'tejas_payments' AS name, count(*)::text AS detail FROM public.tejas_payments
UNION ALL SELECT 'rows', 'tejas_registrations', count(*)::text FROM public.tejas_registrations
UNION ALL SELECT 'rows', 'tejas_learn_entitlements', count(*)::text FROM public.tejas_learn_entitlements
UNION ALL SELECT 'rows', 'tejas_learn_audit', count(*)::text FROM public.tejas_learn_audit
UNION ALL SELECT 'rows', 'tejas_book_orders', count(*)::text FROM public.tejas_book_orders
UNION ALL SELECT 'rows', 'tejas_ebook_access', count(*)::text FROM public.tejas_ebook_access
UNION ALL SELECT 'rows', 'tejas_payment_proofs', count(*)::text FROM public.tejas_payment_proofs
UNION ALL SELECT 'rows', 'tejas_idempotency', count(*)::text FROM public.tejas_idempotency
ORDER BY 2;
