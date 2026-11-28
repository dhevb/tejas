# TEJAS Phase 2.9 — PDF and Mock-Test QA Matrix

**Tip SHA:** `efeadface3fdc7a481fe8405102233bdb28fede4`  
**Preview DB:** `nbeslngnrsagarosuaab`  
**Evidence:** `.local-qa/phase289-access-matrix.json`, `.local-qa/phase289-pdf-fetch-qa.json`, `.local-qa/phase289-mock-lifecycle-qa.json`  
**Verdict:** **PASS** (18/18 books, 90/90 mocks, FT rules PASS)

Columns: Auth = authorized access; Unauth = unauthorized denied; PDF = authenticated fetch integrity; Pages = rendered/catalog page count; Blanks = unexpected blanks (Owner-accepted listed separately); Final.

## Books (18)

| Stream | Class | Book ID | Title | Auth | Unauth | PDF | Pages | Blanks | Final |
|--------|------:|---------|-------|------|--------|-----|------:|--------|-------|
| technology | 6,7,8 | `ft-book-1` | Understanding IoT and IoT with Arduino | PASS | PASS | PASS | 60 | none unexpected | PASS |
| technology | 9,10 | `ft-book-2` | IoT with ESP32 and IoT with Raspberry Pi | PASS | PASS | PASS | 67 | none unexpected | PASS |
| english | 3 | `eng-class-03` | TEJAS English Class 3 | PASS | PASS | PASS | 102 | none unexpected | PASS |
| english | 4 | `eng-class-04` | TEJAS English Class 4 | PASS | PASS | PASS | 110 | none unexpected | PASS |
| english | 5 | `eng-class-05` | TEJAS English Class 5 | PASS | PASS | PASS | 103 | none unexpected | PASS |
| english | 6 | `eng-class-06` | TEJAS English Class 6 | PASS | PASS | PASS | 92 | none unexpected | PASS |
| english | 7 | `eng-class-07` | TEJAS English Class 7 | PASS | PASS | PASS | 125 | 6,74,76 Owner-accepted intentional | PASS |
| english | 8 | `eng-class-08` | TEJAS English Class 8 | PASS | PASS | PASS | 130 | none unexpected | PASS |
| english | 9 | `eng-class-09` | TEJAS English Class 9 | PASS | PASS | PASS | 134 | none unexpected | PASS |
| english | 10 | `eng-class-10` | TEJAS English Class 10 | PASS | PASS | PASS | 160 | 6,80 Owner-accepted intentional | PASS |
| mathematics | 3 | `mat-class-03` | TEJAS Mathematics Class 3 | PASS | PASS | PASS | 89 | none unexpected | PASS |
| mathematics | 4 | `mat-class-04` | TEJAS Mathematics Class 4 | PASS | PASS | PASS | 87 | none unexpected | PASS |
| mathematics | 5 | `mat-class-05` | TEJAS Mathematics Class 5 | PASS | PASS | PASS | 104 | none unexpected | PASS |
| mathematics | 6 | `mat-class-06` | TEJAS Mathematics Class 6 | PASS | PASS | PASS | 100 | none unexpected | PASS |
| mathematics | 7 | `mat-class-07` | TEJAS Mathematics Class 7 | PASS | PASS | PASS | 168 | none unexpected | PASS |
| mathematics | 8 | `mat-class-08` | TEJAS Mathematics Class 8 | PASS | PASS | PASS | 139 | none unexpected | PASS |
| mathematics | 9 | `mat-class-09` | TEJAS Mathematics Class 9 | PASS | PASS | PASS | 147 | none unexpected | PASS |
| mathematics | 10 | `mat-class-10` | TEJAS Mathematics Class 10 | PASS | PASS | PASS | 187 | none unexpected | PASS |

### Browser visual spot-check

- `eng-class-07`: cover renders; **Page 1 of 125**; Next/Previous/zoom enabled; download/print closed copy shown.
- Intentional blanks confirmed via pdfjs operator/text probe (not flagged as defects).

## Mock tests (90)

All 90 catalog tests: **authorized PASS / unauthorized denied PASS** in access matrix.

| Stream books covered | Tests | Matrix |
|----------------------|------:|--------|
| Future Tech Book 1 + 2 | 10 | PASS |
| English Classes 3–10 | 40 | PASS |
| Mathematics Classes 3–10 | 40 | PASS |
| **Total** | **90** | **90/90 PASS** |

Full per-test IDs are recorded in `.local-qa/phase289-access-matrix.json` → `tests.rows`.

### Lifecycle samples (content-QA only)

| Test | Start | Submit/score | Result page | QA retake | Cross-student deny | Final |
|------|-------|--------------|-------------|-----------|--------------------|-------|
| `eng-c07-mt01` | PASS | PASS | PASS | PASS | PASS | PASS |
| `mat-c07-mt01` | PASS | PASS | PASS | PASS | PASS | PASS |
| `ft-b2-mt01` | PASS | PASS | PASS | PASS | PASS | PASS |
| `eng-c03-mt01` | PASS | PASS | PASS | PASS | PASS | PASS |

Unauth start **401**; wrong-origin **403**.

## Future Tech rules

| Class band | Checks | Status |
|------------|--------|--------|
| 6–8 | Book 1 readable; Book 1 five mocks accessible | PASS |
| 9–10 | Book 1 companion readable; Book 2 readable; Book 2 five mocks accessible; Book 1 mocks locked; no second Future Tech charge | PASS |

## Security row (all books)

Private Storage (no public buckets); authenticated reader fetch; no permanent public PDF URL; session required; entitlement checked server-side.
