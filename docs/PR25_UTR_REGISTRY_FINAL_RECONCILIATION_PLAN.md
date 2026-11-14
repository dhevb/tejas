# PR #25 UTR registry reconciliation and migration plan

Planning time: 14 November 2026, 10:38 PM IST.
Repository: `dhevb/tejas`
Production site: https://tejas.dhe.org.in
Pull request: https://github.com/dhevb/tejas/pull/25
Branch: `cursor/registration-payment-verification-2878`

This document is a proposal. None of the SQL in it has been executed. No migration was applied. No production payment, entitlement, proof, or status was changed.

## How to read the findings

| Label | Meaning |
| --- | --- |
| Verified now | Checked against GitHub or the commit `ec38db0` during this planning task. |
| Code conclusion | Read from that commit. Not a production measurement. |
| Earlier production record | Taken from a previous read-only production inspection. Not repeated today. |
| Not verified | Not measured in this task. |
| Proposal | A change that has not been implemented. |

## 1. Current pull request and commit

Verified now:

| Item | Finding |
| --- | --- |
| Pull request | #25 is open. `merged` is false. `merged_at` is null. |
| Base | `main` at `266156332bda1ca3857471c0d83ec59134c83d3f` |
| Branch | `cursor/registration-payment-verification-2878` |
| HEAD | `ec38db028371a7e46b83a58774e4e9ff8c065f40` |
| Expected commit | Present, and it is the branch head. No newer commit exists. |
| Commit time | 14 November 2026, 10:15 PM IST |
| Commit subject | Lock payment references and let staff review hosted proofs. |
| Pull request commits | 2 |
| Vercel status on this exact SHA | `success`. Description: "Deployment has completed." Target: https://vercel.com/dhe-projects/tejas/EoeF3gRrPnreQ18QvshahU8VjbRR |
| Vercel Preview Comments | Completed, success, on this SHA. |
| Supabase Preview | Completed as skipped. The branch has no Supabase preview branch. |
| GitHub Actions | This repository has no workflow under `.github/workflows`. |
| Migrations applied by this task | None. |

The Vercel status is a preview deployment of this pull-request commit. It is not a production deployment of https://tejas.dhe.org.in. This task did not trigger a deployment.

Earlier production record, not rechecked today: the afternoon audit on 14 November 2026 read production under `BEGIN READ ONLY` and reported `tejas_payments` 2, `tejas_registrations` 2, and `tejas_learn_entitlements` 2, of which 1 was verified. That audit's deployed production commit was `fb64ed3c910b`, which is older than this pull request. `tejas_case_files` and `tejas_payment_utrs` were not in that count list. Their absence today is not verified.

## 2. UTR source inventory

The application uniqueness key is `utrKey` in `lib/registration/utr-claim.ts`: remove every JavaScript whitespace character, then uppercase. The stored text is the trimmed original. A claim is accepted only when the key matches `^[A-Z0-9-]{6,40}$`.

JavaScript whitespace here means tab, line feed, vertical tab, form feed, carriage return, space, no-break space, ogham space, the en/em and thin spaces U+2000 through U+200A, line and paragraph separators, narrow no-break space, medium mathematical space, ideographic space, and byte-order mark. PostgreSQL `[[:space:]]` is not that set. The current migration file uses `[[:space:]]`. The proposal below uses the JavaScript set.

