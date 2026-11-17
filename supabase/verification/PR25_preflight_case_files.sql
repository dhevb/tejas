-- Read-only case-file preflight.
-- Run this only after PR25_preflight.sql shows tejas_case_files is present.
-- If that catalog value is null, do not run this file. Absence is not a count of zero orders.

begin read only;

select current_setting('transaction_read_only') as transaction_read_only;

select channel as category,
       reference as owner_reference,
       coalesce(record_snapshot->'payment'->>'status', status) as payment_status,
       record_snapshot->'payment'->>'transactionReference' as utr_text,
       upper(regexp_replace(coalesce(record_snapshot->'payment'->>'transactionReference', ''::text), '[' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(32) || chr(160) || chr(5760) || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196) || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279) || ']', '', 'g')) as utr_key
from tejas_case_files
where coalesce(record_snapshot->'payment'->>'transactionReference', '') <> ''
order by channel, reference;

commit;
