"use client";

import Link from "next/link";
import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import Icone from "@/components/Icone";
import styles from "./aluno.module.css";

// DADOS DE EXEMPLO: depois vêm do Supabase (candidaturas e vagas)
const CANDIDATURAS = [
  { sigla: "Nu", empresa: "Nubank", texto: "Entrevista agendada (14/Nov)", status: "Etapa 2 de 3", destaque: true },
  { sigla: "ML", empresa: "Mercado Livre", texto: "Em análise pela equipe técnica", status: "Em análise", destaque: false },
];

const VAGAS = [
  { titulo: "Estágio em Frontend", local: "Stone • São Paulo, SP", modo: "Híbrido", bolsa: "R$ 2.400 /mês" },
  { titulo: "Estágio em Tecnologia", local: "Itaú Unibanco • Nacional", modo: "Remoto", bolsa: "R$ 2.800 /mês" },
];

export default function AlunoPage() {
  const perfil = usePerfil("aluno");
  if (!perfil) return <p className={styles.carregando}>Carregando...</p>;

  const primeiroNome = perfil.nome.split(" ")[0] || "aluno";

  return (
    <AppShell perfil={perfil}>
      <section className={styles.saudacao}>
        <h1>Olá, {primeiroNome}! 👋</h1>
        <p>Veja suas candidaturas e as vagas para você.</p>
      </section>

      <section className={`${styles.cartao} ${styles.curriculo}`}>
        <div className={styles.icone}>
          <Icone nome="description" />
        </div>
        <div>
          <strong>Seu currículo</strong>
          <span>Você ainda não enviou um currículo</span>
        </div>
        <Link href="/aluno/curriculo" className={styles.botaoPequeno}>
          Criar
        </Link>
      </section>

      <section className={styles.secao}>
        <h2>Candidaturas em andamento</h2>
        <div className={styles.lista}>
          {CANDIDATURAS.map((c) => (
            <article key={c.empresa} className={`${styles.cartao} ${styles.item}`}>
              <div className={styles.icone}>{c.sigla}</div>
              <div className={styles.itemTexto}>
                <strong>{c.empresa}</strong>
                <span>{c.texto}</span>
              </div>
              <span className={c.destaque ? styles.selo : styles.seloNeutro}>{c.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.secao}>
        <h2>Vagas recomendadas</h2>
        <div className={styles.lista}>
          {VAGAS.map((v) => (
            <article key={v.titulo} className={`${styles.cartao} ${styles.vaga}`}>
              <div className={styles.vagaTopo}>
                <div className={styles.itemTexto}>
                  <strong>{v.titulo}</strong>
                  <span>{v.local}</span>
                </div>
                <span className={styles.seloNeutro}>{v.modo}</span>
              </div>
              <div className={styles.vagaRodape}>
                <span className={styles.bolsa}>{v.bolsa}</span>
                <button type="button" className={styles.botao}>
                  Candidatar-se
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}