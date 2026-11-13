-- NOT APPLIED. Do not run this file against production.
-- It creates empty tables for the student e-book portal. It does not insert books,
-- questions, students, payments or publication rows, and it does not alter Olympiad tables.

begin;

create table if not exists tejas_learn_students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  parent_name text not null,
  mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  email text not null unique,
  school_name text not null,
  password_hash text not null,
  stream_id text not null check (stream_id in ('english', 'mathematics', 'technology')),
  class_level integer not null check (class_level between 3 and 10),
  created_at timestamptz not null default now(),
  check (
    (stream_id in ('english', 'mathematics') and class_level between 3 and 10)
    or (stream_id = 'technology' and class_level between 6 and 10)
  )
);

create table if not exists tejas_learn_audit (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references tejas_learn_students(id),
  actor text not null,
  action_name text not null,
  reason text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create table if not exists tejas_learn_books (
  id text primary key,
  stream_id text not null check (stream_id in ('english', 'mathematics', 'technology')),
  title text not null,
  source_filename text not null,
  publication_status text not null check (publication_status in ('awaiting_approval', 'published')),
  fee_inr integer not null check (fee_inr >= 0),
  mock_test_fee_inr integer not null default 0 check (mock_test_fee_inr = 0)
);

create table if not exists tejas_learn_book_classes (
  book_id text not null references tejas_learn_books(id),
  class_level integer not null check (class_level between 3 and 10),
  primary key (book_id, class_level)
);

create table if not exists tejas_learn_tests (
  id text primary key,
  book_id text not null references tejas_learn_books(id),
  test_number integer not null check (test_number > 0),
  paper_code text not null unique,
  question_count integer not null check (question_count > 0),
  publication_status text not null check (publication_status in ('awaiting_approval', 'published')),
  unique (book_id, test_number)
);

create table if not exists tejas_learn_questions (
  id text primary key,
  test_id text not null references tejas_learn_tests(id),
  question_number integer not null check (question_number > 0),
  prompt text not null,
  correct_option text check (correct_option in ('A', 'B', 'C', 'D')),
  explanation text,
  unique (test_id, question_number)
);

create table if not exists tejas_learn_options (
  question_id text not null references tejas_learn_questions(id),
  option_key text not null check (option_key in ('A', 'B', 'C', 'D')),
  option_text text not null,
  primary key (question_id, option_key)
);

create table if not exists tejas_learn_entitlements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references tejas_learn_students(id),
  book_id text not null references tejas_learn_books(id),
  amount_inr integer not null check (amount_inr >= 0),
  included_mock_tests integer not null check (included_mock_tests >= 0),
  mock_test_amount_inr integer not null default 0 check (mock_test_amount_inr = 0),
  status text not null check (status in ('unpaid', 'reported', 'verified', 'rejected', 'superseded'))
);

create table if not exists tejas_learn_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references tejas_learn_students(id),
  test_id text not null references tejas_learn_tests(id),
  status text not null check (status in ('open', 'submitted', 'expired')),
  score integer,
  max_score integer not null,
  answers jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);

alter table tejas_learn_students enable row level security;
alter table tejas_learn_audit enable row level security;
alter table tejas_learn_books enable row level security;
alter table tejas_learn_book_classes enable row level security;
alter table tejas_learn_tests enable row level security;
alter table tejas_learn_questions enable row level security;
alter table tejas_learn_options enable row level security;
alter table tejas_learn_entitlements enable row level security;
alter table tejas_learn_attempts enable row level security;

commit;
