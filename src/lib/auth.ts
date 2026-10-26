import { supabase } from "@/lib/supabase";

export type Papel = "aluno" | "empresa" | "admin";

export type Perfil = {
  id: string;
  role: Papel;
  status: string;
  nome: string;
  email: string | null;
};

const NOMES: Record<Papel, string> = { aluno: "Aluno", empresa: "Empresa", admin: "Admin" };

function traduzirErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered")) return "Este e-mail já está cadastrado.";
  if (m.includes("at least 6")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("valid email") || m.includes("invalid email")) return "Digite um e-mail válido.";
  if (m.includes("not confirmed")) return "E-mail ainda não confirmado.";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
  return "Algo deu errado. Tente novamente.";
}

// Lê o perfil de quem está logado (ou null se não houver sessão)
export async function buscarPerfil(): Promise<Perfil | null> {
  const { data: sessao } = await supabase.auth.getSession();
  if (!sessao.session) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, status, nome, email")
    .eq("id", sessao.session.user.id)
    .single();
  if (error || !data) return null;
  return data as Perfil;
}

export async function fazerLogin(email: string, senha: string, aba: Papel) {
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { perfil: null, erro: traduzirErro(error.message) };

  const perfil = await buscarPerfil();
  if (!perfil) {
    await supabase.auth.signOut();
    return { perfil: null, erro: "Não foi possível carregar o seu perfil." };
  }
  if (perfil.role !== aba) {
    await supabase.auth.signOut();
    return { perfil: null, erro: `Esta conta não é do tipo ${NOMES[aba]}.` };
  }
  return { perfil, erro: null };
}

export async function cadastrar(dados: {
  nome: string;
  email: string;
  senha: string;
  papel: "aluno" | "empresa";
}) {
  const { error } = await supabase.auth.signUp({
    email: dados.email,
    password: dados.senha,
    options: { data: { nome: dados.nome, role: dados.papel } },
  });
  if (error) return { perfil: null, erro: traduzirErro(error.message) };

  const perfil = await buscarPerfil();
  if (!perfil) return { perfil: null, erro: "Conta criada, mas não foi possível entrar. Tente fazer login." };
  return { perfil, erro: null };
}

export async function sairDaConta() {
  await supabase.auth.signOut();
}