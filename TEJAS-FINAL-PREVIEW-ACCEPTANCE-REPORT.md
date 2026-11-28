# TEJAS Final Preview Acceptance Report

**Branch:** `fix/pr72-phase2-1-utr-recovery-preview-qa`  
**Tip SHA:** `627bf3a7cf8885721f8a28d74c4f4cebf02cff73`  
**Prior tip (pre-PDF.js commit):** `efeadface3fdc7a481fe8405102233bdb28fede4`  
**Preview Supabase:** `nbeslngnrsagarosuaab`  
**Production Supabase:** `zapccpipwxduzlnvjdmy` — **untouched**  
**Production site:** `https://tejas.dhe.org.in` — **untouched**  
**Independent audit:** `TEJAS-FINAL-INDEPENDENT-RELEASE-AUDIT.md` (2026-11-28T14:40Z)

---

## Final verdict

# READY WITH DOCUMENTED LIMITATIONS

Preview browser QA and restricted publication closeout remain **PASS**. Closure cycle **re-verified** live Preview inventory (18/90), fees ₹49, publication closed (`awaiting_approval`), private Storage, unauthenticated PDF **401**, PR stack OPEN/MERGEABLE, unit tests **170/170**, and PDF.js fix commit **`627bf3a`** with reader/browser/build evidence. Limitations: Option A certified by behavioral 12/12 evidence (not fresh `pg_get_functiondef`); publication RPC close quirk; Production still requires separate Owner authorization.

---

## Phase status

| Phase | Status | Evidence class |
|-------|--------|----------------|
| 2.4.2 Migrations 001→002 | **PASS** | VERIFIED live REST + hashes |
| 2.5 / 2.5.1 Option A | **PASS** | EVIDENCE-FILE 12/12 + SQL hash VERIFIED |
| 2.6 Content inventory | **PASS** | VERIFIED 18/90 live |
| 2.7 Blank pages | **PASS** | Owner-accepted intentional |
| 2.8–2.9 Browser PDF/mock QA | **PASS** | EVIDENCE-FILE + prior browser session |
| 2.10 Restricted QA closeout | **PASS** | VERIFIED closed live |
| Phase A PDF.js fix | **PASS** | COMMITTED `627bf3a` + test evidence |
| Independent release audit | **PASS with limitations** | This cycle |
| Production | **NOT AUTHORIZED** | — |

---

## Database project identity

- Preview `nbeslngnrsagarosuaab`: learn tables live; publication **closed** (18/90 `awaiting_approval`)  
- Production `zapccpipwxduzlnvjdmy`: not modified  

## Recorded facts (closure)

| Fact | Evidence |
|------|----------|
| Live 18 books / 90 mock tests | Post-close REST verify `bookCount.awaiting_approval: 18`, `testCount.awaiting_approval: 90` |
| ₹49 per stream | Live metadata + Option A fee gate case 6 |
| Preview publication closed | All learn books/tests `awaiting_approval` |
| Private Storage | `publicBuckets: []` |
| Unauthenticated PDF HTTP 401 | Post-close + PDF.js reader check |
| Unit tests 170/170 | `npm test` PASS |
| Option A integration 12/12 | `.local-qa/phase251-option-a-integration.json` retained |
| No fresh `pg_get_functiondef` | Explicit limitation |
| PR #71 / #72 / #73 | OPEN + MERGEABLE (`gh`) |
| PDF.js fix commit | `627bf3a` — Load pdf.js from public assets… |

## PDF.js Phase A evidence

| Check | Result |
|-------|--------|
| Asset hashes vs `pdfjs-dist@5.4.296` | MATCH |
| `/public/pdfjs` gitignored + copy script | YES |
| Reader check (`next start :3001`) | PASS (assets 200, unauth 401, authed unpublished 403) |
| Browser `getDocument` | PASS (`pages: 1`) |
| `next build` | PASS (`BUILD_EXIT=0`) |

## Security findings

- No public Storage buckets (re-verified)  
- Unauth PDF **401** (re-verified on production build server)  
- Service-role fee gate + anon reject recorded in Option A evidence  
- School CSV/XLSX exports present on disk — **not staged / not committed**

## Known limitations

1. Option A live function bodies not re-read via Postgres in this cycle.  
2. `set_publication` RPC did not mutate columns during close; REST PATCH closed Preview.  
3. PR merge stack #71→#72→#73 not executed; tip `627bf3a` is **ahead 1** (unpushed) until Owner push.  
4. No Production deploy.

## Outstanding Owner actions

1. Authorize push of `627bf3a` (+ optional approved docs) to refresh PR #73.  
2. Review and merge PR stack in order when ready.  
3. Separate Production window authorization (backup, hashes, target confirm).  
4. PII review before any school export commit.

## Production readiness recommendation

See `TEJAS-PRODUCTION-READINESS-PACKAGE.md` and independent audit. **Do not** treat this as Production go-live authorization.

---

**READY WITH DOCUMENTED LIMITATIONS**
