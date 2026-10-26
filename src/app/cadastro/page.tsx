"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icone from "@/components/Icone";
import { cadastrar } from "@/lib/auth";
import styles from "../login/login.module.css";

type Tipo = "aluno" | "empresa";

export default function CadastroPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<Tipo>("aluno");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const divergente = confirmar.length > 0 && senha !== confirmar;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !email || !senha || !confirmar) {
      setErro("Preencha todos os campos.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    setErro("");
    setCarregando(true);
    const { perfil, erro: msg } = await cadastrar({ nome, email, senha, papel: tipo });
    setCarregando(false);
    if (msg || !perfil) {
      setErro(msg ?? "Não foi possível criar a conta.");
      return;
    }
    router.replace(`/${perfil.role}`);
  }

  return (
    <main className={styles.pagina}>
      <img src="/logo.svg" alt="" className={styles.logo} />
      <h1 className={styles.titulo}>
        Criar <span>conta</span>
      </h1>
      <p className={styles.subtitulo}>Escolha o tipo de conta e preencha seus dados</p>

      <div className={styles.abas} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tipo === "aluno"}
          className={tipo === "aluno" ? styles.abaAtiva : styles.aba}
          onClick={() => setTipo("aluno")}
        >
          <Icone nome="school" /> Aluno
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tipo === "empresa"}
          className={tipo === "empresa" ? styles.abaAtiva : styles.aba}
          onClick={() => setTipo("empresa")}
        >
          <Icone nome="apartment" /> Empresa
        </button>
      </div>

      <form className={styles.form} onSubmit={enviar}>
        <label className={styles.label} htmlFor="nome">
          {tipo === "aluno" ? "Nome completo" : "Nome da empresa"}
        </label>
        <div className={styles.campo}>
          <Icone nome={tipo === "aluno" ? "person" : "apartment"} />
          <input
            id="nome"
            placeholder={tipo === "aluno" ? "Seu nome completo" : "Nome da empresa"}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="name"
          />
        </div>

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

        <label className={styles.label} htmlFor="senha">Senha</label>
        <div className={styles.campo}>
          <Icone nome="lock" />
          <input
            id="senha"
            type={verSenha ? "text" : "password"}
            placeholder="Mínimo de 6 caracteres"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="new-password"
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

        <label className={styles.label} htmlFor="confirmar">Confirmar senha</label>
        <div className={styles.campo}>
          <Icone nome="lock" />
          <input
            id="confirmar"
            type={verSenha ? "text" : "password"}
            placeholder="Digite a senha novamente"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            autoComplete="new-password"
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
        {divergente && <p className={styles.erro}>As senhas não coincidem.</p>}

        {erro && <p className={styles.erro}>{erro}</p>}

        <button type="submit" className={styles.botao} disabled={carregando}>
          {carregando ? "Criando conta..." : <>Criar conta <Icone nome="arrow_forward" /></>}
        </button>
      </form>

      <p className={styles.cadastro}>
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </main>
  );
}