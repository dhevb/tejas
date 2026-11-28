-- TEJAS Phase 2.5 Option A — Preview only (nbeslngnrsagarosuaab)
-- Removes ONLY books.stream_id = students.stream_id from report/review payment RPCs.
-- Do NOT run on Production (zapccpipwxduzlnvjdmy).
-- Do NOT run until migrations 001+002 are verified on Preview.
-- Option B grouped payments: not included.
create or replace function public.tejas_learn_report_payment(
  p_student uuid,
  p_book text,
  p_reference text,
  p_amount integer
) returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  updated_id uuid;
  clean_reference text;
begin
  if p_amount is distinct from 49 then
    raise exception 'ebook fee must be 49';
  end if;
  clean_reference := pg_catalog.btrim(p_reference);
  if clean_reference is null or pg_catalog.char_length(clean_reference) < 6 or pg_catalog.char_length(clean_reference) > 80 then
    raise exception 'invalid payment reference';
  end if;
  begin
    update public.tejas_learn_entitlements
    set status = 'reported',
        transaction_reference = clean_reference,
        reported_at = pg_catalog.now(),
        note = 'Reported by the student. Content stays locked until staff verification.'
    where student_id = p_student
      and book_id = p_book
      and status <> 'superseded'
      and status <> 'verified'
      and amount_inr = 49
      and mock_test_amount_inr = 0
      and exists (
        select 1
        from public.tejas_learn_students as students
        join public.tejas_learn_books as books on books.id = p_book
        join public.tejas_learn_book_classes as classes
          on classes.book_id = books.id
         and classes.class_level = students.class_level
        where students.id = p_student
          and books.fee_inr = 49
          and books.mock_test_fee_inr = 0
      )
    returning id into updated_id;
    if updated_id is null then
      raise exception 'payment report was not accepted';
    end if;
  exception
    when unique_violation then
      raise exception 'duplicate payment reference';
  end;
  insert into public.tejas_learn_audit (actor, action_name, reason, student_id, after_state)
  values (
    'student', 'report-payment', 'Student reported a payment reference.', p_student,
    pg_catalog.jsonb_build_object('bookId', p_book, 'amountInr', 49)
  );
end;
$$;

revoke all on function public.tejas_learn_report_payment(uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.tejas_learn_report_payment(uuid, text, text, integer) to service_role;

create or replace function public.tejas_learn_review_payment(
  p_student uuid,
  p_book text,
  p_decision text,
  p_actor text,
  p_note text
) returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  updated_id uuid;
begin
  if p_decision not in ('verified', 'rejected') then
    raise exception 'invalid decision';
  end if;
  update public.tejas_learn_entitlements as entitlements
  set status = p_decision,
      note = p_note,
      verified_at = pg_catalog.now(),
      verified_by = p_actor
  where entitlements.student_id = p_student
    and entitlements.book_id = p_book
    and entitlements.status <> 'superseded'
    and entitlements.status <> 'unpaid'
    and entitlements.amount_inr = 49
    and entitlements.mock_test_amount_inr = 0
    and entitlements.transaction_reference is not null
    and exists (
      select 1
      from public.tejas_learn_students as students
      join public.tejas_learn_books as books on books.id = entitlements.book_id
      join public.tejas_learn_book_classes as classes
        on classes.book_id = books.id
       and classes.class_level = students.class_level
      where students.id = p_student
        and books.fee_inr = 49
        and books.mock_test_fee_inr = 0
    )
  returning entitlements.id into updated_id;
  if updated_id is null then
    raise exception 'no reported payment';
  end if;
  insert into public.tejas_learn_audit (actor, action_name, reason, student_id, after_state)
  values (
    p_actor, 'review-payment', p_note, p_student,
    pg_catalog.jsonb_build_object('bookId', p_book, 'decision', p_decision)
  );
end;
$$;

revoke all on function public.tejas_learn_review_payment(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.tejas_learn_review_payment(uuid, text, text, text, text) to service_role;
