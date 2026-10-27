"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import Icone from "@/components/Icone";
import { listarAlunos, type AlunoResumo } from "@/lib/curriculos";
import styles from "@/styles/curriculos.module.css";

function normalizar(t: string) {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function AlunosAdminPage() {
  const perfil = usePerfil("admin");
  const adminId = perfil?.id;
  const [alunos, setAlunos] = useState<AlunoResumo[] | null>(null);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (!adminId) return;
    listarAlunos().then(setAlunos);
  }, [adminId]);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!alunos) return [];
    if (!termo) return alunos;
    return alunos.filter((a) => normalizar(`${a.nome} ${a.email ?? ""}`).includes(termo));
  }, [alunos, busca]);

  if (!perfil) return <p style={{ padding: "2.4rem" }}>Carregando...</p>;

  return (
    <AppShell perfil={perfil}>
      <h1 className={styles.titulo}>Alunos</h1>
      <p className={styles.intro}>Busque um aluno para ver os currículos e dar feedback.</p>

      <label className={styles.busca}>
        <Icone nome="search" />
        <input
          type="search"
          placeholder="Buscar por nome ou e-mail"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </label>

      <div className={styles.lista} style={{ marginTop: "1.6rem" }}>
        {alunos === null ? (
          <p className={styles.vazio}>Carregando...</p>
        ) : filtrados.length === 0 ? (
          <p className={styles.vazio}>Nenhum aluno encontrado.</p>
        ) : (
          filtrados.map((a) => {
            const total = a.curriculos?.[0]?.count ?? 0;
            return (
              <Link key={a.id} href={`/admin/alunos/detalhe?id=${a.id}`} className={styles.aluno}>
                <div className={styles.avatar}>{(a.nome || a.email || "?").charAt(0).toUpperCase()}</div>
                <div className={styles.alunoTexto}>
                  <strong>{a.nome || "Sem nome"}</strong>
                  <span>{a.email}</span>
                </div>
                <span className={styles.contagem}>
                  {total} {total === 1 ? "currículo" : "currículos"}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </AppShell>
  );
}