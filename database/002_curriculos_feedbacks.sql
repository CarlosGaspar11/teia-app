-- Currículos enviados pelos alunos
create table public.curriculos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.profiles(id) on delete cascade,
  nome_arquivo text not null,
  arquivo_path text not null,
  created_at timestamptz not null default now()
);
create index on public.curriculos (aluno_id, created_at desc);

-- Feedbacks do admin sobre cada currículo
create table public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  curriculo_id uuid not null references public.curriculos(id) on delete cascade,
  admin_id uuid not null references public.profiles(id),
  texto text not null check (char_length(texto) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index on public.feedbacks (curriculo_id, created_at);

-- Função auxiliar: o currículo é do usuário logado?
create or replace function public.dono_do_curriculo(p_curriculo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.curriculos where id = p_curriculo and aluno_id = auth.uid()
  )
$$;

-- Regras de acesso (RLS)
alter table public.curriculos enable row level security;
alter table public.feedbacks enable row level security;

create policy "curriculos: aluno ve os seus" on public.curriculos
  for select to authenticated using (aluno_id = auth.uid());
create policy "curriculos: admin ve todos" on public.curriculos
  for select to authenticated using (public.is_admin());
create policy "curriculos: aluno envia" on public.curriculos
  for insert to authenticated with check (aluno_id = auth.uid());
create policy "curriculos: aluno apaga os seus" on public.curriculos
  for delete to authenticated using (aluno_id = auth.uid());

create policy "feedbacks: admin ve todos" on public.feedbacks
  for select to authenticated using (public.is_admin());
create policy "feedbacks: aluno ve os dos seus curriculos" on public.feedbacks
  for select to authenticated using (public.dono_do_curriculo(curriculo_id));
create policy "feedbacks: admin cria" on public.feedbacks
  for insert to authenticated with check (public.is_admin() and admin_id = auth.uid());
create policy "feedbacks: admin apaga" on public.feedbacks
  for delete to authenticated using (public.is_admin());

-- Armazenamento dos PDFs (privado, só PDF, até 5 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('curriculos', 'curriculos', false, 5242880, array['application/pdf'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "storage: aluno envia na propria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'curriculos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage: aluno ou admin le" on storage.objects
  for select to authenticated
  using (bucket_id = 'curriculos'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "storage: aluno apaga os seus" on storage.objects
  for delete to authenticated
  using (bucket_id = 'curriculos' and (storage.foldername(name))[1] = auth.uid()::text);