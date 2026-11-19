# TEJAS pending-work master register

Updated 19 November 2026, 10:05 PM IST, after Production verification of pull request #47. This file does not contain secrets. A task is COMPLETE only when the evidence named here was checked directly. Full disaster recovery is not complete.

## Closure gates

| Task | Status | Evidence | Blocker | Next action |
| --- | --- | --- | --- | --- |
| 1. Production deployment verified | COMPLETE | Merge `1263f47789b5be5c62802c1d3bd9ead3ecd05c9e`. GitHub deployment `7918956788`, environment Production. Vercel status success, “Deployment has completed”, target `dpl_6LB8D1Lqavja4f8UxR3ta1EX6S6b`. | None | None |
| 2. Website live-content QA | COMPLETE | Read-only checks of homepage, About, schools, FAQ, registration, Olympiad index, English, Mathematics, and Future Tech. Mobile viewport 390×844 has no horizontal overflow on the homepage and registration form. | FAQ does not state the result date. Signed-in staff review was not opened. | Owner can add the result sentence to the FAQ if that page should carry it. |
| 3. Open pull requests audited | COMPLETE | Ten open pull requests inspected on 19 November 2026. None were merged. | Owner decisions remain. | Decide each recommendation below. |
| 4. Registration and payment QA | COMPLETE | Live form and `lib/registration/fee.ts` agree on ₹150 / ₹30 / ₹120. Same-stream duplicates and class ranges are covered by the existing suite. No Production registration or payment was created. | Payment-proof upload is not open on the school form. Printed-book ordering is not offered there. | Leave the form unchanged unless the owner authorizes book sales or proof upload. |
| 5. Database backup integrity | COMPLETE | `rclone v1.76.0 hashsum SHA256` on 19 November 2026 matched the manifests and the recorded hashes for all three `.dump.enc` files. | The 15 November archive has no companion manifest. Its hash matches Section B. | None for integrity. |
| 6. Database decryption | BLOCKED | `TEJAS_BACKUP_ENCRYPTION_PASSPHRASE` is unset at user, machine, and process scope. No passphrase was guessed. | Recovery passphrase custody | Set the passphrase locally, outside chat. |
| 7. Isolated database restore | NOT STARTED | `psql` 17.12 client is installed. `pg_restore` is not installed. No database server was started. | Decryption and `pg_restore` | After decryption, restore only into an empty non-Production database. |
| 8. Storage backup integrity | COMPLETE | Storage archive recomputed to `ac76e4f8895284f098e0f674d58d8a901702f7b219809a0d51f64b358d7e72c4`, 555,336 bytes. Both identity ciphertexts match Section B. | None for the ciphertext hash. | None |
| 9. Storage decryption | BLOCKED | Identity files were hashed and not opened. Neither recovery passphrase is in the local environment. | Storage recovery passphrase | Set the matching passphrase locally, outside chat. |
| 10. Storage extraction | NOT STARTED | No isolated extraction was run. | Decryption | Extract only into an empty temporary directory. |
| 11. Application recovery verification | NOT STARTED | No restored database was available to run the application against. | Isolated restore | Run only after gate 7 passes. |
| 12. Backup automation | COMPLETE | `.github/workflows/recovery-backup.yml` has `pull_request` and `workflow_dispatch` only. There is no schedule. The `backup` job is skipped on pull requests. | No scheduled backup and no failure notification | Owner decides whether to enable a schedule and where alerts go. |
| 13. Runbook updated | IN PROGRESS | Section AQ is committed on `docs/dr-windows-verification-20261118` as `d38954013b549f75cf4ee3be8dcd131a11dfebd2`. Pull request #43 is open and was not merged. | Owner merge | Merge pull request #43, or leave the evidence on the branch. |
| 14. Full DR readiness | BLOCKED | Gates 6, 7, 9, 10, and 11 are not complete. | Passphrases and isolated restore | Do not call disaster recovery complete. |

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
| #12 | `a8184c689236e9f56cd164da7be70e8affcbe84e` | Medium. Stacked on #11 and edits many pages that later pulls already changed. | CLOSE as superseded. |
| #11 | `99821033c7d307aba5031e5196b26b41bb0fd5f1` | High. Conflicts with `main`. The later wording pulls already applied the approved facts. | CLOSE as superseded. |
| #10 | `0e33256c722f5947a4b565742f25d723a286dae7` | High. The migration file says “DO NOT RUN” because the objects were already present. | CLOSE. Do not apply. |
