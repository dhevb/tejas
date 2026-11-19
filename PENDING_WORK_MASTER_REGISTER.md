# TEJAS pending-work master register

Recorded 19 November 2026 from GitHub, the live site, a read-only Drive listing, and local tests. This file does not contain secrets. A task is COMPLETE only when the evidence named here was checked. FULL DISASTER RECOVERY is not complete.

## Current repository state

| Item | Evidence |
| --- | --- |
| `origin/main` | `47833c2ba5452635626d8f871b9e59919423c8e3`, merge of PR #46 |
| Production Vercel status for that commit | SUCCESS, “Deployment has completed” |
| Live domain checked | https://tejas.dhe.org.in |
| Open pull requests | #43, #25, #22, #21, #17 |
| Disaster-recovery checkout | `docs/dr-windows-verification-20261118` at `60c2e3d`, clean. Not modified in this pass. |

## Register

| ID | Description | Status | Evidence | Remaining work | Risk | Authorization | Owner decision | Completion criteria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W-01 | Registration deadline 30 November 2026 | COMPLETE | Live homepage, Olympiad pages, FAQ, and school registration contain “30 November 2026” / “30 Nov” and do not contain “20 Nov”. | None for the deadline. | Low | None | None | Live pages keep 30 November 2026. |
| W-02 | Result sentence on the three Olympiad pages | COMPLETE | Live `/olympiads/english`, `/olympiads/mathematics`, and `/olympiads/technology` contain “Results to be declared on 12 January 2027”. | None on those three pages. | Low | None | None | Those pages keep the exact sentence. |
| W-03 | Result sentence on the rest of the current site | IN PROGRESS | Live homepage has “Results are declared” 4 times. School registration has it 6 times. Source on this branch replaces those with the exact sentence. Not deployed. | Merge and deploy only after owner authorization. | Low | Production deploy | Approve deploy of the wording PR | Live pages no longer say “Results are declared”. |
| W-04 | Current eligibility Classes 3–10 and 6–10 | IN PROGRESS | Olympiad pages already say 3–10 and 6–10. Homepage, About, FAQ, and the Olympiad index still say III–X and VI–X on Production. This branch updates the current-programme text. 2025 level names are kept. | Deploy after authorization. | Low | Production deploy | Approve deploy | Current pages use 3–10 and 6–10. Historical 2025 levels stay. |
| W-05 | Historical “1st DHE English Olympiad” | COMPLETE | Kept on Hall of Fame, English history, FAQ, and the 2025 participation question. | None. | Low | None | None | Historical records are not rewritten. |
| W-06 | Syllabus removed from the three Olympiad pages | COMPLETE | Source has empty syllabus arrays and no syllabus section. Live English, Mathematics, and Future Tech pages use the result sentence. | None. | Low | None | None | No syllabus section returns. |
| W-07 | Multi-stream registration and ₹150 fee | COMPLETE | Tests on this branch: 60 passed, including one, two, and three streams, duplicate same-stream rejection, and ₹150 / ₹30 / ₹120. | None in code. A Production submission was not made. | Medium | None for code. A live submission would need separate authorization. | None | Tests stay green. No Production test registration. |
| W-08 | PAN holder distinction | COMPLETE | PR #46 merged as `47833c2`. Owner verified `pan_holder` on Production and 15 existing registrations unchanged. This session did not reapply the migration or re-query the database. | This branch only shortens the display label to “Authorised Staff PAN” and “PAN holder not recorded”. | Low | Deploy for the label wording | Approve that label change | Staff view and CSV use the three labels and do not call a null holder a School PAN. |
| W-09 | Learn and staff branding | COMPLETE | `/learn/dashboard` and `/learn/staff` source say TEJAS Olympiad. Production titles were checked in the prior deploy. | None. | Low | None | None | Those pages do not say “DHE English Olympiad”. |
| W-10 | Signed-in staff review on Production | NOT TESTED | The review screen requires a staff session. No Production session was opened and no record was changed. | Owner can sign in and read one existing row. | Medium | Staff session | Provide a staff session outside chat if a live check is required | One existing row shows the correct holder label without a data change. |
| D-01 | Database backup inventory | COMPLETE | Read-only `rclone v1.76.0` listing on 19 November 2026. No download. The same listing is recorded as runbook section AP on `docs/dr-windows-verification-20261118`. | None for the filename and size inventory. | Low | None | None | The same names and sizes remain. |
| D-02 | Database archive checksum | NOT TESTED | This pass did not download or hash the archives. A prior local check of `tejas-zapccpipwxduzlnvjdmy-20261117T184209Z.dump.enc` recorded 479,856 bytes and SHA-256 `1dd023171475ebf2386918ad7be4ba9634b02dc4145f1e643b820ece148d0cd5`. Today’s listing matches that size. | Re-hash only if a fresh download is authorized. | Low | Download of one encrypted file | Authorize a fresh checksum if the prior one is not enough | A new hash matches the recorded value. |
| D-03 | Database decryption | BLOCKED | The custody file can be opened with age. The bytes after the database passphrase label are not a working OpenSSL passphrase. No passphrase was guessed in this pass. | Owner supplies the working passphrase through a local secret prompt, not chat. | High | Decryption authorization plus the passphrase | Supply the passphrase outside chat, or accept that decryption stays blocked | `openssl` decrypts the archive without printing the passphrase. |
| D-04 | Isolated database restore | NOT TESTED | `psql` 17.12 client is installed. `pg_restore` is not installed. No server was installed. Decryption is blocked, so restore cannot start. | Install a client `pg_restore` only after decryption succeeds, then restore only into an empty non-Production database. | High | Isolated restore authorization | Name the empty database before any restore | Restore criteria in the runbook pass on that database only. |
| D-05 | Storage archive inventory | COMPLETE | Read-only listing: `tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age`, 555,336 bytes, 2026-11-16. | None for the name and size. | Low | None | None | The object remains that size. |
| D-06 | Storage decryption and extraction | BLOCKED | Identity files are present: `tejas-storage-backup.identity.gpg` and `tejas-storage-backup.identity.owner.gpg`. The working identity passphrase is not available. `age` v1.3.2 is installed. Nothing was downloaded or decrypted. | Owner supplies the identity passphrase outside chat. | High | Decryption and isolated extraction | Supply the passphrase, or leave extraction blocked | Isolated extraction matches the manifest. No Production Storage write. |
| D-07 | Full disaster recovery | BLOCKED | D-03, D-04, and D-06 are not complete. | Do not report recovery complete. | High | Separate authorization for each gated step | See the decision list | Real database restore and real Storage extraction both pass. |
| P-01 | PR #43 Windows DR note | IN PROGRESS | Open. validate SUCCESS, guard SUCCESS, Vercel preview SUCCESS. backup SKIPPED. Supabase Preview SKIPPED. | Owner merge decision. This pass did not modify the branch. | Low | Merge | Merge the documentation PR or leave it open | The Windows blocker section is on `main`, or the owner leaves the PR open. |
| P-02 | PR #25 registration and payment expansion | AUTHORIZATION REQUIRED | Open. Not inspected as a deploy candidate. | Do not merge or apply its SQL in this pass. | High | Owner review | Merge, close, or revise | A reviewed decision exists. |
| P-03 | PR #22, #21, and #17 documentation | OWNER DECISION REQUIRED | All three are still open. | Do not merge them as part of the wording fix. | Low | Merge | Close or merge each one | Each PR is merged or closed on purpose. |
| R-01 | Production registration persistence | COMPLETE | School registration writes to Supabase when configured, and the file store is the local fallback. Production uses the database. The PAN migration was already applied. | No new migration. | Medium | None | None | New registrations continue to store `pan_holder` without rewriting old PAN values. |