| Source | Payment category | UTR field | Status field | Owner or reference | In the current migration file? |
| --- | --- | --- | --- | --- | --- |
| `tejas_payments.transaction_reference` | School registration | Exact text, unique on that exact text, nulls allowed more than once | `tejas_payments.status` | `tejas_registrations.reference` through `registration_id` | Yes. Inserted first. Later collisions are skipped. |
| `tejas_registrations.record_snapshot` JSON `payment.transactionReference` | Same school registration, a copy | JSON text | JSON `payment.status` | `tejas_registrations.reference` | No. It must be compared with the payment column. It is not a second owner. |
| Same snapshot, `payment.verification.enteredUtr` | Same school payment, a copy of the entered value | JSON text | JSON `payment.status` | Registration reference | No. Compare it with the column. Do not register it separately. |
| Same snapshot, `payment.verification.extractedUtr` | OCR reading, not the claimed payment | JSON text | JSON `payment.status` | Registration reference | No. Do not backfill an OCR value as its own payment. |
| `tejas_learn_entitlements.transaction_reference` | E-book | Exact text. Partial unique index where the column is not null, including rejected rows | `status` (`unpaid`, `reported`, `verified`, `rejected`, `superseded`) | `ebook:` plus `student_id` plus `book_id` | Only when status is not `rejected` and the POSIX-normalized length is 6 to 40. Rejected rows are omitted. |
| `tejas_learn_audit.after_state` | E-book audit copy | Sometimes a JSON copy in application audit. The database function `tejas_learn_report_payment` stores book id and amount, not the UTR | Audit action | Student id | No. Not a second owner. |
| `tejas_case_files.record_snapshot` JSON `payment.transactionReference` | Individual registration, school book order, or individual book order, from `channel` | JSON text | JSON `payment.status` | `reference` | No. The table is not read. |
| Same case snapshot, `payment.enteredUtr` | Same case payment | JSON text | JSON `payment.status` | Case reference | No. It is the same entered value, not a second owner. |
| `tejas_payments.entered_utr` and `extracted_utr` | Proposed columns only | Unapplied migration `20261114_payment_verification.sql` | Existing `status` | Registration id | No. Current application writes do not fill these columns. |
| `tejas_payment_utrs` | Proposed registry | `utr_text`, key `utr_key` | `payment_status` | `owner_reference` | This is the destination, not a historical source. |
| `tejas_book_orders` | Old school-registration book quantity | None | None | `registration_id` | Not a UTR source. |
| `tejas_ebook_access` | Old registration e-book count | None | `activated` | `registration_id` | Not a UTR source. |
| `tejas_payment_proofs` | Stored file pointer | None | None | `payment_id` | Not a UTR source. The file stays where it is. |
| `tejas_idempotency` | Retry identity | None | None | Registration reference | Not a UTR source. |
| Local `utr-claims`, registration files, and portal proof JSON | File mode only | File JSON | File JSON | Local owner string | Not a hosted production table. Production on Vercel uses the hosted database. |

No other table or JSON field in the repository stores a payment UTR. Searches covered `transactionReference`, `transaction_reference`, `utr`, `utr_key`, `tejas_payment_utrs`, and `record_snapshot`.

Public routes that accept a reference:

| Route | What it can store |
| --- | --- |
| `POST /api/register/submit` | Rejects any receipt or `transactionReference`. Saves the registration with a null reference and `pending_instructions`. |
| `POST /api/register/[reference]/payment` | School or individual registration screenshot and UTR. |
| `POST /api/register/individual` | Creates an individual registration with a null reference. |
| `POST /api/books/school` and `POST /api/books/individual` | Create orders with a null reference. |
| `POST /api/books/[reference]/payment` | Book-order screenshot and UTR. |
| `POST /api/learn/pay` | E-book screenshot and UTR through `submitEbookProof`. |
| `reportPayment` in `lib/portal/store.ts` | Not an HTTP route. On Vercel it returns an error before it writes. Older hosted rows can still contain a reference written by `tejas_learn_report_payment`. |

## 3. Existing tables and unapplied tables

