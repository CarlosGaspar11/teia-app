"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icone from "@/components/Icone";
import styles from "./login.module.css";
import { fazerLogin } from "@/lib/auth";

type Perfil = "aluno" | "empresa" | "admin";

const PERFIS: { id: Perfil; nome: string; icone: string; dica: string }[] = [
  { id: "aluno", nome: "Aluno", icone: "school", dica: "Acesse com seu e-mail institucional" },
  { id: "empresa", nome: "Empresa", icone: "apartment", dica: "Acesse com o e-mail da sua empresa" },
  { id: "admin", nome: "Admin", icone: "admin_panel_settings", dica: "Acesso restrito à equipe do TEIA" },
];

export default function LoginPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil>("aluno");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");

  const atual = PERFIS.find((p) => p.id === perfil)!;
  
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !senha) {
      setErro("Preencha o e-mail e a senha.");
      return;
    }
    setErro("");
    setCarregando(true);
    const { perfil: conta, erro: msg } = await fazerLogin(email, senha, perfil);
    setCarregando(false);
    if (msg || !conta) {
      setErro(msg ?? "Não foi possível entrar.");
      return;
    }
    router.push(`/${conta.role}`);
  }

  return (
    <main className={styles.pagina}>
      <img src="/logo.svg" alt="" className={styles.logo} />
      <h1 className={styles.titulo}>
        TEIA <span>Carreiras</span>
      </h1>
      <p className={styles.subtitulo}>
        Conectando talentos universitários a grandes oportunidades de estágio e carreira
      </p>

      <div className={styles.abas} role="tablist">
        {PERFIS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={perfil === p.id}
            className={perfil === p.id ? styles.abaAtiva : styles.aba}
            onClick={() => setPerfil(p.id)}
          >
            <Icone nome={p.icone} />
            {p.nome}
          </button>
        ))}
      </div>
      <p className={styles.dica}>{atual.dica}</p>

      <form className={styles.form} onSubmit={entrar}>
        <label className={styles.label} htmlFor="email">E-mail</label>
        <div className={styles.campo}>
          <Icone nome="mail" />
          <input
            id="email"
            type="email"
            placeholder="nome@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <label className={styles.label} htmlFor="senha">Senha de acesso</label>
        <div className={styles.campo}>
          <Icone nome="lock" />
          <input
            id="senha"
            type={verSenha ? "text" : "password"}
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            className={styles.olho}
            onClick={() => setVerSenha(!verSenha)}
            aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
          >
            <Icone nome={verSenha ? "visibility_off" : "visibility"} />
          </button>
        </div>

        <div className={styles.linha}>
          <label className={styles.lembrar}>
            <input type="checkbox" /> Lembrar de mim
          </label>
          <Link href="/login">Esqueceu a senha?</Link>
        </div>

        {erro && <p className={styles.erro}>{erro}</p>}

        <button type="submit" className={styles.botao} disabled={carregando}>
          {carregando ? "Entrando..." : <>Entrar na Plataforma <Icone nome="arrow_forward" /></>}
        </button>
      </form>

      {perfil !== "admin" && (
        <p className={styles.cadastro}>
          Primeiro acesso? <Link href="/cadastro">Cadastre-se</Link>
        </p>
      )}
    </main>
  );
}