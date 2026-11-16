-- Story H3.3.1: Storage bucket for screen images (PNG or JPG, up to 4 MB).
-- Demo policy (PRD decision 4): anyone can read and upload; nobody can replace or delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('screens', 'screens', true, 4194304, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy "screens_storage_insert_open" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'screens');

create policy "screens_storage_select_open" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'screens');
