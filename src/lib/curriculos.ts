import { supabase } from "@/lib/supabase";

export type Feedback = { id: string; texto: string; created_at: string };

export type Curriculo = {
  id: string;
  nome_arquivo: string;
  arquivo_path: string;
  created_at: string;
  curriculo_anterior_id: string | null;
  feedbacks: Feedback[];
  candidaturas: { count: number }[];
};

export type AlunoResumo = {
  id: string;
  nome: string;
  email: string | null;
  curriculos: { count: number }[];
};

const BUCKET = "curriculos";
const LIMITE_BYTES = 5 * 1024 * 1024;
const CAMPOS =
  "id, nome_arquivo, arquivo_path, created_at, curriculo_anterior_id, feedbacks(id, texto, created_at), candidaturas(count)";

export function dataBR(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function enviarCurriculo(
  alunoId: string,
  arquivo: File,
  anteriorId: string | null = null
): Promise<{ id: string | null; erro: string | null }> {
  const ehPdf = arquivo.type === "application/pdf" || arquivo.name.toLowerCase().endsWith(".pdf");
  if (!ehPdf) return { id: null, erro: "Envie um arquivo em PDF." };
  if (arquivo.size > LIMITE_BYTES) return { id: null, erro: "O PDF deve ter no máximo 5 MB." };

  const nomeSeguro = arquivo.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  const caminho = `${alunoId}/${Date.now()}-${nomeSeguro}`;

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, arquivo, { contentType: "application/pdf" });
  if (erroUpload) return { id: null, erro: "Não foi possível enviar o arquivo. Tente novamente." };

  const { data, error: erroBanco } = await supabase
    .from("curriculos")
    .insert({
      aluno_id: alunoId,
      nome_arquivo: arquivo.name,
      arquivo_path: caminho,
      curriculo_anterior_id: anteriorId,
    })
    .select("id")
    .single();

  if (erroBanco || !data) {
    await supabase.storage.from(BUCKET).remove([caminho]);
    return { id: null, erro: "Não foi possível registrar o currículo." };
  }
  return { id: data.id as string, erro: null };
}

export async function listarCurriculos(alunoId: string): Promise<Curriculo[]> {
  const { data } = await supabase
    .from("curriculos")
    .select(CAMPOS)
    .eq("aluno_id", alunoId)
    .order("created_at", { ascending: false });

  const lista = (data ?? []) as unknown as Curriculo[];
  lista.forEach((c) => c.feedbacks.sort((a, b) => a.created_at.localeCompare(b.created_at)));
  return lista;
}

export async function vagasDoCurriculo(
  curriculoId: string
): Promise<{ titulo: string; empresa_nome: string }[]> {
  const { data } = await supabase
    .from("candidaturas")
    .select("vagas(titulo, empresa_nome)")
    .eq("curriculo_id", curriculoId);

  const lista = (data ?? []) as unknown as {
    vagas: { titulo: string; empresa_nome: string } | null;
  }[];
  return lista.map((l) => l.vagas).filter((v): v is NonNullable<typeof v> => v !== null);
}

export async function apagarCurriculo(c: Curriculo): Promise<string | null> {
  const { error } = await supabase.from("curriculos").delete().eq("id", c.id);
  if (error) return "Não foi possível apagar o currículo.";
  await supabase.storage.from(BUCKET).remove([c.arquivo_path]);
  return null;
}

// Gera um link temporário e abre o PDF (no Android abre no navegador do celular)
export async function abrirCurriculo(caminho: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 120);
  if (error || !data) return "Não foi possível abrir o arquivo.";
  window.open(data.signedUrl, "_blank");
  return null;
}

// --- Usado pelo admin ---

export async function listarAlunos(): Promise<AlunoResumo[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, nome, email, curriculos(count)")
    .eq("role", "aluno")
    .order("nome");
  return (data ?? []) as unknown as AlunoResumo[];
}

export async function buscarAluno(id: string): Promise<{ id: string; nome: string; email: string | null } | null> {
  const { data } = await supabase.from("profiles").select("id, nome, email").eq("id", id).single();
  return data ?? null;
}

export async function enviarFeedback(curriculoId: string, texto: string): Promise<string | null> {
  const { data: sessao } = await supabase.auth.getUser();
  const adminId = sessao.user?.id;
  if (!adminId) return "Sessão expirada. Entre novamente.";

  const { error } = await supabase
    .from("feedbacks")
    .insert({ curriculo_id: curriculoId, admin_id: adminId, texto: texto.trim() });
  if (error) return "Não foi possível enviar o feedback.";
  return null;
}

