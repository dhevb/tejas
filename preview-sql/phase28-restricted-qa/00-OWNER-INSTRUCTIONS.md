# Phase 2.8 — Temporary restricted Preview content-QA publication

**Target only:** `nbeslngnrsagarosuaab`  
**Never:** `zapccpipwxduzlnvjdmy`

Owner Decision 2 (2026-11-28) authorizes temporary Preview QA publication.

## Prerequisites

Migrations 001+002 applied; Eng/Math seed recommended so all 18 books / 90 tests exist.

## Open (during QA)

1. Confirm URL project ref = `nbeslngnrsagarosuaab`.
2. Run `01-open-preview-qa-publication.sql`
   - SHA-256: `BF277923E03AD6F5F3297A919DE0F1DE3BFD6E4387C002FBEA01F05E2E1FBCB1`
3. Publishes 18 books + 90 tests for Preview QA.
4. Does **not** open public Storage or permanent PDF URLs.

## Close (after QA)

1. Confirm Preview ref again.
2. Run `02-close-preview-qa-publication.sql`
   - SHA-256: `EB4F6599178585FD115F1FAA61F80AFEE880F155A1C9D93D77CCBE567D893542`
3. Restores `awaiting_approval`.

## Access model

- Ordinary learners still need entitlements / payment rules.
- Content-QA allowlisted account uses existing `TEJAS_CONTENT_QA_*` server controls.
- PDF delivery remains via authenticated app reader routes.
