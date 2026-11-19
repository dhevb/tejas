# TEJAS pending-work master register

Updated 19 November 2026, 10:55 PM IST. Production commit `1263f47` was rechecked, `/documents` returned HTTP 404, and the three PDFs in pull request #12 were read page by page. This file does not contain secrets. A task is COMPLETE only when the evidence named here was checked directly. Full disaster recovery is not complete.

## Closure gates

| Task | Status | Evidence | Blocker | Next action |
| --- | --- | --- | --- | --- |
| 1. Production deployment verified | COMPLETE | Merge `1263f47789b5be5c62802c1d3bd9ead3ecd05c9e`. GitHub deployment `7918956788`, environment Production. Vercel status success, “Deployment has completed”, target `dpl_6LB8D1Lqavja4f8UxR3ta1EX6S6b`. | None | None |
| 2. Website live-content QA | COMPLETE | Read-only checks of homepage, About, schools, FAQ, registration, Olympiad index, English, Mathematics, and Future Tech. Mobile viewport 390×844 has no horizontal overflow on the homepage and registration form. | FAQ does not state the result date. Signed-in staff review was not opened. | Owner can add the result sentence to the FAQ if that page should carry it. |
| 3. Open pull requests audited | COMPLETE | Eleven open pull requests inspected on 19 November 2026. None were merged. The earlier close recommendation for #12 is withdrawn. | Owner decisions remain. | Decide each recommendation below. |
| 4. Official documents validated and published | BLOCKED | Production `/documents` returned HTTP 404 on 19 November 2026. The three PDFs in pull request #12 were read. The invitation and brochure disagree with the approved 30 November deadline, and the brochure QR opens a Google Form. | Corrected official PDFs are not available. | Do not publish the current PDFs. The owner supplies corrected originals. |
| 5. Registration and payment QA | COMPLETE | Live form and `lib/registration/fee.ts` agree on ₹150 / ₹30 / ₹120. Submit, preview, and staff session routes call `rateLimit`. Same-stream duplicates are rejected in `lib/registration/sheet.ts`. No Production registration or payment was created. | Payment-proof upload is not open on the school form. Printed-book ordering is not offered there. | Leave the form unchanged unless the owner authorizes book sales or proof upload. |
| 6. Database backup integrity | COMPLETE | `rclone v1.76.0 hashsum SHA256` on 19 November 2026 matched the manifests and the recorded hashes for all three `.dump.enc` files. | The 15 November archive has no companion manifest. Its hash matches Section B. | None for integrity. |
| 7. Database decryption | BLOCKED | Rechecked at 10:55 PM IST. `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` is unset at user, machine, and process scope. No passphrase was guessed. | BLOCKED — BACKUP PASSPHRASE CUSTODY | Set the passphrase locally, outside chat. |
| 8. Isolated database restore | NOT STARTED | `psql` 17.12 client is installed. `pg_restore` is still absent. No database server was started. | Decryption and `pg_restore` | After decryption, restore only into an empty non-Production database. |
| 9. Storage backup integrity | COMPLETE | Storage archive SHA-256 `ac76e4f8895284f098e0f674d58d8a901702f7b219809a0d51f64b358d7e72c4`, 555,336 bytes, recomputed 19 November 2026. Both identity ciphertexts match Section B. | None for the ciphertext hash. | None |
| 10. Storage decryption | BLOCKED | Identity files were hashed and not opened. `TEJAS_BACKUP_OWNER_PASSPHRASE` is unset. | BLOCKED — STORAGE RECOVERY KEY | Set the matching passphrase locally, outside chat. |
| 11. Storage extraction | NOT STARTED | No isolated extraction was run. | Decryption | Extract only into an empty temporary directory. |
| 12. Application recovery verification | NOT STARTED | No restored database was available to run the application against. | Isolated restore | Run only after the isolated database restore passes. |
| 13. Backup automation | COMPLETE | `.github/workflows/recovery-backup.yml` has `pull_request` and `workflow_dispatch` only. There is no schedule and no failure alert. The `backup` job is skipped on pull requests. A passing test is not a Production backup. | No scheduled backup | Owner decides whether to enable a schedule and where alerts go. |
| 14. Runbook updated | IN PROGRESS | Section AQ is on pull request #43 at `d38954013b549f75cf4ee3be8dcd131a11dfebd2`. It was not merged. | Owner merge | Merge pull request #43, or leave the evidence on the branch. |
| 15. Full DR readiness | BLOCKED | Decryption, isolated restore, Storage extraction, and application recovery are not complete. | Passphrases and isolated restore | Do not call disaster recovery complete. |

