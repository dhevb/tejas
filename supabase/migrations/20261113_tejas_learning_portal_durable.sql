-- NOT APPLIED TO PRODUCTION.
-- Additive portal tables, columns, indexes and functions.
-- It does not drop, truncate or update Olympiad registration rows.
-- Apply only after a verified backup and an explicit owner approval.

begin;

alter table tejas_learn_students add column if not exists password_salt text;
alter table tejas_learn_students add column if not exists session_version integer not null default 1;

alter table tejas_learn_entitlements add column if not exists transaction_reference text;
alter table tejas_learn_entitlements add column if not exists reported_at timestamptz;
alter table tejas_learn_entitlements add column if not exists verified_at timestamptz;
alter table tejas_learn_entitlements add column if not exists verified_by text;
alter table tejas_learn_entitlements add column if not exists note text;

alter table tejas_learn_attempts add column if not exists book_id text;
alter table tejas_learn_attempts add column if not exists expires_at timestamptz;

create table if not exists tejas_learn_publication (
  kind text not null check (kind in ('book', 'test')),
  item_id text not null,
  publication_status text not null check (publication_status in ('awaiting_approval', 'published')),
  primary key (kind, item_id)
);

create table if not exists tejas_learn_staff (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  password_salt text not null,
  role_name text not null check (role_name in ('reviewer')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists tejas_staff_sessions (
  subject text primary key,
  session_version integer not null default 1 check (session_version > 0),
  updated_at timestamptz not null default now()
);

create index if not exists tejas_learn_entitlements_student_idx on tejas_learn_entitlements (student_id);
create index if not exists tejas_learn_attempts_student_idx on tejas_learn_attempts (student_id);
create index if not exists tejas_learn_audit_student_idx on tejas_learn_audit (student_id);
create unique index if not exists tejas_learn_entitlements_one_active
  on tejas_learn_entitlements (student_id, book_id)
  where status <> 'superseded';
create unique index if not exists tejas_learn_attempts_one_open
  on tejas_learn_attempts (student_id, test_id)
  where status = 'open';

create or replace function tejas_staff_bump_session(p_subject text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
begin
  if p_subject is null or p_subject !~ '^[A-Za-z0-9-]{1,80}$' then
    raise exception 'invalid staff subject';
  end if;
  insert into tejas_staff_sessions as sessions (subject, session_version)
  values (p_subject, 1)
  on conflict (subject) do update
  set session_version = sessions.session_version + 1,
      updated_at = now()
  returning session_version into next_version;
  return next_version;
end;
$$;

create or replace function tejas_learn_rotate_session(p_student uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
begin
  update tejas_learn_students
  set session_version = session_version + 1
  where id = p_student
  returning session_version into next_version;
  if next_version is null then
    raise exception 'student not found';
  end if;
  return next_version;
end;
$$;

create or replace function tejas_learn_register_student(
  p_full_name text,
  p_parent_name text,
  p_mobile text,
  p_email text,
  p_school_name text,
  p_password_hash text,
  p_password_salt text,
  p_stream_id text,
  p_class_level integer,
  p_book_id text,
  p_amount integer,
  p_included integer
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into tejas_learn_students (
    full_name, parent_name, mobile, email, school_name, password_hash, password_salt, stream_id, class_level, session_version
  ) values (
    p_full_name, p_parent_name, p_mobile, p_email, p_school_name, p_password_hash, p_password_salt, p_stream_id, p_class_level, 1
  ) returning id into new_id;
  if p_book_id is not null then
    insert into tejas_learn_entitlements (
      student_id, book_id, amount_inr, included_mock_tests, mock_test_amount_inr, status
    ) values (
      new_id, p_book_id, p_amount, p_included, 0, 'unpaid'
    );
  end if;
  insert into tejas_learn_audit (actor, action_name, reason, student_id, before_state, after_state)
  values ('student', 'register', 'Student registered. Stream and class were stored from the form and locked.', new_id, null, jsonb_build_object('streamId', p_stream_id, 'classLevel', p_class_level));
  return new_id;
end;
$$;

create or replace function tejas_learn_correct_registration(
  p_student uuid,
  p_stream text,
  p_class integer,
  p_book text,
  p_amount integer,
  p_included integer,
  p_actor text,
  p_reason text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_stream text;
  old_class integer;
begin
  select stream_id, class_level into old_stream, old_class
  from tejas_learn_students
  where id = p_student
  for update;
  if old_stream is null then
    raise exception 'student not found';
  end if;
  update tejas_learn_students
  set stream_id = p_stream, class_level = p_class
  where id = p_student;
  update tejas_learn_entitlements
  set status = 'superseded',
      note = 'Superseded because staff corrected the stream or class.'
  where student_id = p_student and status <> 'superseded';
  if p_book is not null then
    insert into tejas_learn_entitlements (
      student_id, book_id, amount_inr, included_mock_tests, mock_test_amount_inr, status, note
    ) values (
      p_student, p_book, p_amount, p_included, 0, 'unpaid',
      'Created after a staff correction. Earlier payment does not transfer.'
    );
  end if;
  insert into tejas_learn_audit (actor, action_name, reason, student_id, before_state, after_state)
  values (
    p_actor, 'correct-registration', p_reason, p_student,
    jsonb_build_object('streamId', old_stream, 'classLevel', old_class),
    jsonb_build_object('streamId', p_stream, 'classLevel', p_class)
  );
end;
$$;

create or replace function tejas_learn_report_payment(
  p_student uuid,
  p_book text,
  p_reference text,
  p_amount integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id uuid;
begin
  update tejas_learn_entitlements
  set status = 'reported',
      transaction_reference = p_reference,
      reported_at = now(),
      note = 'Reported by the student. Content stays locked until staff verification.'
  where student_id = p_student
    and book_id = p_book
    and status <> 'superseded'
    and status <> 'verified'
    and amount_inr = p_amount
    and mock_test_amount_inr = 0
  returning id into updated_id;
  if updated_id is null then
    raise exception 'payment report was not accepted';
  end if;
  insert into tejas_learn_audit (actor, action_name, reason, student_id, after_state)
  values ('student', 'report-payment', 'Student reported a payment reference.', p_student, jsonb_build_object('bookId', p_book, 'amountInr', p_amount));
end;
$$;

create or replace function tejas_learn_review_payment(
  p_student uuid,
  p_book text,
  p_decision text,
  p_actor text,
  p_note text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id uuid;
begin
  if p_decision not in ('verified', 'rejected') then
    raise exception 'invalid decision';
  end if;
  update tejas_learn_entitlements
  set status = p_decision,
      note = p_note,
      verified_at = now(),
      verified_by = p_actor
  where student_id = p_student
    and book_id = p_book
    and status <> 'superseded'
    and status <> 'unpaid'
  returning id into updated_id;
  if updated_id is null then
    raise exception 'no reported payment';
  end if;
  insert into tejas_learn_audit (actor, action_name, reason, student_id, after_state)
  values (p_actor, 'review-payment', p_note, p_student, jsonb_build_object('bookId', p_book, 'decision', p_decision));
end;
$$;

create or replace function tejas_learn_set_publication(
  p_kind text,
  p_item text,
  p_status text,
  p_actor text,
  p_reason text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous text;
begin
  select publication_status into previous
  from tejas_learn_publication
  where kind = p_kind and item_id = p_item;
  insert into tejas_learn_publication (kind, item_id, publication_status)
  values (p_kind, p_item, p_status)
  on conflict (kind, item_id) do update set publication_status = excluded.publication_status;
  insert into tejas_learn_audit (actor, action_name, reason, before_state, after_state)
  values (
    p_actor, 'set-publication', p_reason,
    jsonb_build_object('kind', p_kind, 'id', p_item, 'status', coalesce(previous, 'awaiting_approval')),
    jsonb_build_object('status', p_status)
  );
end;
$$;

insert into tejas_learn_books (id, stream_id, title, source_filename, publication_status, fee_inr, mock_test_fee_inr)
values
  ('ft-book-1', 'technology', 'Understanding IoT and IoT with Arduino', 'VB_IOT_GUIDE_V06_Book-1-compressed (1).pdf', 'awaiting_approval', 49, 0),
  ('ft-book-2', 'technology', 'IoT with ESP32 and IoT with Raspberry Pi', 'VB_IOT_GUIDE_V06_Book-2.pdf', 'awaiting_approval', 49, 0)
on conflict (id) do nothing;

insert into tejas_learn_book_classes (book_id, class_level)
values
  ('ft-book-1', 6), ('ft-book-1', 7), ('ft-book-1', 8),
  ('ft-book-2', 9), ('ft-book-2', 10)
on conflict do nothing;

insert into tejas_learn_tests (id, book_id, test_number, paper_code, question_count, publication_status)
values
  ('ft-b1-mt01', 'ft-book-1', 1, 'TEJAS-FT-B1-MT01', 25, 'awaiting_approval'),
  ('ft-b1-mt02', 'ft-book-1', 2, 'TEJAS-FT-B1-MT02', 25, 'awaiting_approval'),
  ('ft-b1-mt03', 'ft-book-1', 3, 'TEJAS-FT-B1-MT03', 25, 'awaiting_approval'),
  ('ft-b1-mt04', 'ft-book-1', 4, 'TEJAS-FT-B1-MT04', 25, 'awaiting_approval'),
  ('ft-b1-mt05', 'ft-book-1', 5, 'TEJAS-FT-B1-MT05', 25, 'awaiting_approval'),
  ('ft-b2-mt01', 'ft-book-2', 1, 'TEJAS-FT-B2-MT01', 25, 'awaiting_approval'),
  ('ft-b2-mt02', 'ft-book-2', 2, 'TEJAS-FT-B2-MT02', 25, 'awaiting_approval'),
  ('ft-b2-mt03', 'ft-book-2', 3, 'TEJAS-FT-B2-MT03', 25, 'awaiting_approval'),
  ('ft-b2-mt04', 'ft-book-2', 4, 'TEJAS-FT-B2-MT04', 25, 'awaiting_approval'),
  ('ft-b2-mt05', 'ft-book-2', 5, 'TEJAS-FT-B2-MT05', 25, 'awaiting_approval')
on conflict (id) do nothing;

alter table tejas_learn_publication enable row level security;
alter table tejas_learn_staff enable row level security;
alter table tejas_staff_sessions enable row level security;

revoke all on function tejas_staff_bump_session(text) from public;
revoke all on function tejas_learn_rotate_session(uuid) from public;
revoke all on function tejas_learn_register_student(text, text, text, text, text, text, text, text, integer, text, integer, integer) from public;
revoke all on function tejas_learn_correct_registration(uuid, text, integer, text, integer, integer, text, text) from public;
revoke all on function tejas_learn_report_payment(uuid, text, text, integer) from public;
revoke all on function tejas_learn_review_payment(uuid, text, text, text, text) from public;
revoke all on function tejas_learn_set_publication(text, text, text, text, text) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function tejas_staff_bump_session(text) to service_role;
    grant execute on function tejas_learn_rotate_session(uuid) to service_role;
    grant execute on function tejas_learn_register_student(text, text, text, text, text, text, text, text, integer, text, integer, integer) to service_role;
    grant execute on function tejas_learn_correct_registration(uuid, text, integer, text, integer, integer, text, text) to service_role;
    grant execute on function tejas_learn_report_payment(uuid, text, text, integer) to service_role;
    grant execute on function tejas_learn_review_payment(uuid, text, text, text, text) to service_role;
    grant execute on function tejas_learn_set_publication(text, text, text, text, text) to service_role;
  end if;
end $$;

commit;
