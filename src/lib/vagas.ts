import { supabase } from "@/lib/supabase";

export type Modalidade = "presencial" | "hibrido" | "remoto";
export type TipoEstagio = "obrigatorio" | "nao_obrigatorio";
export type StatusVaga = "aberta" | "encerrada";
export type StatusCandidatura = "enviada" | "selecionado" | "recusado";

export type Vaga = {
  id: string;
  empresa_id: string;
  empresa_nome: string;
  titulo: string;
  descricao: string;
  tipo_estagio: TipoEstagio;
  modalidade: Modalidade;
  localizacao: string;
  bolsa: number | null;
  remunerada: boolean;
  palavras_chave: string[];
  status: StatusVaga;
  created_at: string;
};

export type VagaComTotal = Vaga & { candidaturas: { count: number }[] };

export type NovaVaga = {
  titulo: string;
  descricao: string;
  tipo_estagio: TipoEstagio;
  modalidade: Modalidade;
  localizacao: string;
  bolsa: number | null;
  remunerada: boolean;
  palavras_chave: string[];
};

export type CandidaturaAluno = {
  id: string;
  status: StatusCandidatura;
  created_at: string;
  vaga_id: string;
  vagas: { titulo: string; empresa_nome: string; status: StatusVaga } | null;
};

export type Candidato = {
  id: string;
  status: StatusCandidatura;
  created_at: string;
  vaga_id: string;
  aluno: { nome: string; email: string | null } | null;
  curriculos: { nome_arquivo: string; arquivo_path: string; created_at: string } | null;
  vagas?: { titulo: string } | null;
};

export const ROTULO_MODALIDADE: Record<Modalidade, string> = {
  presencial: "Presencial",
  hibrido: "Híbrido",
  remoto: "Remoto",
};

export const ROTULO_TIPO: Record<TipoEstagio, string> = {
  obrigatorio: "Estágio obrigatório",
  nao_obrigatorio: "Estágio não obrigatório",
};

export const ROTULO_STATUS: Record<StatusCandidatura, string> = {
  enviada: "Enviada",
  selecionado: "Selecionado",
  recusado: "Recusado",
};

export function formatarBolsa(valor: number | null, remunerada = true): string {
  if (!remunerada) return "Não remunerada";
  if (valor === null || valor === undefined) return "Bolsa a combinar";
  return `${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} /mês`;
}

// "React, SQL; git" -> ["react", "sql", "git"]
export function separarPalavras(texto: string): string[] {
  const unicas = new Set<string>();
  texto.split(/[,;\n]/).forEach((p) => {
    const limpa = p.trim().toLowerCase();
    if (limpa) unicas.add(limpa);
  });
  return Array.from(unicas).slice(0, 20);
}

const CAMPOS_VAGA =
  "id, empresa_id, empresa_nome, titulo, descricao, tipo_estagio, modalidade, localizacao, bolsa, remunerada, palavras_chave, status, created_at";

// --- Empresa ---

export async function criarVaga(empresaId: string, dados: NovaVaga): Promise<string | null> {
  const { error } = await supabase.from("vagas").insert({ empresa_id: empresaId, ...dados });
  return error ? "Não foi possível publicar a vaga." : null;
}

export async function listarMinhasVagas(empresaId: string): Promise<VagaComTotal[]> {
  const { data } = await supabase
    .from("vagas")
    .select(`${CAMPOS_VAGA}, candidaturas(count)`)
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as VagaComTotal[];
}

export async function mudarStatusVaga(id: string, status: StatusVaga): Promise<string | null> {
  const { error } = await supabase.from("vagas").update({ status }).eq("id", id);
  return error ? "Não foi possível atualizar a vaga." : null;
}

// Candidatos de uma vaga, do mais antigo para o mais novo (ordem de envio)
export async function listarCandidatos(vagaId: string): Promise<Candidato[]> {
  const { data } = await supabase
    .from("candidaturas")
    .select("id, status, created_at, vaga_id, aluno:aluno_id(nome, email), curriculos(nome_arquivo, arquivo_path, created_at)")
    .eq("vaga_id", vagaId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as Candidato[];
}

// Candidatos de todas as vagas da empresa (as regras do banco já filtram)
export async function listarTodosCandidatos(): Promise<Candidato[]> {
  const { data } = await supabase
    .from("candidaturas")
    .select("id, status, created_at, vaga_id, aluno:aluno_id(nome, email), curriculos(nome_arquivo, arquivo_path, created_at), vagas(titulo)")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as Candidato[];
}

export async function mudarStatusCandidatura(
  id: string,
  status: StatusCandidatura
): Promise<string | null> {
  const { error } = await supabase.from("candidaturas").update({ status }).eq("id", id);
  return error ? "Não foi possível atualizar o candidato." : null;
}

// --- Aluno (usado no passo 2) ---

export async function listarVagasAbertas(): Promise<Vaga[]> {
  const { data } = await supabase
    .from("vagas")
    .select(CAMPOS_VAGA)
    .eq("status", "aberta")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as Vaga[];
}

export async function buscarVaga(id: string): Promise<Vaga | null> {
  const { data } = await supabase.from("vagas").select(CAMPOS_VAGA).eq("id", id).maybeSingle();
  return (data as unknown as Vaga) ?? null;
}

export async function candidatar(
  alunoId: string,
  vagaId: string,
  curriculoId: string
): Promise<string | null> {
  const { error } = await supabase
    .from("candidaturas")
    .insert({ aluno_id: alunoId, vaga_id: vagaId, curriculo_id: curriculoId });
  if (!error) return null;
  if (error.code === "23505") return "Você já se candidatou a esta vaga.";
  return "Não foi possível enviar a candidatura.";
}

export async function listarMinhasCandidaturas(alunoId: string): Promise<CandidaturaAluno[]> {
  const { data } = await supabase
    .from("candidaturas")
    .select("id, status, created_at, vaga_id, vagas(titulo, empresa_nome, status)")
    .eq("aluno_id", alunoId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as CandidaturaAluno[];
}

export type MinhaCandidatura = {
  id: string;
  status: StatusCandidatura;
  created_at: string;
  curriculos: { nome_arquivo: string } | null;
};

// A candidatura do aluno a uma vaga (ou null se ainda não se candidatou)
export async function buscarMinhaCandidatura(
  alunoId: string,
  vagaId: string
): Promise<MinhaCandidatura | null> {
  const { data } = await supabase
    .from("candidaturas")
    .select("id, status, created_at, curriculos(nome_arquivo)")
    .eq("aluno_id", alunoId)
    .eq("vaga_id", vagaId)
    .maybeSingle();
  return (data as unknown as MinhaCandidatura) ?? null;
}

export async function retirarCandidatura(id: string): Promise<string | null> {
  const { data, error } = await supabase.from("candidaturas").delete().eq("id", id).select("id");
  if (error || !data || data.length === 0) return "Não foi possível retirar a candidatura.";
  return null;
}