-- O aluno pode retirar a candidatura enquanto ela ainda está "enviada"
create policy "cand: aluno retira a sua enviada" on public.candidaturas
  for delete to authenticated
  using (aluno_id = auth.uid() and status = 'enviada');

-- Nova versão: só pode apontar para um currículo do próprio aluno
drop policy "curriculos: aluno envia" on public.curriculos;
create policy "curriculos: aluno envia" on public.curriculos
  for insert to authenticated
  with check (
    aluno_id = auth.uid()
    and (curriculo_anterior_id is null or public.dono_do_curriculo(curriculo_anterior_id))
  );