## Database backup listing

Read-only listing of `tejasdrive:DATABASE_BACKUPS` on 19 November 2026. No file was downloaded.

| Bytes | Time | Name |
| --- | --- | --- |
| 476,816 | 2026-11-15 06:16:47 | `tejas-zapccpipwxduzlnvjdmy-20261115T004413Z.dump.enc` |
| 479,856 | 2026-11-17 23:30:43 | `tejas-zapccpipwxduzlnvjdmy-20261117T175954Z.dump.enc` |
| 856 | 2026-11-17 23:30:43 | `tejas-zapccpipwxduzlnvjdmy-20261117T175954Z.manifest.txt` |
| 479,856 | 2026-11-18 00:12:57 | `tejas-zapccpipwxduzlnvjdmy-20261117T184209Z.dump.enc` |
| 1,645 | 2026-11-18 00:12:57 | `tejas-zapccpipwxduzlnvjdmy-20261117T184209Z.manifest.txt` |

Storage backup: `tejas-storage-zapccpipwxduzlnvjdmy-20261116.tar.age`, 555,336 bytes. Age-key recovery contains two `.gpg` identity files. Passphrase custody contains one `.age` file and one manifest. Contents were not opened.

## Tools present

| Tool | Result |
| --- | --- |
| `rclone` | v1.76.0, read-only listing succeeded |
| `psql` | PostgreSQL 17.12 client only. No database server was installed. |
| `pg_restore` | Not installed |
| `age` | v1.3.2 |
| Python | 3.12.10. Catalog verification passed inside `npm test`. |

## Tests on this branch

| Command | Exit | Result |
| --- | --- | --- |
| `npm test` | 0 | 60 passed, 0 failed. Includes catalog extraction, multi-stream fees, duplicate handling, and PAN holder labels. |
| `npx tsc --noEmit` | 0 | No errors |
| `npm run lint` | 0 | Existing `<img>` warnings in `app/opengraph-image.tsx` and `components/brand/TejasEmblem.tsx` |
| `npm run build` | 0 | Next.js 15.5.20, 48 pages |

## Owner decisions

1. Deploy the wording branch to Production. Until then, the live homepage and school page still say “Results are declared” and “Classes III–X”.
2. Supply the database backup passphrase outside chat if decryption should proceed. Do not paste it into chat.
3. Supply the Storage identity passphrase outside chat if extraction should proceed.
4. Decide whether to merge or leave open PRs #43, #25, #22, #21, and #17. None of them is merged by this register.
