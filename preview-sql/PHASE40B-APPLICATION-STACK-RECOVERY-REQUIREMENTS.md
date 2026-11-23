# Phase 40B — Isolated Supabase application-stack recovery requirements

Updated: `2026-11-22T22:40:00Z` / `2026-11-23T04:10:00+05:30`
Worktree: `phase3/free-host-local` @ `6da54f6`
**Full application-stack recovery: CERTIFIED PASS** (`2026-11-23T05:06:27Z` — see `PHASE40B-APPLICATION-STACK-RECOVERY-REPORT.md`)

This document states the exact surface that was required to upgrade Phase 40 App Recovery from PARTIAL (data plane) to a full isolated application-stack PASS. The requirements below are retained as the bill of materials; satisfaction is evidenced in the Phase 40B report (not re-claimed here as a second independent PASS ceremony).

---

## 1. Why data-plane PASS ≠ app-stack PASS

| Layer | What Phase 37–40 proved | What the Next.js app still needs |
| --- | --- | --- |
| PostgreSQL bytes | TEJAS1 open + `pg_restore` on stock loopback PG | Same schema **served through PostgREST** (`/rest/v1`) |
| Storage file bytes | TEJAS1 open + SHA-256 vs manifest | Same objects **served through Storage HTTP** (`/storage/v1/object/...`) |
| Auth | Not required for dump/restore | At least GoTrue health + admin probe used by `testSupabaseConnection` |
| App process | Not pointed at restored resources | Local Next.js with isolated HTTPS URL + server key |

Stock PostgreSQL on `127.0.0.1:55432` has **no** Kong/PostgREST/GoTrue/Storage API. Therefore catalog restore alone cannot certify registration submit, proof upload, staff portal REST, or connection probes.

---

## 2. Application dependency map (from code)

Source of truth: `lib/registration/durable.ts`, `database.ts`, `supabase-status.ts`, `lib/portal/supabase-rest.ts`, `staff-directory.ts`.

### 2.1 Required configuration

| Name | Role | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | API origin | **Must be `https://`** — `supabaseOrigin()` rejects `http://` (so bare `supabase start` on `http://127.0.0.1:54321` is incompatible without TLS termination or a hosted HTTPS project) |
| `SUPABASE_SERVICE_ROLE_KEY` | Preferred server key | Used as `apikey` + `Authorization: Bearer` for REST and Storage |
| `SUPABASE_SECRET_KEY` | Fallback server key | Used only if service-role env absent |

`durableStorageConfigured()` is true only when URL origin and a server key (≥20 chars) are both present.

### 2.2 HTTP surfaces the app calls

| Surface | Methods used | Purpose |
| --- | --- | --- |
| `/auth/v1/health` | GET | Reachability |
| `/auth/v1/admin/users` | GET | Confirms key is a **server** key (`testSupabaseConnection`) |
| `/rest/v1/` | GET | OpenAPI / acceptance |
| `/rest/v1/tejas_*` | GET/POST/PATCH/DELETE | Registration, payments, audit, portal, staff tables |
| `/rest/v1/rpc/tejas_staff_bump_session` | POST | Staff session version |
| `/storage/v1/object/{bucket}/{path}` | GET, POST (upsert), DELETE | Registration sheets + payment proofs |

### 2.3 Storage buckets

| Bucket | Public | App use |
| --- | --- | --- |
| `tejas-registration-files` | false | Student sheet upload / download |
| `tejas-payment-proofs` | false | Receipt upload / download |

Held migration notes: anonymous/authenticated clients have no Storage write policies; **the server uses the service/secret key after its own staff checks**. That is an **application runtime** privilege, not a backup-reader credential.

### 2.4 Optional / related env

| Name | Role |
| --- | --- |
| `TEJAS_ADMIN_TOKEN` | Staff cookie login (no default) |
| `TEJAS_DATA_DIR` | Local non-Vercel file fallback when durable storage not configured |
| `SUPABASE_ANON_KEY` / publishable | Not required by durable server path; listed in inspect probes only |
| `DATABASE_URL` / `SUPABASE_DB_URL` | Not used by the Next registration durable path (REST only) |

### 2.5 Explicit non-goals for backup-reader

Phase 38 Storage **backup** correctly forbids using `service_role` / `sb_secret_*` as the Storage-reader session.
Phase 40B application recovery against an **isolated** stack **does** require the isolated project’s own server key for the Next.js server — never paste it into chat; never point production Vercel env at the recovery project in this DR line without a separate owner change control.

---

## 3. Exact recovery stack bill of materials

To certify full application-stack recovery:

1. **Isolated Supabase platform** (one of):
   - **A (preferred on this PC):** New disposable **hosted** Supabase project (HTTPS URL + its own anon/publishable + service/secret keys), **or**
   - **B:** Local `supabase start` **with Docker** plus HTTPS reverse proxy (or an approved durable.ts change — out of scope unless owner authorizes).
2. **Database load:** Open Phase 37 TEJAS1 → restore into the isolated Postgres (expect role/extension warnings; must still expose TEJAS public tables via PostgREST).
3. **Storage load:** Open Phase 38 TEJAS1 → upload all 79 objects into the two private buckets with paths matching `storage.objects` / manifest.
4. **Secrets provisioning (local only):** Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (or secret) for a **local** Next process (`.env.local` / user env / CM). Do not commit. Do not deploy.
5. **Application integration checks (local):**
   - `testSupabaseConnection()` → `connected: true`
   - Read sample registration references / staff tables via REST
   - GET at least one registration file and one payment proof from Storage
   - Synthetic idempotent registration write **only** on the isolated project (never production)
6. **Negative controls:** Wrong key fails; production project ref must not be the recovery URL; no `service_role` used as Phase 38 backup-reader.

---

## 4. Machine readiness (this workstation)

Inspected by `scripts/recovery/windows_app_stack_recovery_prep.ps1`:

| Check | Result |
| --- | --- |
| Docker | **Absent** → local `supabase start` blocked |
| WSL distro | **Absent** |
| Local PG `55432` | Listening (stock PG only) |
| Phase 37 / 38 archives | Verified present |
| App `SUPABASE_*` env | Absent |
| HTTPS gate | Rejects `http://127.0.0.1:54321` |

**Conclusion:** Full app-stack certification on this PC requires an **owner-provisioned isolated hosted Supabase project** (or owner install of Docker + HTTPS front-end). The agent cannot create cloud projects or install Docker without owner action.

---

## 5. Certification rule

- **Data-plane certification:** PASS (Phases 37–41).
- **Application-stack certification:** **PASS** as of Phase 40B Full (`PHASE40B-APPLICATION-STACK-RECOVERY-REPORT.md`). §3 steps 1–5 were the gate; they are now evidenced.

Owner action checklist (historical provisioning path): `PHASE40B-OWNER-ISOLATED-STACK-ACTION.md`.
