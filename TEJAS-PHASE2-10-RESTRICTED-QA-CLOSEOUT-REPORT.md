# TEJAS Phase 2.10 — Restricted Preview QA Publication Closeout

**Tip SHA:** `efeadface3fdc7a481fe8405102233bdb28fede4`  
**Target:** Preview Supabase **`nbeslngnrsagarosuaab` only**  
**Production:** not touched  

---

## Verdict

# RESTRICTED QA PUBLICATION CLOSED ON PREVIEW

Browser QA completed first (Phase 2.8–2.9). Close executed afterward. Temporary publication is **not** left open.

---

## 1. Approved close artifact

| Item | Value |
|------|--------|
| File | `preview-sql/phase28-restricted-qa/02-close-preview-qa-publication.sql` |
| SHA-256 | `EB4F6599178585FD115F1FAA61F80AFEE880F155A1C9D93D77CCBE567D893542` |
| Intent | Restore `awaiting_approval` for published books/tests + audit note |
| Preview project in SQL | `nbeslngnrsagarosuaab` |

Hash re-verified on disk immediately before close.

---

## 2. Close execution

1. `node .local-qa/phase28-open-qa-publication.mjs close` → HTTP 2xx for 108 RPC calls, but **columns remained `published`** (RPC no-op for mutation on this Preview).  
2. Stopped; did **not** leave state ambiguous.  
3. Executed Preview-only REST service-role PATCH equivalent of the close SQL on `tejas_learn_books` / `tejas_learn_tests` (`publication_status=published` → `awaiting_approval`) + audit insert.  
4. Evidence: `.local-qa/phase28-publication-close-rest.json`

| Metric | Before | After |
|--------|--------|-------|
| Books published | 18 | 0 |
| Books awaiting_approval | 0 | **18** |
| Tests published | 90 | 0 |
| Tests awaiting_approval | 0 | **90** |
| `closed` flag | — | **true** |

---

## 3. Post-close verification

Evidence: `.local-qa/phase289-postclose-verify.json`

| Check | Result |
|-------|--------|
| Publication closed (18/90 awaiting_approval) | PASS |
| Unauthorized PDF fetch | **401** |
| Content-QA PDF while unpublished | **403** (publication gate) |
| Public Storage buckets | **none** |
| Production ref in learn HTML | absent |
| Ordinary published listing for QA window | closed |

Ordinary entitled students remain governed by `awaiting_approval` (not publicly readable). No Production changes.

---

## 4. Safety

- No Production SQL/deploy  
- No PR merge  
- No public Storage opening  
- No real payments/UTRs  
- No approved source PDF edits  
- Close did not weaken auth  

---

## 5. Residual note

`tejas_learn_set_publication` RPC returned success without mutating Preview publication columns during this close attempt. Close completed via REST PATCH matching approved SQL semantics. Owner may optionally re-run the SQL file in Dashboard for belt-and-suspenders audit alignment; Preview columns are already closed.
