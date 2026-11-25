# TEJAS — Registration Review Dashboard Source Audit

**Date:** 2026-11-24  
**Branch:** `feat/registration-review-dashboard-redesign`  
**Mode:** Read-only inventory of collected vs displayed fields (implementation follows on same branch)

---

## 1. Fee policy (server canonical)

| Item | Amount |
|------|--------|
| Gross per student-stream | ₹150 |
| School share per student-stream | ₹30 |
| TEJAS payable per student-stream | ₹120 |

Source: `lib/registration/fee.ts` (`FEE_TOTAL`, `FEE_SCHOOL`, `FEE_TEJAS`).  
N = student-stream registrations, not unique student rows. Saved in `record_snapshot.fee` and `tejas_payments.amount_due`. Dashboard must use `presentFee()` / saved breakdown — never trust browser totals for decisions.

---

## 2. School form fields (collected)

| Field | Persisted | Show on dashboard |
|-------|-----------|-------------------|
| schoolName | yes | yes |
| schoolAddress | yes | yes |
| pan | yes | list masked; detail reveal for staff |
| panHolder | yes (nullable legacy) | yes via `panHolderLabel` |
| schoolCategory | yes | yes |
| previousParticipation / previousReference | yes | yes |
| principalName / Mobile / Email | yes | yes |
| schoolEmail / schoolMobile | yes | yes |
| coordinatorName / Mobile / Email / Designation | yes | yes |
| student spreadsheet file | storage + uploadExt | download original |

---

## 3. Student sheet columns (all required)

Full name, parent name, parent mobile, parent email, DOB, class, section, roll, school name, streams.  
Identity for multi-stream rows: `fullName|DOB|parentName|parentMobile` (`lib/registration/sheet.ts`).

---

## 4. Blank / legacy — do **not** present as collected

| Field | Reason |
|-------|--------|
| state, district, city, pin | Always empty / null |
| affiliationBoard, affiliationNumber | Always empty |
| representativeName / Designation | Always null |
| printedBooks / book fees / ebook registration sale | Withdrawn; always 0 / no |
| principalDesignation | Hard-coded “Principal”, not asked |

---

## 5. Payment fields

Statuses: `pending_instructions`, `awaiting_payment`, `reported`, `confirmed`, `rejected`, `refund_pending`.  
Also: mode, paidOn, payerName, transactionReference, history, OCR fields on snapshot (`enteredUtr`, `extractedUtr`, `approvalMethod`, `verificationLabel`, `beneficiaryMatch`, `amountMatch`).

---

## 6. Field → dashboard mapping

### Summary cards
Total registrations, unique students, student-streams, English / Math / FT entries, gross, school share, TEJAS payable, received, pending payable, rejected/refund-pending. (Drop book/ebook cards as primary metrics.)

### Table row
Date, reference, school, channel, principal, coordinator, unique students, stream counts, E/M/FT, gross/share/payable, payment badge, Drive sync label.

### Detail sections
Registration summary → school → PAN → principal → coordinator → students → class counts → stream counts/fees → payment/OCR/history → files (original, consolidated) → Drive status.

---

## 7. Staff auth

Login `POST /api/register/admin/session`; logout `DELETE /api/register/admin/session` (cookie `tejas_staff`). Payment PATCH rules unchanged.

---

## 8. Google Drive

No in-app Drive integration. Recovery backups use rclone scripts/env names only — see `TEJAS-GOOGLE-DRIVE-BACKUP-DESIGN.md`.
