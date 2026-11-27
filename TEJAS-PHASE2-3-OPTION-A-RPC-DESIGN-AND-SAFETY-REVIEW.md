# TEJAS Phase 2.3 — Option A RPC Design & Safety Review

**Status:** DESIGN ONLY — **NOT APPLIED**. No SQL executed. No RPC replaced on Preview or Production.  
**Owner direction:** Option A recommended (interim). Option B deferred.  
**Final line:** PHASE 2.3 DESIGN ONLY — PREVIEW ONLY — WAITING FOR OWNER APPROVAL.

---

## 0. Verified Git / PR / deployment (Phase 2.3)

| Item | Value | Evidence |
|------|--------|----------|
| Working branch | `fix/pr72-phase2-1-utr-recovery-preview-qa` | `git branch` |
| Local HEAD | `0e6295052d10ddf84e1af7882778596f5f2a604b` | `git rev-parse HEAD` |
| Remote tracking | matches `origin/fix/pr72-phase2-1-utr-recovery-preview-qa` | `git status -sb` |
| PR #73 | OPEN https://github.com/dhevb/tejas/pull/73 | `gh pr view 73` |
| PR #73 base | `fix/pr71-phase2-payment-entitlement-pdf` @ `e856edce48e9f2416fc83cc016ce14fecc9b2d70` | gh |
| PR #73 head | `0e6295052d10ddf84e1af7882778596f5f2a604b` | gh |
| SHA discrepancy | Report once listed Phase 2.2 head `5909aac…` (SHA-align commit). Tip advanced one more commit to `0e62950…` (“Align Phase 2.2 Owner reports…”). **`0e62950` is the actual PR #73 head.** | `gh pr view 73 --json commits` |
| Preview for **current** head `0e62950` | https://tejas-kh7so1hw9-dhe-projects.vercel.app | GitHub Vercel status + `vercel inspect` |
| Deployment ID | `dpl_GeZ9XLDNTQsEiaXgSvKgxHYKRNcY` | Verified |
| Vercel `target` | **`preview`** | Verified |
| Status | READY | Verified |
| Branch alias | `tejas-git-fix-pr72-phase2-1-utr-recovery-pr-442e16-dhe-projects.vercel.app` | Verified |
| Older Preview `tejas-7edcw033y…` / `dpl_6UZievv…` | Maps to earlier tip `d173d26` — **not** verification of `0e62950` | Verified |

---

## 1. Option lock

| Option | Status |
|--------|--------|
| **A — Interim** (one ₹49 + one genuine UTR per unpaid stream; secondary-stream RPC predicate relax) | **Design approved direction** — SQL **not** approved |
| **B — Grouped payment** (transactions + lines + atomic verify) | **Deferred** — see prior proposal docs |

---

## 2. Current call paths (application)

| Layer | Path |
|-------|------|
| UI | `/learn/pay` — one unpaid stream + exact UTR |
| App | `lib/portal/store.ts` → `reportPayment` / `reportPaymentWithScreenshot` / `reviewPayment` |
| UTR claim | `lib/registration/utr-claim.ts` via `ebookUtrOwner(studentId, bookId)`; recovery in `lib/portal/utr-payment-recovery.ts` (no release after valid claim) |
| Remote | `lib/portal/remote-store.ts` → RPC `tejas_learn_report_payment` / `tejas_learn_review_payment` (service_role only) |
| Migration source | `supabase/migrations/20261118000200_tejas_learning_portal_durable.sql` |

**Important:** Preview currently **lacks** `tejas_learn_*` tables (PGRST205). Option A SQL cannot be usefully applied until portal schema exists on Preview (separate Owner approval). See companion plan doc.

---

## 3. Exact limitation

Both RPCs require in the `exists` subquery:

```sql
books.stream_id = students.stream_id
```

So only the student’s **primary** `tejas_learn_students.stream_id` book can be reported/reviewed. Secondary unpaid entitlements (multi-stream enrol) fail with `payment report was not accepted` / `no reported payment`.

All other predicates (student_id match, book_id, fee 49, class eligibility via `tejas_learn_book_classes`, status gates, reference uniqueness) remain required for Option A.

---

## 4. Proposed change (documentation only — DO NOT APPLY)

### 4.1 Predicate change (only required security-relevant relaxation)

**Remove** `and books.stream_id = students.stream_id` from:

1. `public.tejas_learn_report_payment`
2. `public.tejas_learn_review_payment`

**Retain** all of:

- `p_amount is distinct from 49` → reject  
- reference length 6–80  
- `entitlements.student_id = p_student` (ownership)  
- `entitlements.book_id = p_book`  
- status gates (`<> superseded`, report: `<> verified`; review: `<> unpaid`, reference not null)  
- `amount_inr = 49` and `mock_test_amount_inr = 0`  
- `exists` join: student id = `p_student`, book id = target book, **class_level** match via `tejas_learn_book_classes`  
- book `fee_inr = 49` and `mock_test_fee_inr = 0`  
- unique index `tejas_learn_entitlements_one_reference` → duplicate UTR → `unique_violation`  
- EXECUTE only `service_role`

### 4.2 Why removing primary-stream equality is safe

