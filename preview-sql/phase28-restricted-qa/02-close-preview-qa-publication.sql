-- PREVIEW ONLY — close temporary restricted content-QA publication
-- Restores awaiting_approval. NEVER run on Production.
begin;

update public.tejas_learn_books set publication_status = 'awaiting_approval' where publication_status = 'published';
update public.tejas_learn_tests set publication_status = 'awaiting_approval' where publication_status = 'published';
update public.tejas_learn_publication set publication_status = 'awaiting_approval' where publication_status = 'published' and kind in ('book','test');

insert into public.tejas_learn_audit (actor, action_name, reason, after_state)
values ('owner-preview-qa', 'set-publication', 'Closed TEMP Preview restricted content-QA publication after testing.',
  pg_catalog.jsonb_build_object('scope', 'preview-qa-closed', 'status', 'awaiting_approval', 'project', 'nbeslngnrsagarosuaab'));

commit;
