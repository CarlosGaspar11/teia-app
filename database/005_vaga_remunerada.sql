-- Vaga remunerada ou não remunerada
alter table public.vagas
  add column remunerada boolean not null default true;

-- Vaga não remunerada não tem valor de bolsa
alter table public.vagas
  add constraint vaga_sem_bolsa_se_nao_remunerada check (remunerada or bolsa is null);