| Concern | Mitigation that remains |
|---------|-------------------------|
| Wrong student’s payment | `student_id = p_student` on entitlement update |
| Wrong book / stream content | Explicit `book_id = p_book`; book must exist; class eligibility join |
| Unrelated stream unlock without enrol | No entitlement row → update affects 0 rows → exception |
| Fee bypass | RPC + check constraint fee 49 |
| UTR reuse across students/books | Unique entitlement reference + app `claimUtr` registry |
| Overwrite verified | Report excludes `status = verified` |
| Different UTR overwrite reported | App `shouldAcceptIdempotentRetry`; DB unique on reference |
| Email-merge identities | RPC keys on **student UUID**, not email |
| FT companion mocks | App `isMockTestPaidByStreamEntitlement` (unchanged by RPC) |

**No other security predicate is removed.**

### 4.3 Proposed SQL sketch (NOT APPLIED)

```sql
-- PREVIEW ONLY after separate Owner SQL approval.
-- DO NOT RUN in this Phase 2.3 task.

create or replace function public.tejas_learn_report_payment(
  p_student uuid,
  p_book text,
  p_reference text,
  p_amount integer
) returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  updated_id uuid;
  clean_reference text;
begin
  if p_amount is distinct from 49 then
    raise exception 'ebook fee must be 49';
  end if;
  clean_reference := pg_catalog.btrim(p_reference);
  if clean_reference is null
     or pg_catalog.char_length(clean_reference) < 6
     or pg_catalog.char_length(clean_reference) > 80 then
    raise exception 'invalid payment reference';
  end if;
  begin
    update public.tejas_learn_entitlements
    set status = 'reported',
        transaction_reference = clean_reference,
        reported_at = pg_catalog.now(),
        note = 'Reported by the student. Content stays locked until staff verification.'
    where student_id = p_student
      and book_id = p_book
      and status <> 'superseded'
      and status <> 'verified'
      and amount_inr = 49
      and mock_test_amount_inr = 0
      and exists (
        select 1
        from public.tejas_learn_students as students
        join public.tejas_learn_books as books on books.id = p_book
        join public.tejas_learn_book_classes as classes
          on classes.book_id = books.id
         and classes.class_level = students.class_level
        where students.id = p_student
          -- REMOVED: books.stream_id = students.stream_id
          and books.fee_inr = 49
          and books.mock_test_fee_inr = 0
      )
    returning id into updated_id;
    if updated_id is null then
      raise exception 'payment report was not accepted';
    end if;
  exception
    when unique_violation then
      raise exception 'duplicate payment reference';
  end;
  insert into public.tejas_learn_audit (actor, action_name, reason, student_id, after_state)
  values (
    'student', 'report-payment', 'Student reported a payment reference.', p_student,
    pg_catalog.jsonb_build_object('bookId', p_book, 'amountInr', 49)
  );
end;
$$;

revoke all on function public.tejas_learn_report_payment(uuid, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.tejas_learn_report_payment(uuid, text, text, integer)
  to service_role;

-- Mirror the same exists() change in tejas_learn_review_payment
-- (remove only books.stream_id = students.stream_id; keep all other predicates).
```

*(Full `review_payment` body omitted here for length; design requires the identical `exists` predicate edit.)*

### 4.4 Rollback SQL (NOT APPLIED)

Restore both functions from `supabase/migrations/20261118000200_tejas_learning_portal_durable.sql` **including** `books.stream_id = students.stream_id`. No data rewrite required if only the function bodies changed.

---

## 5. Application rules Option A preserves (already in Preview app code)

1. One unpaid stream = ₹49 + one genuine UTR.  
2. Already purchased streams not charged again.  
3. Secondary-stream report for same **student UUID**.  
4. No email-only identity merge.  
5. Class + book eligibility.  
6. Student ownership.  
7. ₹49 validation.  
8. UTR uniqueness + concurrency (`claimUtr` + unique reference).  
9. Same student+book+UTR idempotent retry.  
10. Different UTR does not overwrite reported.  
11. Valid claimed UTR never released for reuse.  
12. FT Book 2 → Book 1 companion reading; Book 1 mocks stay locked unless Book 1 payable entitled.

---

## 6. Required tests after future Owner-approved Preview apply

| Case | Expect |
|------|--------|
| Primary stream report + verify | PASS |
| Secondary stream report + verify (same student UUID) | PASS |
| Already-paid stream re-charge | Reject |
| Duplicate UTR other student | Reject |
| Concurrent same UTR claims | One wins |
| Same UTR retry same student/book | Idempotent |
| Different UTR after reported | Reject |
| Pending/rejected access | Denied |
| Verified unlocks only paid stream | PASS |
| FT Book 2: Book 1 readable, Book 1 mocks locked | PASS |
| Cross-student isolation | PASS |

Until Preview learn schema exists + SQL approved: remote suite remains **BLOCKED**.

---

## 7. Actions NOT performed in Phase 2.3

- No Supabase migration created or applied  
- No SQL execution  
- No remote RPC replace/alter  
- No schema/data change  
- No Production access  
- No merge of #71/#72/#73  
- No Production deploy  
- No secret disclosure  

**Owner permission still required to:** apply portal schema on Preview (if missing), then apply Option A RPC change on Preview only.
