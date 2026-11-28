# TEJAS Phase 3.1 — Security and Regression Audit

**Objective:** Security inspection + local regression gates for the learning portal.  
**Target:** Working branch code + Preview isolation rules.  
**Safety:** No Production changes; no secret printing.

---

## Verdict

# PARTIAL PASS — LOCAL GATES GREEN; PREVIEW REMOTE SECURITY PROBES INCOMPLETE

## Automated gates (this run)

| Gate | Result |
|------|--------|
| `npm test` | **PASS** 170/170 |
| `npx tsc --noEmit` | **PASS** |
| `npx next lint` | **PASS** (2 pre-existing `<img>` warnings) |
| `npm run test:preview-integration` | **Not re-run as success** — expected BLOCKED without learn schema |
| Production build (`npm run build`) | **PASS** (exit 0) |

## Security inspection (code / design)

| Area | Finding |
|------|---------|
| Auth bypass | Student routes require session; anonymous book file refused (unit) |
| Authorization / IDOR | Entitlements keyed by student UUID; cross-student UTR denied (unit) |
| RLS | Learn migrations enable RLS with zero policies (service_role app pattern) — **not live-verified on Preview** |
| RPC privilege | EXECUTE revoked from anon/authenticated; grant service_role only (in SQL) |
| Storage exposure | No public bucket in learn migrations; reader uses authenticated route |
| Session leakage | One-device bump / session_version covered in unit tests |
| UTR reuse | Claim registry + unique reference; recovery never releases valid claim |
| Duplicate entitlements | Unique active entitlement indexes in 002 |
| Expired signed URL | Not soak-tested on Preview this phase |
| Download/print bypass | Reader controls retained; no new public download |
| Client entitlement trust | Server-side access checks in store/file route |
| Secret leakage | Reports/probes redact credentials; presence-only helpers |
| Production contamination | Preview allowlist rejects Production ref in seed tests |

## Not a substitute for

- Live Preview RLS/RPC grant verification after apply  
- Browser responsive authenticated suite  
- Production penetration test  

## Not performed

- Production SQL/env/deploy  
- Weakening controls  

**Next:** After Preview schema apply, re-run integration + grant/RLS SQL verification queries from the Owner verify packs.
