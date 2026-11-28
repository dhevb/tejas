# TEJAS Phase 2.5 — Option A Post-Apply Verification

**Mode:** READ-ONLY — no Option A re-run, no RPC edits, no payment/UTR submissions that update entitlements, no destructive tests.  
**Branch:** `fix/pr72-phase2-1-utr-recovery-preview-qa`  
**Target required:** Preview `nbeslngnrsagarosuaab`  
**Production:** `zapccpipwxduzlnvjdmy` — **not accessed**  
**Owner attestation:** SQL Editor returned Success (no rows) for `preview-sql/phase25-option-a/01-option-a-multistream-payment.sql`  
**Verification time (UTC):** 2026-11-28T12:12Z

---

## Final verdict

# BLOCKED — LIVE RPC EVIDENCE UNAVAILABLE

Local file hash and Preview host identity **PASS**. Live `pg_get_functiondef` bodies for `tejas_learn_report_payment` / `tejas_learn_review_payment` **could not be read** from this agent environment (no Preview Postgres URL; Dashboard still behind sign-in). Without those bodies, the agent cannot independently confirm the primary-stream predicate was removed in the **live** database.

Early-reject REST probes on Preview confirm fee/decision gates still fire and tables remain readable. That is **not** sufficient to certify Option A for integration tests.

---

## 1. Local SQL SHA-256

| Item | Value |
|------|-------|
| File | `preview-sql/phase25-option-a/01-option-a-multistream-payment.sql` |
| Expected | `6E5B1A6ABC36B51652E0B3094B6D08EA580FEA6B491DA5FAE329CB7202C35F86` |
| Measured (file bytes) | `6E5B1A6ABC36B51652E0B3094B6D08EA580FEA6B491DA5FAE329CB7202C35F86` |
| Match | **YES** |
| Repo twin | `supabase/migrations/20261128000100_tejas_learn_option_a_multistream_payment.sql` — same byte hash |

Note: hashing the file as a UTF-8 **string** after Windows-1252 decode can differ; **byte SHA-256** is authoritative and matches.

---

## 2. Live Preview RPC definitions

| Check | Result |
|-------|--------|
| `pg_get_functiondef(tejas_learn_report_payment)` | **Unavailable** to agent |
| `pg_get_functiondef(tejas_learn_review_payment)` | **Unavailable** to agent |
| PostgREST function bodies | Not exposed |
| Preview Postgres URL in `.env.preview` | Absent |
| Dashboard SQL session for agent | Sign-in wall |

**Owner next step (read-only):** run  
`preview-sql/phase25-option-a/03-readonly-verify-live-rpc.sql`  
on Preview SQL Editor (`nbeslngnrsagarosuaab` only). Expected: `still_has_primary_stream_eq = false` for both functions.

---

## 3. Primary-stream equality removal (approved scope only)

### From local applied file (static)

| Check | Result |
|-------|--------|
| `and books.stream_id = students.stream_id` in function bodies | **0 occurrences** |
| Mention only in header comment | **Yes** |
| Report + review both redefined | **Yes** |

### Live database

**Not confirmed** — blocked on missing live defs.

---

## 4–7. Retained controls (local file + limited live probes)

| Control | Local Option A SQL | Live Preview evidence |
|---------|--------------------|------------------------|
| ₹49 fee (`p_amount is distinct from 49`) | Present | Early-reject RPC → message `ebook fee must be 49` (HTTP 400) on Preview |
| Class eligibility (`classes.class_level = students.class_level`) | Present in both RPCs | Body not inspected live |
| UTR / reference uniqueness (`unique_violation` → duplicate payment reference) | Present on report | Body not inspected live |
| Ownership (`student_id = p_student`, `book_id = p_book`) | Present | Body not inspected live |
| Idempotency / status gates (`<> superseded`, report `<> verified`, review `<> unpaid`, reference not null) | Present | Body not inspected live |
| Entitlement amount gates (`amount_inr = 49`, `mock_test_amount_inr = 0`) | Present | Body not inspected live |
| EXECUTE `service_role` only | Present | Body/grants not inspected live |
| Invalid review decision gate | Present | Early-reject → `invalid decision` (HTTP 400) |

No concurrency/UTR claim-path mutation tests were run (prohibited this pass).

---

## 8. Unexpected data modification

| Check | Result |
|-------|--------|
| Option A SQL re-run by agent | **Not performed** |
| Payment/UTR submissions this pass | **Not performed** |
| Entitlement/student writes this pass | **Not performed** |
| Readable Preview tables | students / entitlements / `tejas_payment_utrs` HTTP 200 |

Sample entitlement statuses observed read-only: unpaid / reported (pre-existing Preview QA data from earlier authorized sessions — **not modified** this verification).

---

## 9–10. Target identity / Production

| Check | Result |
|-------|--------|
| Active REST host ref | `nbeslngnrsagarosuaab` |
| Exact Preview | **Yes** |
| Production accessed | **No** |

Probe artifact (gitignored): `.local-qa/option-a-readonly-probe.json`

---

## What was not performed (by design)

- Re-running Option A SQL  
- Modifying RPCs  
- Real payment/UTR flows / secondary-stream success tests  
- Integration suite  
- Production any access  

---

## Resume criteria for `OPTION A VERIFIED — READY FOR PREVIEW INTEGRATION TESTS`

1. Owner (or agent with Preview Postgres) runs `03-readonly-verify-live-rpc.sql` on `nbeslngnrsagarosuaab`.  
2. Both functions show `still_has_primary_stream_eq = false`.  
3. Fee / class / superseded / unique_violation flags match expectations in that query.  
4. Agent records those result rows in an update to this report (still read-only).

Until then, Preview integration tests that require secondary-stream payment must **not** be declared Option A–ready.

---

**BLOCKED — LIVE RPC EVIDENCE UNAVAILABLE**
