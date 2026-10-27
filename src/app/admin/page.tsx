"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import { dataBR } from "@/lib/curriculos";
import {
  buscarResumo,
  listarCurriculosSemFeedback,
  listarVagasRecentes,
  type PendenteFeedback,
  type Resumo,
  type VagaResumo,
} from "@/lib/admin";
import { ROTULO_TIPO } from "@/lib/vagas";
import base from "@/styles/curriculos.module.css";
import styles from "@/styles/vagas.module.css";

export default function AdminPage() {
  const perfil = usePerfil("admin");
  const adminId = perfil?.id;
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [pendentes, setPendentes] = useState<PendenteFeedback[] | null>(null);
  const [vagas, setVagas] = useState<VagaResumo[] | null>(null);

  useEffect(() => {
    if (!adminId) return;
    Promise.all([buscarResumo(), listarCurriculosSemFeedback(), listarVagasRecentes()]).then(
      ([r, p, v]) => {
        setResumo(r);
        setPendentes(p);
        setVagas(v);
      }
    );
  }, [adminId]);

  if (!perfil) return <p style={{ padding: "2.4rem" }}>Carregando...</p>;

  const numeros = [
    { valor: resumo?.alunos, rotulo: "Alunos" },
    { valor: resumo?.empresas, rotulo: "Empresas" },
    { valor: resumo?.vagasAbertas, rotulo: "Vagas abertas" },
    { valor: resumo?.candidaturas, rotulo: "Candidaturas" },
    { valor: resumo?.curriculos, rotulo: "Currículos enviados" },
    { valor: pendentes?.length, rotulo: "Aguardando feedback" },
  ];

  return (
    <AppShell perfil={perfil}>
      <h1 className={base.titulo}>Central administrativa</h1>
      <p className={base.intro}>Visão geral do TEIA Carreiras.</p>

      <div className={styles.numeros} style={{ marginTop: 0 }}>
        {numeros.map((n) => (
          <div key={n.rotulo}>
            <strong>{n.valor ?? "–"}</strong>
            <span>{n.rotulo}</span>
          </div>
        ))}
      </div>

      <h2 className={base.secaoTitulo}>Aguardando feedback</h2>
      {pendentes === null ? (
        <p className={base.vazio}>Carregando...</p>
      ) : pendentes.length === 0 ? (
        <p className={base.vazio}>Nenhum currículo aguardando feedback. 🎉</p>
      ) : (
        <div className={base.lista}>
          {pendentes.slice(0, 5).map((c) => (
            <Link key={c.id} href={`/admin/alunos/detalhe?id=${c.aluno_id}`} className={base.aluno}>
              <div className={base.avatar}>{(c.aluno?.nome || "?").charAt(0).toUpperCase()}</div>
              <div className={base.alunoTexto}>
                <strong>{c.aluno?.nome || "Aluno"}</strong>
                <span>
                  {c.nome_arquivo} · {dataBR(c.created_at)}
                </span>
              </div>
              <span className={styles.selo}>Sem feedback</span>
            </Link>
          ))}
          {pendentes.length > 5 && (
            <Link href="/admin/alunos" className={base.botaoSec} style={{ alignSelf: "flex-start" }}>
              Ver todos os alunos
            </Link>
          )}
        </div>
      )}

      <h2 className={base.secaoTitulo}>Vagas recentes</h2>
      {vagas === null ? (
        <p className={base.vazio}>Carregando...</p>
      ) : vagas.length === 0 ? (
        <p className={base.vazio}>Nenhuma vaga publicada ainda.</p>
      ) : (
        <div className={base.lista}>
          {vagas.map((v) => {
            const total = v.candidaturas?.[0]?.count ?? 0;
            return (
              <article key={v.id} className={styles.vaga}>
                <div className={styles.vagaTopo}>
                  <div>
                    <span className={styles.vagaTitulo}>{v.titulo}</span>
                    <span className={styles.vagaSub}>
                      {v.empresa_nome} · {ROTULO_TIPO[v.tipo_estagio]}
                    </span>
                  </div>
                  <span className={v.status === "aberta" ? styles.seloVerde : styles.seloCinza}>
                    {v.status === "aberta" ? "Aberta" : "Encerrada"}
                  </span>
                </div>
                <div className={styles.rodape}>
                  <span>Publicada em {dataBR(v.created_at)}</span>
                  <span>
                    {total} {total === 1 ? "candidato" : "candidatos"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}