| Object | Classification |
| --- | --- |
| `tejas_payments`, `tejas_registrations`, `tejas_payment_proofs`, `tejas_book_orders`, `tejas_ebook_access`, `tejas_idempotency` | Existing production tables in the 14 November afternoon count and in the registration migrations. |
| `tejas_learn_entitlements` and `tejas_learn_audit` | Present in that afternoon production count. The 13 November release record says the portal migrations had been applied. The `transaction_reference` column is part of the applied durable migration. Confirm the column with the preflight. This task did not. |
| `tejas_case_files` | Created only by unapplied `supabase/migrations/20261114_payment_verification.sql`. Not in the afternoon count list. Presence today is not verified. |
| `tejas_payments.entered_utr` and the other verification columns | Same unapplied file. Not written by the current application. |
| `tejas_payment_utrs` | Created only by unapplied `supabase/migrations/20261114_payment_utr_registry.sql`. |

## 4. Limits of the current migration file

`supabase/migrations/20261114_payment_utr_registry.sql` must not be applied as written.

- It inserts school payments first and e-book rows second.
- `on conflict (utr_key) do nothing` keeps whichever school row PostgreSQL happens to insert first. There is no `ORDER BY`.
- A skipped e-book or school row stays in its original table. Its status is not changed, but the registry silently points at a different owner.
- Rejected e-book references are omitted even though the entitlement unique index still holds them.
- Case-file references are omitted.
- Snapshot copies are not checked for disagreement with the column.
- Normalization uses `[[:space:]]`, which is not the application rule.
- Keys outside length 6 to 40 are omitted without stopping the migration.
- The bucket update in the same file is a storage change and is not part of UTR reconciliation. It should stay in a separate owner decision. This proposal does not change that bucket statement and does not move it.

## 5. Proposed backfill

This SQL is a proposal. It is not a migration file and it has not been run.

The rule is: one normalized key, one owner. If two historical records share a key, the migration raises and rolls back. It does not pick a winner, skip a row, or change a payment status. The same raise applies to a non-null reference the application cannot claim, and to a registration snapshot that does not carry the same key as its payment column.

Rejected, pending, reported, verified, and superseded rows are all included. Leaving a rejected e-book out would let a later payment claim a reference that is still stored. Releasing a rejected reference is a separate owner decision, not part of this backfill.

The original text is copied into `utr_text`. No source column is updated.

```sql
-- PROPOSAL ONLY. NOT APPLIED.
-- Apply only after the preflight in section 7 shows no collisions,
-- no malformed references, and no snapshot disagreements.
-- The migration repeats those checks and rolls back if any appear.

begin;

create table if not exists tejas_payment_utrs (
  utr_key text primary key,
  utr_text text not null,
  category text not null check (category in (
    'school-registration',
    'individual-registration',
    'school-book',
    'individual-book',
    'ebook'
  )),
  owner_reference text not null,
  extracted_utr text,
  bank_result text,
  review_reason text,
  proof_ext text check (proof_ext is null or proof_ext in ('jpg', 'png', 'webp')),
  amount_due integer,
  payment_status text,
  reported_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tejas_payment_utrs_owner_idx
  on tejas_payment_utrs (owner_reference);

alter table tejas_payment_utrs enable row level security;
revoke all on table tejas_payment_utrs from public, anon, authenticated;

-- Candidate rows are built in a temporary result, then checked, then inserted.
-- A collision or malformed value raises before any registry insert.

-- The whitespace class matches utrKey() in lib/registration/utr-claim.ts.
-- Implementation note for the owner-approved file: build that class with chr()
-- for U+0009, U+000A, U+000B, U+000C, U+000D, U+0020, U+00A0, U+1680,
-- U+2000 through U+200A, U+2028, U+2029, U+202F, U+205F, U+3000, and U+FEFF.
-- Do not use [[:space:]].

-- Pseudocode of the required transaction body:
-- 1. Collect school rows from tejas_payments joined to tejas_registrations.
-- 2. Collect every non-null tejas_learn_entitlements.transaction_reference,
--    including rejected and superseded.
-- 3. If pg_catalog.to_regclass('public.tejas_case_files') is not null,
--    collect payment.transactionReference from each snapshot.
--    Map channel individual-registration, school-book, and individual-book
--    to those categories. Any other channel raises.
-- 4. If that case table is null, record zero case rows. Do not fail merely
--    because the table is absent.
-- 5. Compare each registration snapshot's payment.transactionReference and
--    payment.verification.enteredUtr, when present, with the payment column.
--    A different normalized key raises. Do not insert the snapshot as a second row.
-- 6. If any key is not ^[A-Z0-9-]{6,40}$, raise with the original text,
--    category, owner, and status.
-- 7. If any key has more than one owner, raise and list every row. Do not insert.
-- 8. Insert the remaining rows, one per key, copying the original text and status.
-- 9. Do not update or delete any source row. Do not change a bucket.

commit;
```