## Live page check

Expected result sentence: “Results to be declared on 12 January 2027”. Expected eligibility: English and Mathematics Classes 3–10, Future Tech Classes 6–10. “Results are declared” was 0 on every page checked. “20 November” was 0.

| Page | Actual text | Result |
| --- | --- | --- |
| https://tejas.dhe.org.in/ | Exact sentence is visible in the steps and dates. Classes 3–10 and 6–10. Fee ₹150. Deadline 30 November 2026. “1st DHE English Olympiad” is labelled as 2025. | Pass |
| https://tejas.dhe.org.in/about | Exact sentence, Classes 3–10 and 6–10, ₹150, and separate ₹49 e-book wording. | Pass |
| https://tejas.dhe.org.in/schools | Exact sentence, 30 November 2026, and ₹150. Class ranges are not repeated on this page. | Pass |
| https://tejas.dhe.org.in/faq | Classes 3–10 and 6–10, 30 November 2026, and ₹150. The result sentence is absent. “Class III–IV” remains only in the 2025 level answer. | Pass for eligibility. The result date is not stated. |
| https://tejas.dhe.org.in/schools/register | Visible radios “School PAN” and “Authorised Staff PAN”. Classes 3–10 and 6–10. ₹150. The multi-stream row instruction is present. The form does not order printed books or charge the ₹49 e-book. | Pass |
| https://tejas.dhe.org.in/olympiads | Exact sentence. English and Mathematics 3–10. Future Tech 6–10. | Pass |
| https://tejas.dhe.org.in/olympiads/english | Exact sentence and Classes 3–10. Historical “1st DHE English Olympiad” remains. | Pass |
| https://tejas.dhe.org.in/olympiads/mathematics | Exact sentence and Classes 3–10. | Pass |
| https://tejas.dhe.org.in/olympiads/technology | Exact sentence and Classes 6–10. | Pass |
| https://tejas.dhe.org.in/contact | `tejas@dhe.org.in`, +91 99886 90588, and +91 79034 31900. HTTP 200. | Pass |
| https://tejas.dhe.org.in/documents | HTTP 404. No documents page is deployed. | Fail. The page is absent. |

Mobile check at 390×844: homepage and registration `scrollWidth` equals `innerWidth`. No horizontal overflow.

## Database checksums recomputed

| Object | Bytes | SHA-256 | Result |
| --- | --- | --- | --- |
| `tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc` | 476,816 | `49d69874bc494c2c353a903906045ece4ad37c989a69ddaf0ae7195314fcdde1` | Matches Section B. No manifest file. |
| `tejas-zapccpipwxduzlnvjdmy-20261117T175954Z.dump.enc` | 479,856 | `536b6e17b42b20d1c42f487e57052f04b0b64b8e8fd2e2cb24fa53a00312b630` | Matches its manifest. |
| `tejas-zapccpipwxduzlnvjdmy-20261117T184209Z.dump.enc` | 479,856 | `1dd023171475ebf2386918ad7be4ba9634b02dc4145f1e643b820ece148d0cd5` | Matches its manifest. |
| `tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age` | 555,336 | `ac76e4f8895284f098e0f674d58d8a901702f7b219809a0d51f64b358d7e72c4` | Matches Section B. |

Encryption of the database archives is OpenSSL AES-256-CBC with PBKDF2 and salt. The Storage archive is an age-encrypted tar. PostgreSQL 17.11 is the source server named by the 18:42:09 UTC manifest, dumped by pg_dump 17.12.

## Open pull requests

