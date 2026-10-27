import { supabase } from "@/lib/supabase";
import type { StatusVaga, TipoEstagio } from "@/lib/vagas";

export type Resumo = {
  alunos: number;
  empresas: number;
  vagasAbertas: number;
  curriculos: number;
  candidaturas: number;
};

export type PendenteFeedback = {
  id: string;
  nome_arquivo: string;
  created_at: string;
  aluno_id: string;
  aluno: { nome: string } | null;
  feedbacks: { count: number }[];
};

export type VagaResumo = {
  id: string;
  titulo: string;
  empresa_nome: string;
  status: StatusVaga;
  tipo_estagio: TipoEstagio;
  created_at: string;
  candidaturas: { count: number }[];
};

export async function buscarResumo(): Promise<Resumo> {
  const contar = { count: "exact" as const, head: true };
  const [alunos, empresas, vagas, curriculos, candidaturas] = await Promise.all([
    supabase.from("profiles").select("id", contar).eq("role", "aluno"),
    supabase.from("profiles").select("id", contar).eq("role", "empresa"),
    supabase.from("vagas").select("id", contar).eq("status", "aberta"),
    supabase.from("curriculos").select("id", contar),
    supabase.from("candidaturas").select("id", contar),
  ]);

  return {
    alunos: alunos.count ?? 0,
    empresas: empresas.count ?? 0,
    vagasAbertas: vagas.count ?? 0,
    curriculos: curriculos.count ?? 0,
    candidaturas: candidaturas.count ?? 0,
  };
}

// Currículos que ainda não receberam nenhum feedback, do mais antigo (espera há mais tempo)
// para o mais novo. Analisa até 200 currículos, o que sobra para o MVP.
export async function listarCurriculosSemFeedback(): Promise<PendenteFeedback[]> {
  const { data } = await supabase
    .from("curriculos")
    .select("id, nome_arquivo, created_at, aluno_id, aluno:aluno_id(nome), feedbacks(count)")
    .order("created_at", { ascending: true })
    .limit(200);

  const lista = (data ?? []) as unknown as PendenteFeedback[];
  return lista.filter((c) => (c.feedbacks?.[0]?.count ?? 0) === 0);
}

export async function listarVagasRecentes(): Promise<VagaResumo[]> {
  const { data } = await supabase
    .from("vagas")
    .select("id, titulo, empresa_nome, status, tipo_estagio, created_at, candidaturas(count)")
    .order("created_at", { ascending: false })
    .limit(5);
  return (data ?? []) as unknown as VagaResumo[];
}

export type EmpresaResumo = {
  id: string;
  nome: string;
  email: string | null;
  vagas: { count: number }[];
};

export async function listarEmpresas(): Promise<EmpresaResumo[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, nome, email, vagas(count)")
    .eq("role", "empresa")
    .order("nome");
  return (data ?? []) as unknown as EmpresaResumo[];
}

export async function buscarEmpresa(
  id: string
): Promise<{ id: string; nome: string; email: string | null } | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, nome, email")
    .eq("id", id)
    .eq("role", "empresa")
    .maybeSingle();
  return data ?? null;
}