The approved file must use real SQL for steps 1 to 9, not comments. It must raise inside the same transaction so a collision leaves no registry rows behind. `create table if not exists` must not hide an already-populated registry: if `tejas_payment_utrs` already has rows, the transaction raises before insert.

## 6. Migration dependency order

| Step | File or action | Depends on | Separate approval |
| --- | --- | --- | --- |
| 0 | Run the read-only preflight | Current production only | Yes. This task did not run it. |
| 1 | Resolve every collision and malformed reference by a written owner decision | Preflight rows | Yes. No automatic repair is included. |
| 2 | `20261114_payment_verification.sql` | Existing registration tables | Yes. It creates an empty `tejas_case_files` and adds unused payment columns. It does not rewrite rows. |
| 3 | The proposed registry transaction | Step 0 clean, or step 1 recorded. Step 2 first if case files must exist before any new order is saved. | Yes. Do not apply the current registry file. |
| 4 | Read-only verification in section 8 | Step 3 committed | Yes. |
| 5 | Deploy pull request #25 | Step 3 committed if the cross-category lock is required on the first new payment | Yes. Merging and deploying are not part of this plan. |

Step 2 and step 3 can share one maintenance window. Step 2 first, then step 3, before any individual registration or book order is saved. If step 2 is applied and the new application is deployed before step 3, individual and book proofs fail closed because the registry is missing. School proofs still follow the older exact-text unique column. E-book proofs still follow the entitlement unique index. That older behaviour is not cross-category.

If the preflight shows `tejas_case_files` is absent, step 3 can still run: there are no case-file references to copy. Step 2 should still happen before the new application starts saving case files, and step 3 must be committed before those files can contain a UTR. The safe window is: preflight, both migrations, verification, then deploy.

The two unapplied files must not be treated as already applied. The afternoon production count did not list them. This task did not confirm that count again.

## 7. Read-only production preflight

Not executed. Run each block in `begin read only;` and end it with `commit;`. A select that mentions a missing table will fail. Use block A first, then run a later block only when block A shows that its table exists. Do not paste a missing table into the union.

An empty collision result is complete only when block A was read and every table it shows as present was included in the union. An empty result from a query that skipped a present table is not complete.

### Block A. Tables, columns, and registry presence

```sql
begin read only;

select c.relname as table_name,
       c.relkind,
       c.relrowsecurity as rls_enabled
from pg_class as c
join pg_namespace as n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'tejas_payments',
    'tejas_registrations',
    'tejas_learn_entitlements',
    'tejas_learn_audit',
    'tejas_case_files',
    'tejas_payment_utrs',
    'tejas_book_orders',
    'tejas_ebook_access',
    'tejas_payment_proofs',
    'tejas_idempotency'
  )
order by c.relname;

select table_name, column_name, data_type, udt_name, is_nullable
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'tejas_payments' and column_name in ('id', 'registration_id', 'status', 'transaction_reference', 'entered_utr', 'extracted_utr', 'amount_due'))
    or (table_name = 'tejas_registrations' and column_name in ('id', 'reference', 'status', 'record_snapshot'))
    or (table_name = 'tejas_learn_entitlements' and column_name in ('student_id', 'book_id', 'status', 'transaction_reference', 'amount_inr', 'reported_at'))
    or (table_name = 'tejas_case_files' and column_name in ('reference', 'channel', 'status', 'record_snapshot'))
    or (table_name = 'tejas_payment_utrs' and column_name in ('utr_key', 'utr_text', 'category', 'owner_reference', 'payment_status'))
  )
order by table_name, ordinal_position;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and (
    indexname in ('tejas_payments_transaction_reference_key', 'tejas_learn_entitlements_one_reference')
    or indexdef ilike '%transaction_reference%'
  )
order by indexname;

commit;
```

