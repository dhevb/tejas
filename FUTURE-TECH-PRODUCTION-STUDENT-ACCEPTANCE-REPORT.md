# TEJAS Future Tech — Production Student Acceptance Report

## Verdict: **FAIL**

Critical authenticated student-side verification could not be completed. No suitable paid Future Tech test-student credentials were available to this agent. Per owner instructions, the acceptance test stops at that blocker rather than inventing accounts, creating payments, or weakening authentication.

---

## Environment

| Field | Value |
| --- | --- |
| Test date/time | **23 November 2026, 18:24–18:55 IST** |
| Site under test | https://tejas.dhe.org.in/learn |
| Production deployment ID | `dpl_GrTmSNQQf2vD2DqyNqRt3KQq2miQ` |
| Production commit | `6e2bdd5ed42789e1c9953b2aabd6247b140e4b9f` (merge of PR #57) |
| Test account | **Not available** — no authorised paid Future Tech student credentials were present in the workspace, shell environment, or an existing signed-in browser session |

No passwords, OTPs, payment screenshots, API keys, or secrets are recorded in this report.

---

## Exact blocker

**Blocker:** An existing authorised **paid Future Tech** student account is required for e-book PDF reading, SHA-256 of the live file response, and mock-test UI checks. This agent:

- Found the Production student sign-in form at `/learn/login` (unsigned).
- Found **no** stored `TEJAS` student test credentials in the local workspace or shell environment.
- Did **not** create a registration, invent a payment, or alter any student/payment/publication record.
- Did **not** pull Production secrets to forge a session.

Until an owner-authorised paid Future Tech test account (Class 6–8 for Book 1 and/or Class 9–10 for Book 2) is provided to a signed-in session, student-side PDF and mock-test acceptance remains incomplete.

---

## Public / unsigned checks completed (read-only)

These checks do **not** replace authenticated student acceptance.

### Publication summary on `/learn` (unsigned)

Observed on the live public `/learn` page during this window:

| Catalog ID | Public summary |
| --- | --- |
| `ft-book-1` | **published** — Understanding IoT and IoT with Arduino (Classes VI–VIII); **5 of 5** mock tests published |
| `ft-book-2` | **published** — IoT with ESP32 and IoT with Raspberry Pi (Classes IX–X); **5 of 5** mock tests published |
| English `eng-class-03` … `eng-class-10` | **awaiting organisational approval** — **0 of 5** tests published |
| Mathematics `mat-class-03` … `mat-class-10` | **awaiting organisational approval** — **0 of 5** tests published |

English and Mathematics content was **not** observed as published.

### Unsigned access-control probes

| URL | Result | Assessment |
| --- | --- | --- |
| `/learn/dashboard` | 307 → `/learn/login` | PASS (gate) |
| `/learn/account` | 307 → `/learn/login` | PASS (gate) |
| `/learn/pay` | 307 → `/learn/login` | PASS (gate) |
| `/learn/books/ft-book-1` | 307 → `/learn/login` | PASS (gate) |
| `/learn/books/ft-book-2` | 307 → `/learn/login` | PASS (gate) |
| `/learn/tests/ft-b1-mt01` | 307 → `/learn/login` | PASS (gate) |
| `/learn/tests/ft-b2-mt01` | 307 → `/learn/login` | PASS (gate) |
| `/api/learn/books/ft-book-1/file` | **401** | PASS (gate) |
| `/api/learn/books/ft-book-2/file` | **401** | PASS (gate) |
| `/api/learn/staff/overview` | **401** | PASS (staff gate) |

### Repository PDF integrity (not a live download)

SHA-256 of the committed source files still match the replacement editions (local checkout of `main` content):

| Book | Expected SHA-256 | Local source file SHA-256 | Match |
| --- | --- | --- | --- |
| Book 1 | `e473822327b151d141e5da3a7c413b4eaffa66159666ca1ad84de800c3ea2e6e` | `e473822327b151d141e5da3a7c413b4eaffa66159666ca1ad84de800c3ea2e6e` | Yes |
| Book 2 | `b1ddb15acda75c315720f22b191038927e49b94196fc425619183b0748fc538f` | `b1ddb15acda75c315720f22b191038927e49b94196fc425619183b0748fc538f` | Yes |

This confirms the deployed tree’s source files, **not** that a paid student download returned those bytes over HTTPS.

---

## Authenticated e-book results

| Check | Book 1 (`ft-book-1`) | Book 2 (`ft-book-2`) |
| --- | --- | --- |
| Title / class eligibility in student library | **FAIL — not verified** | **FAIL — not verified** |
| Open/read PDF in student UI | **FAIL — not verified** | **FAIL — not verified** |
| New PDF served (not old VB_IOT) | **FAIL — not verified** | **FAIL — not verified** |
| Page count 60 / 67 in reader | **FAIL — not verified** | **FAIL — not verified** |
| Live download SHA-256 | **FAIL — not obtained** | **FAIL — not obtained** |

---

## Authenticated mock-test results

| Test ID | Opens | Questions/options render | Selection/navigation | Submit/result (if safe) | Wrong book/class link |
| --- | --- | --- | --- | --- | --- |
| `ft-b1-mt01` | **FAIL — not verified** | **FAIL — not verified** | **FAIL — not verified** | Not attempted | **FAIL — not verified** |
| `ft-b1-mt02` | **FAIL — not verified** | **FAIL — not verified** | **FAIL — not verified** | Not attempted | **FAIL — not verified** |
| `ft-b1-mt03` | **FAIL — not verified** | **FAIL — not verified** | **FAIL — not verified** | Not attempted | **FAIL — not verified** |
| `ft-b1-mt04` | **FAIL — not verified** | **FAIL — not verified** | **FAIL — not verified** | Not attempted | **FAIL — not verified** |
| `ft-b1-mt05` | **FAIL — not verified** | **FAIL — not verified** | **FAIL — not verified** | Not attempted | **FAIL — not verified** |
| `ft-b2-mt01` | **FAIL — not verified** | **FAIL — not verified** | **FAIL — not verified** | Not attempted | **FAIL — not verified** |
| `ft-b2-mt02` | **FAIL — not verified** | **FAIL — not verified** | **FAIL — not verified** | Not attempted | **FAIL — not verified** |
| `ft-b2-mt03` | **FAIL — not verified** | **FAIL — not verified** | **FAIL — not verified** | Not attempted | **FAIL — not verified** |
| `ft-b2-mt04` | **FAIL — not verified** | **FAIL — not verified** | **FAIL — not verified** | Not attempted | **FAIL — not verified** |
| `ft-b2-mt05` | **FAIL — not verified** | **FAIL — not verified** | **FAIL — not verified** | Not attempted | **FAIL — not verified** |

No test attempts were submitted. No student records were modified.

---

## Access-control results

| Check | Result | Notes |
| --- | --- | --- |
| Eligible paid student can access correct FT books/tests | **FAIL — not verified** | Requires paid session |
| Unpaid / unsigned cannot access paid content | **PASS** (unsigned gates) | Redirects/401 as listed above |
| Book 1 vs Book 2 class restrictions | **FAIL — not verified** | Requires Class 6–8 and Class 9–10 paid sessions |
| English/Mathematics not unintentionally published | **PASS** (public `/learn` summary) | All eng/mat rows still awaiting approval |
| No cross-student record access | **FAIL — not verified** | Requires two student sessions |

Auth, RLS, Storage, schema, payment logic, and publication records were not altered during this test.

---

## Evidence (redacted)

- Unsigned sign-in page screenshot: `docs/assets-ft-acceptance-login.png` (no credentials entered; no PII).
- Production deploy ID from response headers / Vercel inspect: `dpl_GrTmSNQQf2vD2DqyNqRt3KQq2miQ`.
- Commit on `main`: `6e2bdd5ed42789e1c9953b2aabd6247b140e4b9f`.

---

## Limitations / unverified items

1. **No paid Future Tech test account** — blocks all authenticated e-book and mock-test acceptance.
2. **Live PDF SHA-256** over `/api/learn/books/*/file` not obtained.
3. **Reader page counts** (60 / 67) not confirmed in the student UI.
4. **Mock-test UI** (open, options, navigation, safe non-submit or submit) not exercised.
5. **Class-restriction and cross-student** checks not exercised with real sessions.
6. **Staff audit trail** for prior publication events not re-fetched (staff session not used for this student acceptance).
7. Preview deployment was not used; Production only.

---

## What is required to re-run to PASS

Provide (out of band, not in chat logs if sensitive) a signed-in Production session, or credentials for:

1. A **paid** Future Tech student in **Class 6, 7, or 8** (Book 1 + `ft-b1-mt01`…`05`).
2. A **paid** Future Tech student in **Class 9 or 10** (Book 2 + `ft-b2-mt01`…`05`), or staff correction of a single test account’s class with an audit note (owner-authorised only).
3. Optionally an **unpaid** Future Tech account for negative access checks.

Then re-run this procedure without creating payments or changing publication/payment records.

---

## Final verdict

**FAIL**

Unsigned publication visibility and access gates look correct, but the mandatory authenticated student experience for both e-books and all ten mock tests was not completed.
