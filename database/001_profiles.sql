-- Perfis (um por conta criada)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'aluno' check (role in ('aluno','empresa','admin')),
  status text not null default 'ativo' check (status in ('ativo','pendente','bloqueado')),
  nome text not null default '',
  email text,
  created_at timestamptz not null default now()
);

-- Função auxiliar: o usuário logado é admin?
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- Cria o perfil automaticamente no cadastro.
-- Só aceita aluno ou empresa: ninguém vira admin pelo app.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare papel text;
begin
  papel := coalesce(new.raw_user_meta_data->>'role', 'aluno');
  if papel not in ('aluno','empresa') then papel := 'aluno'; end if;
  insert into public.profiles (id, role, nome, email)
  values (new.id, papel, coalesce(new.raw_user_meta_data->>'nome', ''), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Impede que um usuário comum mude o próprio papel ou status
create or replace function public.proteger_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
  end if;
  return new;
end;
$$;

create trigger proteger_perfil
before update on public.profiles
for each row execute function public.proteger_perfil();

-- Regras de acesso (RLS)
alter table public.profiles enable row level security;

create policy "perfil: ver o proprio" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "perfil: admin ve todos" on public.profiles
  for select to authenticated using (public.is_admin());
create policy "perfil: editar o proprio" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "perfil: admin edita todos" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());