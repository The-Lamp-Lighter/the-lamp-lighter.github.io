-- ============================================================
-- LUNARIUM'S LAB — patch: corrige o gatilho de criação de perfil
-- O erro 500 no cadastro acontece porque a função que cria o
-- perfil automaticamente não sabia, com certeza, em qual schema
-- procurar a tabela "profiles". Rode isso uma vez no SQL Editor.
-- ============================================================

create or replace function public.generate_chat_code()
returns text language plpgsql
set search_path = public
as $$
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, chat_code)
  values (
    new.id,
    split_part(new.email, '@', 1),
    public.generate_chat_code()
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