Interpretation: `tejas_case_files` or `tejas_payment_utrs` missing from the first result means that object is absent. Do not run the block that reads it. `tejas_payment_utrs` present means stop and inspect it before any create. This task expects it to be absent, but that is not a current measurement.

### Block B. School payments and snapshot copies

Run only if block A lists `tejas_payments` and `tejas_registrations`.

```sql
begin read only;

with keyed as (
  select 'school-registration' as category,
         payments.status as payment_status
  from tejas_payments as payments
  where payments.transaction_reference is not null
)
select category, payment_status, count(*) as references
from keyed
group by category, payment_status
order by payment_status;

commit;
```

Use this finished expression everywhere a block says `utr_key(raw)`:

```sql
upper(regexp_replace(
  coalesce(raw, ''),
  '[' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(32)
     || chr(160) || chr(5760)
     || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196)
     || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202)
     || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279)
     || ']',
  '',
  'g'
))
```

School detail and snapshot disagreement:

```sql
begin read only;

select registrations.reference as owner_reference,
       payments.status as payment_status,
       payments.transaction_reference as utr_text,
       registrations.record_snapshot->'payment'->>'transactionReference' as snapshot_reference,
       registrations.record_snapshot->'payment'->'verification'->>'enteredUtr' as snapshot_entered,
       registrations.record_snapshot->'payment'->'verification'->>'extractedUtr' as snapshot_extracted
from tejas_payments as payments
join tejas_registrations as registrations
  on registrations.id = payments.registration_id
where payments.transaction_reference is not null
   or coalesce(registrations.record_snapshot->'payment'->>'transactionReference', '') <> '';

commit;
```

A row is a disagreement when the normalized payment column and the normalized snapshot reference differ, or when `snapshot_entered` is present and its normalized form differs from the payment column. `snapshot_extracted` is reported for review and is not a second registration. Disagreement stops the migration. It does not by itself change either value.

### Block C. E-book entitlements

Run only if block A lists `tejas_learn_entitlements`.

```sql
begin read only;

select status as payment_status,
       count(*) as rows_with_reference
from tejas_learn_entitlements
where transaction_reference is not null
group by status
order by status;

select 'ebook' as category,
       'ebook:' || student_id::text || ':' || book_id as owner_reference,
       status as payment_status,
       transaction_reference as utr_text
from tejas_learn_entitlements
where transaction_reference is not null
order by status, book_id;

commit;
```

The current migration would exclude `status = 'rejected'`. Those rows must appear in this result and in the collision union. They are not errors by themselves.

### Block D. Case files

Run only if block A lists `tejas_case_files`. If the name is absent, skip this block and record "case table absent; zero case references."

```sql
begin read only;

select channel,
       coalesce(record_snapshot->'payment'->>'status', status) as payment_status,
       count(*) as rows_with_reference
from tejas_case_files
where coalesce(record_snapshot->'payment'->>'transactionReference', '') <> ''
group by channel, 2
order by channel, 2;

select channel as category,
       reference as owner_reference,
       coalesce(record_snapshot->'payment'->>'status', status) as payment_status,
       record_snapshot->'payment'->>'transactionReference' as utr_text,
       record_snapshot->'payment'->>'enteredUtr' as entered_copy
from tejas_case_files
where coalesce(record_snapshot->'payment'->>'transactionReference', '') <> ''
   or coalesce(record_snapshot->'payment'->>'enteredUtr', '') <> ''
order by channel, reference;

commit;
```

