# TEJAS Backend Architecture (Phase 3+ Planning)

> Planning document only — no backend implementation in Phase 2.5.
> Defines entity relationships, API contracts, and lifecycles for smooth Phase 3–5 delivery.

## Core Entities

```
Organization (DHE)
 └── OlympiadCell
      ├── Edition (e.g. tejas-2026-27)
      │    ├── OlympiadStream (english | mathematics | technology)
      │    ├── ExamLevel (A–E)
      │    └── CalendarEvent
      ├── School
      │    ├── Coordinator (Teacher)
      │    └── StudentEnrollment[]
      ├── Student
      │    ├── Parent (optional link)
      │    └── Attempt[]
      ├── Exam
      │    ├── QuestionBank
      │    ├── MockTest
      │    └── Result
      ├── Certificate
      ├── Payment
      └── HallOfFameEntry
```

## Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Student** | Register, attempt mock/exam, view results & certificates |
| **Parent** | View child progress, download certificates |
| **Teacher** | Coordinate school registration, view class analytics |
| **School Admin** | Bulk enrollment, payment, invigilation reports |
| **Olympiad Admin** | Question banks, editions, results publication |
| **DHE Super Admin** | Full platform, editions, policies |

## API Contract Overview (REST)

### Auth
- `POST /api/v1/auth/register` — student/parent/teacher/school
- `POST /api/v1/auth/login` — JWT + refresh token
- `POST /api/v1/auth/logout`

### Registration Flow
1. School registers → `POST /api/v1/schools/register`
2. School uploads students → `POST /api/v1/enrollments/bulk`
3. Payment (Phase 4) → `POST /api/v1/payments/create-order`
4. Admit card generated → `GET /api/v1/enrollments/{id}/admit-card`

### Exam Lifecycle
```
draft → published → registration_open → registration_closed
  → exam_scheduled → exam_in_progress → exam_completed
  → evaluation → results_published → certificates_issued
```

### Key Endpoints (planned)
- `GET /api/v1/editions/current`
- `GET /api/v1/olympiads/{slug}`
- `GET /api/v1/mock-tests/{olympiadSlug}`
- `POST /api/v1/attempts/start`
- `POST /api/v1/attempts/{id}/submit`
- `GET /api/v1/results/{attemptId}`
- `GET /api/v1/certificates/verify/{code}`

## Content Models (aligns with `content/` layer)

Frontend content registry maps 1:1 to CMS/admin models:

- `OlympiadPortalContent` → Olympiad CMS document
- `EditionFullContent` → Edition CMS document
- `ResourceItem` → Resource CMS document
- `HallOfFameFullEntry` → HoF record (DB + CMS overlay)

Adding a new subject = add content file + optional DB seed — no page redesign.

## Certificate Lifecycle

1. Exam evaluated → rank computed
2. Certificate record created with unique `verificationCode` + QR payload
3. PDF generated (template from `CertificatePreview` component)
4. Published to student dashboard + email
5. Public verification at `/certificates/verify/{code}`

## Result Publication Flow

1. OMR/digital responses ingested
2. Auto-scoring (MCQ) + manual review flag
3. School-wise → State-wise → National rankings
4. Admin approval gate
5. Results published → Hall of Fame updated
6. Felicitation ceremony list exported

## Phase Mapping

| Phase | Backend Scope |
|-------|---------------|
| 3 | Auth, profiles, roles |
| 4 | Registration, payments, exam engine, mock tests |
| 5 | Results, certificates, rankings, Hall of Fame sync |
| 6 | AI mentor, analytics dashboards |
| 7 | Mobile apps, national scale |

## Technology Recommendations (for Phase 3 discussion)

- **Database:** PostgreSQL (relational enrollments, results)
- **Auth:** NextAuth.js or custom JWT with RBAC
- **Payments:** Razorpay (Bharat-focused)
- **Exam engine:** Timed sessions, question randomization, OMR import
- **Storage:** S3-compatible for PDFs, certificates
- **Cache:** Redis for rankings leaderboard

---

*Document version: Phase 2.5 — Launch Readiness*
