-- Ao apagar um currículo, as candidaturas que o usavam são retiradas
alter table public.candidaturas
  drop constraint candidaturas_curriculo_id_fkey;

alter table public.candidaturas
  add constraint candidaturas_curriculo_id_fkey
  foreign key (curriculo_id) references public.curriculos(id) on delete cascade;