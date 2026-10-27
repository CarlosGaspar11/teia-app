-- 003: vagas, candidaturas e versões de currículo (rodar depois do 001 e do 002)

-- Versão corrigida: de qual currículo este é a nova versão
alter table public.curriculos
  add column curriculo_anterior_id uuid references public.curriculos(id) on delete set null;

-- Função auxiliar: papel do usuário logado
create or replace function public.meu_papel() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

-- =========================================================
-- TABELAS
-- =========================================================
create table public.vagas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.profiles(id) on delete cascade,
  empresa_nome text not null default '',
  titulo text not null check (char_length(titulo) between 3 and 120),
  descricao text not null default '',
  tipo_estagio text not null check (tipo_estagio in ('obrigatorio','nao_obrigatorio')),
  modalidade text not null check (modalidade in ('presencial','hibrido','remoto')),
  localizacao text not null default '',
  bolsa numeric(10,2) check (bolsa is null or bolsa >= 0),
  palavras_chave text[] not null default '{}',
  status text not null default 'aberta' check (status in ('aberta','encerrada')),
  created_at timestamptz not null default now()
);
create index on public.vagas (empresa_id, created_at desc);
create index on public.vagas (status, created_at desc);

create table public.candidaturas (
  id uuid primary key default gen_random_uuid(),
  vaga_id uuid not null references public.vagas(id) on delete cascade,
  aluno_id uuid not null references public.profiles(id) on delete cascade,
  -- sem "on delete": um currículo usado em candidatura não pode ser apagado
  curriculo_id uuid not null references public.curriculos(id),
  status text not null default 'enviada' check (status in ('enviada','selecionado','recusado')),
  created_at timestamptz not null default now(),  -- define a ordem de envio
  unique (vaga_id, aluno_id)
);
create index on public.candidaturas (vaga_id, created_at);
create index on public.candidaturas (aluno_id, created_at desc);

-- =========================================================
-- FUNÇÕES AUXILIARES (usadas nas regras de acesso)
-- =========================================================
create or replace function public.vaga_da_empresa(p_vaga uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vagas where id = p_vaga and empresa_id = auth.uid())
$$;

create or replace function public.vaga_aberta(p_vaga uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vagas where id = p_vaga and status = 'aberta')
$$;

create or replace function public.aluno_candidatou(p_vaga uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.candidaturas where vaga_id = p_vaga and aluno_id = auth.uid())
$$;

-- A empresa vê o aluno apenas se ele se candidatou a uma vaga dela
create or replace function public.empresa_ve_aluno(p_aluno uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.candidaturas c
    join public.vagas v on v.id = c.vaga_id
    where c.aluno_id = p_aluno and v.empresa_id = auth.uid()
  )
$$;

-- A empresa vê só o currículo que o aluno enviou na candidatura
create or replace function public.empresa_ve_curriculo(p_curriculo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.candidaturas c
    join public.vagas v on v.id = c.vaga_id
    where c.curriculo_id = p_curriculo and v.empresa_id = auth.uid()
  )
$$;

create or replace function public.empresa_ve_arquivo(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.curriculos cu
    join public.candidaturas c on c.curriculo_id = cu.id
    join public.vagas v on v.id = c.vaga_id
    where cu.arquivo_path = p_path and v.empresa_id = auth.uid()
  )
$$;

-- =========================================================
-- TRIGGERS
-- =========================================================
-- O nome da empresa na vaga vem do perfil (ninguém consegue falsificar)
create or replace function public.preencher_vaga() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.empresa_nome := coalesce((select nome from public.profiles where id = new.empresa_id), '');
  return new;
end;
$$;

create trigger preencher_vaga
before insert on public.vagas
for each row execute function public.preencher_vaga();

-- A empresa só consegue mudar o status da candidatura, nada mais
create or replace function public.proteger_candidatura() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.vaga_id := old.vaga_id;
    new.aluno_id := old.aluno_id;
    new.curriculo_id := old.curriculo_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create trigger proteger_candidatura
before update on public.candidaturas
for each row execute function public.proteger_candidatura();

-- =========================================================
-- REGRAS DE ACESSO (RLS)
-- =========================================================
alter table public.vagas enable row level security;
alter table public.candidaturas enable row level security;

-- vagas
create policy "vagas: ver abertas, proprias, candidatadas ou admin" on public.vagas
  for select to authenticated
  using (status = 'aberta' or empresa_id = auth.uid() or public.is_admin() or public.aluno_candidatou(id));
create policy "vagas: empresa cria" on public.vagas
  for insert to authenticated
  with check (empresa_id = auth.uid() and public.meu_papel() = 'empresa');
create policy "vagas: empresa edita as suas" on public.vagas
  for update to authenticated using (empresa_id = auth.uid()) with check (empresa_id = auth.uid());
create policy "vagas: admin edita" on public.vagas
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "vagas: apagar as suas ou admin" on public.vagas
  for delete to authenticated using (empresa_id = auth.uid() or public.is_admin());

-- candidaturas
create policy "cand: aluno ve as proprias" on public.candidaturas
  for select to authenticated using (aluno_id = auth.uid());
create policy "cand: empresa ve as da sua vaga" on public.candidaturas
  for select to authenticated using (public.vaga_da_empresa(vaga_id));
create policy "cand: admin ve todas" on public.candidaturas
  for select to authenticated using (public.is_admin());
create policy "cand: aluno se candidata" on public.candidaturas
  for insert to authenticated
  with check (aluno_id = auth.uid()
              and public.meu_papel() = 'aluno'
              and public.vaga_aberta(vaga_id)
              and public.dono_do_curriculo(curriculo_id));
create policy "cand: empresa atualiza status" on public.candidaturas
  for update to authenticated
  using (public.vaga_da_empresa(vaga_id)) with check (public.vaga_da_empresa(vaga_id));
create policy "cand: admin atualiza" on public.candidaturas
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- A empresa enxerga o perfil e o currículo de quem se candidatou a ela
create policy "perfil: empresa ve candidatos" on public.profiles
  for select to authenticated using (public.empresa_ve_aluno(id));
create policy "curriculos: empresa ve o enviado" on public.curriculos
  for select to authenticated using (public.empresa_ve_curriculo(id));
create policy "storage: empresa le de candidatos" on storage.objects
  for select to authenticated
  using (bucket_id = 'curriculos' and public.empresa_ve_arquivo(name));