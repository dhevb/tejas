# Phase 40 — Application recovery verification

## Final verdict: **PASS** (amended — application-stack closed by Phase 40B)

Updated: `2026-11-22T22:50:00Z` / amended `2026-11-23T11:34:00+05:30`
Worktree: `C:\Users\Admin\Desktop\tejas\tejas-phase3`
Branch: `phase3/free-host-local` @ `6da54f6`

**Historical note:** At first issue this report recorded data-plane PASS and application-stack INCOMPLETE (Full blocked on `isolated-session-absent`). Phase 40B Full (`2026-11-23T05:06:27Z`) closed the app-stack gap — see `PHASE40B-APPLICATION-STACK-RECOVERY-REPORT.md` and `TEJAS-DR-FINAL-CERTIFICATION-REPORT.md`.

| Plane | Status |
| --- | --- |
| Data plane (DB + Storage archives, isolated decrypt/restore, inventory reconcile) | **PASS** |
| Application stack (Auth + PostgREST + Storage API + local app against isolated HTTPS project) | **PASS** (Phase 40B) |

---

## What is verified (data plane)

| Capability | Evidence |
| --- | --- |
| Database decrypt + restore on isolated loopback PG | `PHASE40-ISOLATED-DATABASE-RESTORE-REPORT.md` — PASS |
| Storage decrypt + extract + per-object SHA-256 | `PHASE39-ISOLATED-STORAGE-RESTORE-EVIDENCE.md` — PASS |
| DB catalog ↔ Storage archive key/size reconcile | Live vs Phase 38 manifest — PASS |

---

## Phase 40B investigation (application stack)

Requirements and blockers: `PHASE40B-APPLICATION-STACK-RECOVERY-REQUIREMENTS.md`
Owner action: `PHASE40B-OWNER-ISOLATED-STACK-ACTION.md`
Prep runner: `scripts/recovery/windows_app_stack_recovery_prep.ps1`
Synthetic API-shape test: `scripts/recovery/app_stack_recovery_synth.js`

### Exact app requirements (summary)

1. `SUPABASE_URL` with **`https://`** origin (`lib/registration/durable.ts` rejects `http://`).
2. `SUPABASE_SERVICE_ROLE_KEY` or fallback `SUPABASE_SECRET_KEY` (server key for REST + Storage; **app runtime**, not Phase 38 backup-reader).
3. Live Auth (`/auth/v1/health`, admin users probe), PostgREST (`/rest/v1/tejas_*`), Storage API (`/storage/v1/object/...` GET/POST/DELETE).
4. Private buckets `tejas-registration-files` and `tejas-payment-proofs` populated from Phase 38 archive.
5. Local Next.js pointed at the **isolated** project only — no production deploy/env change.

### Autonomous prep results (this PC)

| Check | Result |
| --- | --- |
| Docker / local `supabase start` | **Blocked** (Docker absent) |
| WSL distro | Absent |
| Phase 37 + 38 archives | Verified |
| App `SUPABASE_*` env | Absent |
| HTTPS gate unit test | Pass (rejects local HTTP) |
| Synthetic Auth/REST/Storage fixture SelfTest | Pass |
| Full app-stack certifiable | **false** |

### Why not falsely certified

No isolated Supabase Auth/PostgREST/Storage HTTPS endpoint is available on this workstation. Stock PG restore and file-byte restore do not exercise the application process.

---

## Safety

- No production deploy / env change
- No production Storage or DB writes for app recovery
- No secrets printed
- `service_role` not used as backup-reader

**Application-stack verdict: PASS** (Phase 40B Full) — see `PHASE40B-APPLICATION-STACK-RECOVERY-REPORT.md`.
