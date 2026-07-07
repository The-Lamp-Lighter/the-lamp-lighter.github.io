-- ============================================================
-- LUNARIUM'S LAB — setup do Supabase
-- Rode esse arquivo inteiro de uma vez no SQL Editor do Supabase.
-- Seguro rodar mais de uma vez (usa "if not exists" onde dá).
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- PERFIS (estende auth.users)
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text default '',
  chat_code text unique not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_select_all" on profiles;
create policy "profiles_select_all" on profiles
  for select using (true);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select p.is_admin from profiles p where p.id = auth.uid())
  );

-- gera um código curto tipo LUNA-7F2K-9X
create or replace function generate_chat_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := 'LUNA-';
  i int;
begin
  for i in 1..4 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  code := code || '-';
  for i in 1..2 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return code;
end;
$$;

-- cria o perfil automaticamente quando alguém se cadastra
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username, chat_code)
  values (
    new.id,
    split_part(new.email, '@', 1),
    generate_chat_code()
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ------------------------------------------------------------
-- TRABALHOS (portfólio) — só admin escreve, todo mundo lê os publicados
-- ------------------------------------------------------------
create table if not exists works (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete set null,
  title text not null,
  description text default '',
  software text[] default '{}',
  sketchfab_embed_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table works enable row level security;

drop policy if exists "works_select_published_or_admin" on works;
create policy "works_select_published_or_admin" on works
  for select using (
    published = true
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "works_write_admin_only" on works;
create policy "works_write_admin_only" on works
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  ) with check (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- mídia (imagens/vídeos) de cada trabalho
create table if not exists work_media (
  id uuid primary key default gen_random_uuid(),
  work_id uuid references works(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  url text not null,
  position int not null default 0
);

alter table work_media enable row level security;

drop policy if exists "work_media_select_all" on work_media;
create policy "work_media_select_all" on work_media
  for select using (true);

drop policy if exists "work_media_write_admin_only" on work_media;
create policy "work_media_write_admin_only" on work_media
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  ) with check (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- ------------------------------------------------------------
-- CHAT — contatos e mensagens
-- ------------------------------------------------------------
create table if not exists chat_contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  contact_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (owner_id, contact_id)
);

alter table chat_contacts enable row level security;

drop policy if exists "chat_contacts_own" on chat_contacts;
create policy "chat_contacts_own" on chat_contacts
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false
);

alter table chat_messages enable row level security;

drop policy if exists "chat_messages_participants_select" on chat_messages;
create policy "chat_messages_participants_select" on chat_messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "chat_messages_sender_insert" on chat_messages;
create policy "chat_messages_sender_insert" on chat_messages
  for insert with check (auth.uid() = sender_id);

drop policy if exists "chat_messages_receiver_update" on chat_messages;
create policy "chat_messages_receiver_update" on chat_messages
  for update using (auth.uid() = receiver_id) with check (auth.uid() = receiver_id);

-- habilita realtime nas mensagens (pra chegar na hora, sem precisar recarregar)
alter publication supabase_realtime add table chat_messages;

-- ------------------------------------------------------------
-- Depois de criar sua conta pelo site, rode esta linha (uma vez)
-- trocando 'seu-usuario' pelo username que você escolheu no cadastro,
-- pra virar admin e poder postar em Meus Trabalhos:
--
-- update profiles set is_admin = true where username = 'seu-usuario';
-- ------------------------------------------------------------
