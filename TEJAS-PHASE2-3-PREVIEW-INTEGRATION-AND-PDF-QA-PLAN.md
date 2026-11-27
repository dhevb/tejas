# TEJAS Phase 2.3 — Preview Integration 404 Diagnosis & PDF QA Plan

**Status:** DESIGN / DIAGNOSIS ONLY — no SQL, no publication, no Storage public access.  
**PHASE 2.3 DESIGN ONLY — PREVIEW ONLY — WAITING FOR OWNER APPROVAL.**

---

## 1. Verified Preview deployment for current PR tip

| Item | Value |
|------|--------|
| PR #73 head | `0e6295052d10ddf84e1af7882778596f5f2a604b` |
| Preview URL | https://tejas-kh7so1hw9-dhe-projects.vercel.app |
| Deployment ID | `dpl_GeZ9XLDNTQsEiaXgSvKgxHYKRNcY` |
| target | `preview` |
| READY | Yes |

Do **not** treat `tejas-7edcw033y…` (`d173d26`) as proof of the current tip.

Allowlist: `nbeslngnrsagarosuaab`. Hard-deny: `zapccpipwxduzlnvjdmy`.

---

## 2. Preview integration 404 — root cause

### 2.1 Evidence (read-only; no mutations; no secrets printed)

Probe host: `nbeslngnrsagarosuaab.supabase.co`  
Evidence file (gitignored): `.local-qa/learn-students-404-diagnosis.json`

| Path | HTTP | PostgREST code | Meaning |
|------|------|----------------|---------|
| `/rest/v1/` | 200 | — | API up |
| `/rest/v1/tejas_learn_students?select=id&limit=1` | 404 | **PGRST205** | `public.tejas_learn_students` **not in schema cache** |
| `/rest/v1/tejas_learn_entitlements?select=id&limit=1` | 404 | **PGRST205** | table missing / not exposed |
| `/rest/v1/tejas_learn_books?select=id&limit=1` | 404 | **PGRST205** | table missing / not exposed |
| `/rest/v1/tejas_payment_utrs?select=utr_key&limit=1` | 200 | — | UTR registry **present** |

Message (sanitized): `Could not find the table 'public.tejas_learn_students' in the schema cache`.

### 2.2 Expected names (repository)

| Object | Defined in |
|--------|------------|
| `tejas_learn_students` (+ related learn tables) | `supabase/migrations/20261118000100_tejas_learning_portal.sql` |
| Durable columns / RPCs / indexes | `supabase/migrations/20261118000200_tejas_learning_portal_durable.sql` |
| `tejas_payment_utrs` | Registration UTR migrations (present on Preview) |

Table names in code/probe match migrations. **Not a wrong-name bug.**

### 2.3 Interpretation

| Hypothesis | Verdict |
|------------|---------|
| Wrong table name in probe | **Rejected** — matches migration |
| Production host used | **Rejected** — allowlist host only |
| Table exists but RLS hides rows | **Rejected** — PGRST205 is “relation not found”, not empty result |
| Schema exposure / missing migration on Preview | **Most likely** — learn portal migrations **not applied** (or not in `public` API schema) on `nbeslngnrsagarosuaab` |
| Partial Preview DB | **Supported** — UTR registry exists; learn tables do not |

### 2.4 Owner approval plan (DO NOT APPLY in this phase)

Separate explicit Owner authorization required for **Preview-only**:

1. Confirm dashboard project ref is `nbeslngnrsagarosuaab` (never Production).  
2. Apply (or verify) learning portal migrations `20261118000100` then `20261118000200` on Preview only.  
3. Confirm PostgREST sees `tejas_learn_students` (GET select limit 1 → 200).  
4. Only then consider Option A RPC change (separate approval — design locked in `TEJAS-PHASE2-3-OPTION-A-RPC-DESIGN-AND-SAFETY-REVIEW.md`).  
5. Re-run `npm run test:preview-integration` with ignored `.env.preview` only.

**Permission needed:** “Owner authorizes Preview-only application of learning portal schema migrations on `nbeslngnrsagarosuaab`.”

Until then: remote integration = **BLOCKED**.

---

## 3. Five blank English PDF pages — WAITING FOR OWNER

Original sources **unchanged**. No fabricated content. No republish.

| Book | File | Page | Source SHA (catalog match) | Evidence | Owner decision |
|------|------|------|----------------------------|----------|----------------|
| eng-class-07 | `eng-class-07-ebook.pdf` | 6 | `f24075e7124f2bf7ee2fa8a28195d15cf78c4ce270e23255d75afd2078996a88` | 0 ops, 0 text, 0 annotations; browser blank white | ☐ Intentional blank ☐ Provide replacement |
| eng-class-07 | same | 74 | same | genuinely_blank_no_ops_no_text | ☐ Blank ☐ Replace |
| eng-class-07 | same | 76 | same | genuinely_blank_no_ops_no_text | ☐ Blank ☐ Replace |
| eng-class-10 | `eng-class-10-ebook.pdf` | 6 | `4293fd8ea712c42845621c4e2bb2a40529356ad7d1f7f630b17c9d62e106e373` | genuinely_blank_no_ops_no_text | ☐ Blank ☐ Replace |
| eng-class-10 | same | 80 | same | genuinely_blank_no_ops_no_text | ☐ Blank ☐ Replace |

Evidence: `.local-qa/blank-page-owner-packet.json`, `.local-qa/pdf-visual-qa/evidence.json` (gitignored).

**Status: WAITING FOR OWNER** on each page.

---

## 4. Restricted Preview content-QA account — design only

### 4.1 Goal

Allow authenticated PDF reader QA on Preview without public Storage, permanent public URLs, or Production changes.

### 4.2 Proposed mechanism (NOT implemented)

1. **Dedicated Preview student** created only on Preview DB (after learn schema exists), identified by stable UUID.  
2. Preview env only: `TEJAS_CONTENT_QA_STUDENT_ID=<uuid>` (prefer over email). Never commit the value.  
3. Existing helpers in `lib/portal/content-qa.ts` already allow that identity to open **published** books/tests without payment — they do **not** bypass publication status.  
4. Therefore Owner must still authorize **temporary Preview-only** `setPublication(…, published)` for the **minimum** book/test set under QA (prefer 1 English + 1 Math + both FT books first, expand only if needed).  
5. Preserve: private file API, no-download/no-print, one-device session, entitlement/session checks for ordinary students.  
6. **No** public buckets; **no** permanent public PDF URLs; **no** Production publication.

### 4.3 Cleanup / rollback

1. Set Preview publication back to `awaiting_approval` for QA-published items.  
2. Remove Preview env `TEJAS_CONTENT_QA_*`.  
3. Optionally deactivate/delete the Preview-only QA student row (Preview only).  
4. Confirm Production untouched.

### 4.4 Explicit non-actions until Owner says yes

- No QA account creation  
- No publication/approval changes  
- No Storage policy changes  
- No approval-gate bypass in code  

**Permission needed:** “Owner authorizes Preview-only content-QA student + temporary Preview publication of listed books/tests.”

---

## 5. Local verification classification (Phase 2.3)

| Check | Result |
|-------|--------|
| Unit tests | Run in this phase — see final report |
| Preview remote integration | **BLOCKED** (PGRST205 learn tables) |
| Authenticated Preview PDF QA | **BLOCKED** (publication + schema) |
| Option A SQL apply | **NOT RUN** (design only) |
| Option B | **Deferred** |

Never convert BLOCKED → PASS.
