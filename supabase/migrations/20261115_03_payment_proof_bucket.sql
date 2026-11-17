-- NOT APPLIED by this pull request.
-- Adds WebP to the private payment-proof bucket and keeps JPEG, PNG, and PDF.
-- The existing confirmed test proof is a PDF. Removing PDF from the allow list
-- is not part of this package. Existing objects are not deleted or replaced.

begin;

do $bucket$
begin
  if to_regclass('storage.buckets') is null then
    raise exception 'storage.buckets is absent. The proof bucket was not changed, and this migration does not invent a bucket.';
  end if;
  if not exists (select 1 from storage.buckets where id = 'tejas-payment-proofs') then
    raise exception 'tejas-payment-proofs bucket was not found. No bucket was created.';
  end if;
  update storage.buckets
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  where id = 'tejas-payment-proofs'
    and public = false;
  if not found then
    raise exception 'tejas-payment-proofs is not private. Refusing to change a public bucket.';
  end if;
end
$bucket$;

commit;