`entered_copy` is a disagreement when its normalized form differs from `utr_text`. It is not a second owner when they match.

### Block E. Collision union

Build one `with sources as (...)` from the detail selects in the blocks whose tables exist. Normalize `utr_text` with the expression in block B. Then run:

```sql
select utr_key,
       count(*) as source_rows,
       count(distinct owner_reference) as owners,
       string_agg(
         category || ' ' || owner_reference || ' [' || payment_status || '] ' || utr_text,
         ' | ' order by category, owner_reference
       ) as records
from sources
group by utr_key
having count(*) > 1
order by utr_key;
```

Empty means no two included records share a normalized key. It does not mean a skipped table was checked.

Malformed and out of range, from the same `sources`:

```sql
select category, owner_reference, payment_status, utr_text, utr_key
from sources
where utr_key !~ '^[A-Z0-9-]{6,40}$'
order by category, owner_reference;
```

Empty means every included non-null reference can be claimed by the application. A row here must stop the migration. The source row stays as it is.

Counts:

```sql
select category, payment_status, count(*) as references
from sources
group by category, payment_status
order by category, payment_status;
```

### Block F. Current registry and excluded rows

If block A does not list `tejas_payment_utrs`, every source row is unrepresented. Record that sentence. Do not query the missing table.

If it exists, this is also read-only:

```sql
begin read only;

select category, payment_status, count(*) as registry_rows
from tejas_payment_utrs
group by category, payment_status
order by category, payment_status;

-- Compare registry keys with the same sources union.
-- A source key missing from tejas_payment_utrs is unrepresented.
select sources.category, sources.owner_reference, sources.payment_status, sources.utr_text
from sources
left join tejas_payment_utrs as registry
  on registry.utr_key = sources.utr_key
where registry.utr_key is null
order by sources.category, sources.owner_reference;

commit;
```

Rows the current file would skip, for comparison only:

- E-book rows with status `rejected`.
- Any source whose POSIX `[[:space:]]` normalization is not 6 to 40 characters.
- Every case-file reference.
- Every second row of a normalized collision.

Those rows are why the current file is not the approved backfill.

### What the owner does with a collision

Stop. Do not apply either unapplied migration. Do not edit the payment status, the UTR text, the entitlement, or the proof. Write down every row in the collision result: category, owner, original text, and status. Choose one owner in a separate written decision, or decide that the key stays unresolved. This plan contains no statement that applies that choice. A new migration can be written only after that decision, and it still must not delete or rewrite the other historical row.

A malformed row gets the same stop. The application cannot claim it. Changing the stored text is a separate approval.

## 8. Application consistency

Code conclusions from `ec38db0`:

| Check | Result |
| --- | --- |
| School, individual, both book orders, and e-book call `claimUtr` | Yes, on the payment routes and in `submitEbookProof`. |
| Same normalization on those routes | Yes. All of them use `utrKey`. |
| Concurrent duplicates after the registry exists | One insert wins. The primary key rejects the other. |
| Retry by the same owner | A conflicting insert whose `owner_reference` matches is a reuse, not a second claim. |
| Failed save | The route deletes or unlinks only the claim with that owner. A crash after the insert and before the release can leave that owner's key until a later retry or a reviewed release. |
| Another record reuses a key | Rejected when the registry insert conflicts with a different owner. |
| Historical rows before the registry exists | School payments still rely on the exact-text unique column. E-books still rely on the entitlement unique index. Those checks are not the JavaScript whitespace key. Whitespace or letter-case variants can both exist until the registry is filled. |
| Missing registry | Individual and book proofs return an error and do not mark payment verified. School proofs continue when the claim result is `unavailable`. E-book proofs continue after a non-atomic lookup of `tejas_payments`. |
| Original text | `utr_text` stores `utr.trim()`. The key is normalized. Historical source columns are not rewritten. |
| OCR approval | `decidePayment` returns staff review when the bank lookup is unavailable. `lookupTrustedTransaction` always returns unavailable. |
| Bank source | No bank provider is configured. |

