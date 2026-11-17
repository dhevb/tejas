-- WITHDRAWN. This file intentionally changes nothing.
--
-- An earlier draft created tejas_payment_utrs and used ON CONFLICT DO NOTHING.
-- That could keep one historical UTR owner and silently omit another.
-- The replacement files, applied later by filename order, are:
--   20261115_01_test_record_classification.sql
--   20261115_02_payment_utr_registry.sql
--   20261115_03_payment_proof_bucket.sql
-- Do not restore the skipped-conflict backfill.

begin;

commit;