| PR | Head | Risk | Recommendation |
| --- | --- | --- | --- |
| #43 | `d38954013b549f75cf4ee3be8dcd131a11dfebd2` after the checksum commit is pushed | Low. Documentation only. | OWNER APPROVAL REQUIRED to merge. Safe to merge. |
| #25 | `fff8cd20cd78ecca7d0c8beeef83f25cd4eb805c` | High. Conflicts with `main`. Payment and migration changes. The UTR migration locks live payment tables and backfills a new registry. | OWNER APPROVAL REQUIRED. Do not merge or apply. |
| #22 | `e4f1da093a1e8d885603aed6e008347b7978680c` | Low, but the report describes 14 November Production commit `24355920`. | CLOSE as a historical snapshot, or leave it unmerged. |
| #21 | `141f7a0de1fef8d28d34f2a72f5bd6331fb2dce1` | Low. It records the merge of pull request #20 and is not the current deployment. | CLOSE as superseded. |
| #17 | `51977d310f03f8922fd9dbadb8c7303ae7e91344` | Low. A 13 November read-only publication record. Not rechecked against the database in this pass. | OWNER APPROVAL REQUIRED. Keep as history or close. |
| #16 | `2d83573d94939e536ee6c656161932543faf76fb` | Low. It says publication had not been performed. Pull request #17 later records 12 published items. | CLOSE as superseded by #17. |
| #13 | `9af04370298d27911fea7167066a70315f3100d9` | High. Stacked on #12, with registration, e-book, and migration changes. | OWNER APPROVAL REQUIRED. Do not merge. |
| #48 | `e39497b981b489ae0590583274c99ac02f449fd4` | Low. Documentation only. | OWNER APPROVAL REQUIRED. Safe to merge after this correction. |
| #12 | `a8184c689236e9f56cd164da7be70e8affcbe84e` | High until the PDFs match the approved dates. Unique unpublished files. Stacked on #11. | OWNER APPROVAL REQUIRED. Do not merge or publish these PDFs unchanged. |
| #11 | `99821033c7d307aba5031e5196b26b41bb0fd5f1` | High. Conflicts with `main`. The later wording pulls already applied the approved facts. | CLOSE as superseded. |
| #10 | `0e33256c722f5947a4b565742f25d723a286dae7` | High. The migration file says “DO NOT RUN” because the objects were already present. Its OpenAPI redaction test is already on `main`. The renamed migration filenames are not on `main` and must not be executed. | CLOSE. Do not apply. |

## Official documents in pull request #12

These files were downloaded from commit `a8184c689236e9f56cd164da7be70e8affcbe84e` and read. They are not on Production.

| File | Pages | SHA-256 | What was read |
| --- | --- | --- | --- |
| `tejas-olympiad-2026-27-invitation.pdf` | 2 | `8839e13e0b6dec4230f35c498e8d8154f3aad9db91d69f51598c79046500c865` | Letter DHE/TEJAS/26-27/03, dated 31 October 2026. Classes 3–10 and 6–10. Examinations 9, 10, and 11 December 2026. Fee ₹150, school share ₹30, remittance ₹120. Printed book ₹170 with ₹34 school share. E-book ₹49. Last registration date printed as 20 November 2026. Results are described as to be communicated separately. The letter closes with the typed name Sonu Agnihotri Sharma, Convener. The registration link is `https://tejas.dhe.org.in/schools/register`. |
| `tejas-olympiad-2026-27-brochure.pdf` | 4 | `819b16ef196f4895d2df501d79043fbc2eba95ace2a1f0fcd3aad3a3bbf51101` | Classes III–X and VI–X. Examinations 9–11 December 2026. Timeline prints registration 02–22 November 2026 and results 12 January 2027. The 2025 Olympiad is described as historical. The QR image on page 3 decodes to `https://forms.gle/mfKRAEPLLE5fkDDT6`, which redirects to a Google Form. The form was not submitted. |
| `dhe-english-olympiad-2025-brief-report.pdf` | 12 | `b1f1cca10f1473f3a4ac7d1ab8b5a82150fae0bbdf42d525bb71c0e20e58a390` | Historical 2025 report: 13–16 October 2025, Classes I–X, 10,040 students, 25 schools. It is not a 2026–27 registration document. There is no separate approved-original checksum to compare it with. |

The documents page in that pull request describes these differences. It does not correct the PDF bytes. Publishing the page would still serve the 20 November invitation, the 02–22 November brochure, and the Google Form QR.

Pull request #11 conflicts with `main`. Its site-alignment edits are already covered by merged pull requests #44–#47. It does not contain the documents page. Pull request #13 is stacked on #12 and adds registration, book, and e-book changes. It must not be merged with the documents.
