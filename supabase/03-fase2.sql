insert into storage.buckets (id, name, public, file_size_limit)
  values ('documenti', 'documenti', false, 52428800)
  on conflict (id) do nothing;

drop policy if exists p_doc_leggi on storage.objects;
create policy p_doc_leggi on storage.objects for select to authenticated
  using (bucket_id = 'documenti' and public.puo_vedere(split_part(name, '/', 1)));
drop policy if exists p_doc_scrivi on storage.objects;
create policy p_doc_scrivi on storage.objects for insert to authenticated
  with check (bucket_id = 'documenti' and public.puo_modificare(split_part(name, '/', 1)));
drop policy if exists p_doc_cancella on storage.objects;
create policy p_doc_cancella on storage.objects for delete to authenticated
  using (bucket_id = 'documenti' and (owner = auth.uid() or public.is_admin()));
