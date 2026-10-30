-- NOT APPLIED. No Supabase credentials are available in this environment, so the live schema
-- has not been compared and no backup has been taken. Do not run this file until both exist.
-- These statements create new tables only. They do not drop, truncate, or update existing rows.
-- If a table of the same name already exists, CREATE TABLE IF NOT EXISTS will leave it unchanged
-- and the later constraints in this file will not repair a different shape. Compare information_schema first.

begin;

create table if not exists tejas_schools (
  id uuid primary key default gen_random_uuid(),
  school_name text not null check (char_length(btrim(school_name)) >= 3),
  school_address text not null check (char_length(btrim(school_address)) >= 10),
  state_name text not null,
  district text not null,
  city text not null,
  pin_code text not null check (pin_code ~ '^[1-9][0-9]{5}$'),
  pan text not null check (pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
  pan_duplicate boolean not null default false,
  school_email text not null,
  school_mobile text not null check (school_mobile ~ '^[6-9][0-9]{9}$'),
  affiliation_board text not null,
  affiliation_number text,
  school_category text not null,
  created_at timestamptz not null default now()
);

create table if not exists tejas_principals (
  school_id uuid primary key references tejas_schools(id),
  full_name text not null,
  mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  email text not null,
  designation text not null
);

create table if not exists tejas_coordinators (
  school_id uuid primary key references tejas_schools(id),
  full_name text not null,
  mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  email text not null,
  designation text not null
);

create table if not exists tejas_registrations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references tejas_schools(id),
  reference text not null unique,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists tejas_students (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references tejas_registrations(id),
  full_name text not null,
  class_label text not null,
  section_name text not null,
  roll_number text not null,
  date_of_birth date not null,
  parent_name text not null,
  parent_mobile text not null,
  parent_email text not null
);

create table if not exists tejas_registration_streams (
  student_id uuid not null references tejas_students(id),
  stream_name text not null check (stream_name in ('TEJAS English', 'TEJAS Mathematics', 'TEJAS Future Tech')),
  primary key (student_id, stream_name)
);

create table if not exists tejas_payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references tejas_registrations(id),
  status text not null,
  mode text,
  paid_on date,
  payer_name text,
  transaction_reference text,
  amount_due integer not null check (amount_due >= 0),
  unique (transaction_reference)
);

create table if not exists tejas_payment_proofs (
  payment_id uuid primary key references tejas_payments(id),
  storage_path text not null,
  content_type text not null
);

create table if not exists tejas_book_orders (
  registration_id uuid primary key references tejas_registrations(id),
  quantity integer not null check (quantity >= 0),
  amount integer not null check (amount >= 0)
);

create table if not exists tejas_ebook_access (
  registration_id uuid primary key references tejas_registrations(id),
  student_count integer not null check (student_count >= 0),
  amount integer not null check (amount >= 0),
  activated boolean not null default false
);

create table if not exists tejas_admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role_name text not null check (role_name in ('reviewer', 'finance'))
);

create table if not exists tejas_audit_logs (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references tejas_registrations(id),
  actor text not null,
  action_name text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table tejas_schools enable row level security;
alter table tejas_principals enable row level security;
alter table tejas_coordinators enable row level security;
alter table tejas_registrations enable row level security;
alter table tejas_students enable row level security;
alter table tejas_registration_streams enable row level security;
alter table tejas_payments enable row level security;
alter table tejas_payment_proofs enable row level security;
alter table tejas_book_orders enable row level security;
alter table tejas_ebook_access enable row level security;
alter table tejas_admin_users enable row level security;
alter table tejas_audit_logs enable row level security;

commit;

-- Reverse, only if these empty tables are still unused:
-- begin;
-- drop table if exists tejas_audit_logs, tejas_admin_users, tejas_ebook_access, tejas_book_orders, tejas_payment_proofs, tejas_payments, tejas_registration_streams, tejas_students, tejas_registrations, tejas_coordinators, tejas_principals, tejas_schools;
-- commit;
