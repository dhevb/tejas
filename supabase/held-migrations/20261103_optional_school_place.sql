-- Applied to the live project on 3 November 2026.
-- Makes the place and affiliation-board columns optional so new registrations
-- can omit them. Existing rows are not updated or deleted.
-- A PIN, when present, must still be a 6-digit code.

alter table public.tejas_schools alter column state_name drop not null;
alter table public.tejas_schools alter column district drop not null;
alter table public.tejas_schools alter column city drop not null;
alter table public.tejas_schools alter column pin_code drop not null;
alter table public.tejas_schools alter column affiliation_board drop not null;

alter table public.tejas_schools drop constraint if exists tejas_schools_pin_code_check;
alter table public.tejas_schools
  add constraint tejas_schools_pin_code_check
  check (pin_code is null or pin_code ~ '^[1-9][0-9]{5}$');
