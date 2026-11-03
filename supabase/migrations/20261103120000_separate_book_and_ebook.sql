-- NOT APPLIED to production. Proposed only.
-- Do not run this file against the live Supabase project without organisational approval.
-- Supabase Free Plan: no preview branches, no Automatic Branching, no paid add-ons.
-- Additive tables only. This file does not alter tejas_registrations, tejas_payments,
-- tejas_book_orders, tejas_ebook_access, or any existing row.
-- The application does not write these tables until this migration is approved.
-- tejas_book_orders and tejas_ebook_access stay one row per Olympiad registration.

begin;

create table if not exists tejas_printed_book_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  school_name text not null,
  school_address text not null,
  school_email text not null,
  school_mobile text not null,
  coordinator_name text not null,
  coordinator_designation text not null,
  coordinator_mobile text not null,
  coordinator_email text not null,
  quantity integer not null check (quantity > 0),
  gross_amount integer not null check (gross_amount = quantity * 170),
  school_share integer not null check (school_share = quantity * 34),
  amount_payable integer not null check (amount_payable = quantity * 136),
  status text not null default 'recorded' check (status = 'recorded'),
  payment_collected boolean not null default false,
  dispatched boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists tejas_printed_book_lines (
  order_id uuid not null references tejas_printed_book_orders(id),
  class_number integer not null check (class_number between 3 and 10),
  stream_name text not null check (stream_name in ('english', 'mathematics', 'technology')),
  quantity integer not null check (quantity > 0),
  primary key (order_id, class_number, stream_name),
  check (stream_name <> 'technology' or class_number >= 6)
);

create table if not exists tejas_ebook_accounts (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  student_name text not null,
  parent_name text not null,
  school_name text not null,
  class_number integer not null check (class_number between 3 and 10),
  email text not null unique,
  mobile text not null,
  fee_amount integer not null check (fee_amount = 49),
  status text not null check (status in ('pending_payment', 'active')),
  password_hash text,
  password_salt text,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists tejas_ebook_entitlements (
  account_id uuid not null references tejas_ebook_accounts(id),
  stream_name text not null check (stream_name in ('english', 'mathematics', 'technology')),
  primary key (account_id, stream_name)
);

alter table tejas_printed_book_orders enable row level security;
alter table tejas_printed_book_lines enable row level security;
alter table tejas_ebook_accounts enable row level security;
alter table tejas_ebook_entitlements enable row level security;

commit;
