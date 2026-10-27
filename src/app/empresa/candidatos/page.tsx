"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import { dataBR } from "@/lib/curriculos";
import { listarTodosCandidatos, ROTULO_STATUS, type Candidato } from "@/lib/vagas";
import base from "@/styles/curriculos.module.css";
import styles from "@/styles/vagas.module.css";

export default function CandidatosEmpresaPage() {
  const perfil = usePerfil("empresa");
  const empresaId = perfil?.id;
  const [lista, setLista] = useState<Candidato[] | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    listarTodosCandidatos().then(setLista);
  }, [empresaId]);

  if (!perfil) return <p style={{ padding: "2.4rem" }}>Carregando...</p>;

  return (
    <AppShell perfil={perfil}>
      <h1 className={base.titulo}>Candidatos</h1>
      <p className={base.intro}>Todos os alunos que se candidataram às suas vagas.</p>

      {lista === null ? (
        <p className={base.vazio}>Carregando...</p>
      ) : lista.length === 0 ? (
        <p className={base.vazio}>Ainda não há candidaturas.</p>
      ) : (
        <div className={base.lista}>
          {lista.map((c) => (
            <Link key={c.id} href={`/empresa/vaga?id=${c.vaga_id}`} className={base.aluno}>
              <div className={base.avatar}>{(c.aluno?.nome || "?").charAt(0).toUpperCase()}</div>
              <div className={base.alunoTexto}>
                <strong>{c.aluno?.nome || "Aluno"}</strong>
                <span>
                  {c.vagas?.titulo} · {dataBR(c.created_at)}
                </span>
              </div>
              <span
                className={
                  c.status === "selecionado"
                    ? styles.seloVerde
                    : c.status === "recusado"
                    ? styles.seloCinza
                    : styles.selo
                }
              >
                {ROTULO_STATUS[c.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}