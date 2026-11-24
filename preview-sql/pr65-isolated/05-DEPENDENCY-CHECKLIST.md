# PR #65 Preview dependency checklist

## Schema / RPC / Storage (Preview project)

| Item | Required | Source |
|------|----------|--------|
| Registration tables (`tejas_schools` … `tejas_audit_logs`) | Yes | `01-preview-registration-schema.sql` |
| `record_snapshot`, `tejas_idempotency`, `tejas_registration_files` | Yes | same |
| `tejas_staff_sessions` + `tejas_staff_bump_session` | Yes (login) | `02-preview-staff-sessions.sql` |
| `tejas_payment_utrs` + payment OCR columns | Yes (UTR/OCR fields) | `03-preview-utr-and-payment-columns.sql` |
| Buckets `tejas-registration-files`, `tejas-payment-proofs` (private) | Yes | `04-preview-storage-buckets.sql` |
| Full learning-portal tables | No for registration review QA | Skip |
| Google Drive | No — keep disabled | N/A |

## APIs (read / write)

| API | Read | Write |
|-----|------|-------|
| `POST /api/register/admin/session` | staff table (email path) | **bump session** |
| `DELETE /api/register/admin/session` | — | **bump session** |
| `GET /api/register/admin/registrations` | registrations snapshot | — |
| `GET .../registrations/[ref]` | one snapshot | — |
| `PATCH .../registrations/[ref]` | — | **payment + audit** |
| `GET .../file` | DB + Storage | — |
| `GET /api/register/admin/export` | list | — |
| `PUT /api/register/admin/payment` | — | local FS only (ephemeral on Vercel) |

## Vercel Preview env (presence only)

| Name | Preview | Must not be Production project |
|------|---------|--------------------------------|
| `TEJAS_ADMIN_TOKEN` | required | Preview-only value |
| `SUPABASE_URL` | required | Host ≠ `zapccpipwxduzlnvjdmy.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | required | Preview project JWT `ref` only |

## Forbidden

- Production credentials in Preview  
- Production migrations / SQL  
- Production backups as Preview data source  
- Real PII in synthetic seed  
- Merge PR #65 / Production deploy  
