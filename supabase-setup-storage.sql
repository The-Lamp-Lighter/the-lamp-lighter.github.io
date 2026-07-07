-- ============================================================
-- LUNARIUM'S LAB — patch: políticas de Storage
-- Rode isso DEPOIS de já ter criado os buckets "avatars" e
-- "work-media" (Storage → New bucket, marcados como Public).
-- ============================================================

-- avatars: cada pessoa só pode enviar/atualizar dentro da própria
-- "pasta" (nomeada com o seu próprio user id) — assim ninguém
-- sobrescreve o avatar de outra pessoa.
drop policy if exists "avatar_insert_own" on storage.objects;
create policy "avatar_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar_update_own" on storage.objects;
create policy "avatar_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar_public_read" on storage.objects;
create policy "avatar_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- work-media: só admin envia/atualiza, todo mundo pode ver
drop policy if exists "workmedia_admin_write" on storage.objects;
create policy "workmedia_admin_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'work-media'
    and exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "workmedia_admin_update" on storage.objects;
create policy "workmedia_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'work-media'
    and exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "workmedia_admin_delete" on storage.objects;
create policy "workmedia_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'work-media'
    and exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "workmedia_public_read" on storage.objects;
create policy "workmedia_public_read" on storage.objects
  for select using (bucket_id = 'work-media');