Discrepancies, not changed in this task:

- `transactionSeen` looks up `tejas_payments.transaction_reference` with `ilike` on the trimmed, uppercased text. Internal spaces are not removed, so it is weaker than `utrKey`.
- The file-mode registration scan uses trim and uppercase only. The case-file scan uses the same whitespace removal as `utrKey`.
- Local e-book code treats a rejected entitlement as free for reuse. The hosted unique index does not. The proposal follows the hosted index and reserves rejected references.
- School and hosted e-book flows do not fail closed when the registry table is missing or returns an error other than a unique conflict.

## 9. Security and financial rules

The proposal adds a table with row-level security and revokes `public`, `anon`, and `authenticated`. It adds no policy, no grant to those roles, no public bucket, and no signed URL. It does not read or move proof objects. Staff proof access, the staff session check, the student session cookie, and the audit note stay as they are in `ec38db0`. The proof route still requires a staff session, builds the path on the server, and returns `private, no-store`.

No financial constant is changed by this plan.

| Payment | Gross | School share | TEJAS share |
| --- | ---: | ---: | ---: |
| School registration per student-stream | ₹150 | ₹30 | ₹120 |
| Individual registration per stream | ₹150 | ₹0 | ₹150 |
| School printed book | ₹170 | ₹34 | ₹136 |
| Individual printed book | ₹170 | ₹0 | ₹170 |

PAN is required only when the gross printed-book total is greater than ₹2,000. Eleven books are ₹1,870 and do not require it. Twelve books are ₹2,040 and do.

Registration account: TEJAS OLYMPIAD, State Bank of India, 45726198627, Chandigarh Main Branch, IFSC SBIN0000628.

Printed books and e-books: V.B. EDUCATIONAL TRUST, Union Bank of India, 535402010016278, Gita Niketan, IFSC UBIN0553549.

These values are the constants in `lib/registration/fee.ts` and `lib/registration/official-bank.ts` at this commit.

## 10. Tests, checks, and browser

| Check | Result | Scope |
| --- | --- | --- |
| `npm test` | 64 passed, 0 failed | Run on this commit during the remediation, before this document. Not run again for this plan. |
| `npx tsc --noEmit` | Passed | Same commit. |
| `npx next lint` | Passed, with the existing emblem image warning | Same commit. |
| `npm run build` | Passed | Same commit. |
| Vercel on `ec38db0` | Success, deployment completed | Preview of this pull request, confirmed again in this task. |
| Supabase Preview | Skipped | No preview branch. |
| Production SQL | Not run | Includes every preflight block in this document. |
| Browser forms | Not verified | The pull-request preview returned HTTP 302 to Vercel sign-in during the preceding audit. This task did not bypass that sign-in and did not open or submit a form. |

## 11. Owner decisions still required

1. Run block A, then only the data blocks for tables that exist.
2. If any collision, disagreement, or malformed reference appears, stop and write the ownership decision. Do not change the live rows as part of that note.
3. Approve or reject replacing `20261114_payment_utr_registry.sql` with the transaction in section 5. The replacement has not been written into the migration directory.
4. Approve `20261114_payment_verification.sql` separately. It is still unapplied.
5. Approve the maintenance order: preflight, case-file migration, registry transaction, read-only verification, then any deploy.
6. Decide whether the storage-bucket statement stays in a different change. This plan does not apply it.
7. Approve merging and deploying pull request #25 only after the registry transaction has committed, if the first new payment must take the cross-category lock.

## 12. Verdict

**A. The migration proposal is ready for owner review.**

Every repository source is in the inventory. The proposed transaction covers school payments, every e-book reference including rejected rows, and case files when that table exists. It refuses to choose a collision winner. Production preflight and a separate apply approval are still required. The current registry file is not that proposal and must not be applied as written.
