# TEJAS Phase 2.8 — Restricted Authenticated Preview QA Design

**Objective:** Enable authenticated content QA on Preview without public publication or weakened security.  
**Target:** Preview app + Preview Supabase only.  
**Safety:** No Production access; no public Storage; no permanent signed URLs; no real payment mutation on Production.

---

## Verdict

# DESIGN READY — EXECUTION BLOCKED ON PREVIEW LEARN SCHEMA + OWNER PUBLICATION DECISION

## Existing restricted path (already in code)

| Control | Mechanism |
|---------|-----------|
| Content QA allowlist | Exact email / stable student ID (`TEJAS_CONTENT_QA_*`) |
| Cross-stream library for QA only | `isContentQaStudent` — ordinary learners remain stream-locked |
| Retake privilege | QA-account-only; ordinary students blocked |
| PDF delivery | Authenticated reader + private file route; no public download/print |
| One-device session | `session_version` / bump session |

Unit evidence: `lib/portal/content-qa.test.ts`, `lib/portal/qa-retake.test.ts`, `lib/portal/portal.test.ts` — **PASS**.

## Required for remote Preview QA (not automatic)

1. Migrations 001+002 applied on Preview.  
2. Eng/Math (+ FT) metadata seeded.  
3. **Owner decision:** temporary restricted publication of specific books on Preview only via staff `set_publication` — **do not auto-publish**.  
4. Preview-only QA student/account (synthetic), never Production identities.  
5. Confirm Vercel Preview env points at `nbeslngnrsagarosuaab`.

## Test checklist (to run after unblock)

1. Login/logout  
2. Student identity  
3. Class/stream eligibility  
4. Purchased vs unpaid streams  
5. Companion book reading  
6. Mock-test entitlement  
7. PDF access + expiry  
8. One-device enforcement  
9. Unauthorized denial  
10. Back/forward  
11. Mobile + desktop  

## Explicit Owner decision needed

> Approve temporary Preview-only publication of QA books via staff console / RPC on `nbeslngnrsagarosuaab`, without Production publication and without public Storage.

## Not performed

- Publication  
- Preview remote authenticated browser suite (schema missing)  
- Production changes  

**Next:** After 2.4.2–2.6 + Owner Preview publication approval, execute checklist and attach evidence.
