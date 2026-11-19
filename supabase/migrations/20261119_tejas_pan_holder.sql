-- NOT APPLIED. Do not run this file against Production until it has been reviewed.
-- It adds one nullable column. It does not update, delete, or relabel existing rows.
-- A missing pan_holder means the holder was not recorded. It is not a school PAN.

alter table tejas_schools
  add column if not exists pan_holder text
  check (pan_holder is null or pan_holder in ('school', 'authorised-staff'));
