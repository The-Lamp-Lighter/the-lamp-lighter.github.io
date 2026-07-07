-- ============================================================
-- LUNARIUM'S LAB — patch: sistema de Jogos (Estelar + placares)
-- Rode isso uma vez no SQL Editor.
-- ============================================================

alter table profiles add column if not exists stardust integer not null default 0;

-- trava o update direto: só a função abaixo (que roda com privilégio
-- elevado) pode alterar o estelar — assim ninguém aumenta o próprio
-- saldo chamando a API direto.
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select p.is_admin from profiles p where p.id = auth.uid())
    and stardust = (select p.stardust from profiles p where p.id = auth.uid())
  );

create table if not exists game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  game_id text not null,
  score integer not null,
  created_at timestamptz not null default now()
);

alter table game_scores enable row level security;

drop policy if exists "game_scores_select_all" on game_scores;
create policy "game_scores_select_all" on game_scores
  for select using (true);

-- sem política de insert/update pro cliente: só a função abaixo grava.

create or replace function public.submit_game_score(p_game_id text, p_score int, p_stardust int)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  new_total integer;
begin
  if me is null then raise exception 'não autenticado'; end if;
  if p_score < 0 or p_score > 1000000 then raise exception 'pontuação inválida'; end if;
  if p_stardust < 0 or p_stardust > 100000 then raise exception 'estelar inválido'; end if;

  insert into game_scores (user_id, game_id, score) values (me, p_game_id, p_score);

  update profiles set stardust = stardust + p_stardust where id = me
    returning stardust into new_total;

  return new_total;
end;
$$;

grant execute on function public.submit_game_score(text, int, int) to authenticated;
