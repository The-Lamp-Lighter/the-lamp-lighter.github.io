-- ============================================================
-- LUNARIUM'S LAB — patch: mídia no chat + apagar histórico
-- Rode isso uma vez no SQL Editor. Depois, crie o bucket
-- "chat-media" em Storage (marcado como Public) e rode a
-- segunda parte (políticas de storage) logo abaixo.
-- ============================================================

alter table chat_messages alter column content drop not null;
alter table chat_messages add column if not exists media_url text;
alter table chat_messages add column if not exists media_type text check (media_type in ('image', 'video'));

-- permite que qualquer um dos dois participantes apague a conversa
-- (isso apaga a mensagem pros dois lados, já que é a mesma linha)
drop policy if exists "chat_messages_participants_delete" on chat_messages;
create policy "chat_messages_participants_delete" on chat_messages
  for delete using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- ------------------------------------------------------------
-- Rode isso DEPOIS de criar o bucket "chat-media" (Public):
-- ------------------------------------------------------------

drop policy if exists "chatmedia_insert_own" on storage.objects;
create policy "chatmedia_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "chatmedia_public_read" on storage.objects;
create policy "chatmedia_public_read" on storage.objects
  for select using (bucket_id = 'chat-media');
