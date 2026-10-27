"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import Icone from "@/components/Icone";
import { listarEmpresas, type EmpresaResumo } from "@/lib/admin";
import styles from "@/styles/curriculos.module.css";

function normalizar(t: string) {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function EmpresasAdminPage() {
  const perfil = usePerfil("admin");
  const adminId = perfil?.id;
  const [empresas, setEmpresas] = useState<EmpresaResumo[] | null>(null);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (!adminId) return;
    listarEmpresas().then(setEmpresas);
  }, [adminId]);

  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!empresas) return [];
    if (!termo) return empresas;
    return empresas.filter((e) => normalizar(`${e.nome} ${e.email ?? ""}`).includes(termo));
  }, [empresas, busca]);

  if (!perfil) return <p style={{ padding: "2.4rem" }}>Carregando...</p>;

  return (
    <AppShell perfil={perfil}>
      <h1 className={styles.titulo}>Empresas</h1>
      <p className={styles.intro}>Busque uma empresa para ver as vagas publicadas por ela.</p>

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
        {empresas === null ? (
          <p className={styles.vazio}>Carregando...</p>
        ) : filtradas.length === 0 ? (
          <p className={styles.vazio}>Nenhuma empresa encontrada.</p>
        ) : (
          filtradas.map((e) => {
            const total = e.vagas?.[0]?.count ?? 0;
            return (
              <Link key={e.id} href={`/admin/empresas/detalhe?id=${e.id}`} className={styles.aluno}>
                <div className={styles.avatar}>{(e.nome || e.email || "?").charAt(0).toUpperCase()}</div>
                <div className={styles.alunoTexto}>
                  <strong>{e.nome || "Sem nome"}</strong>
                  <span>{e.email}</span>
                </div>
                <span className={styles.contagem}>
                  {total} {total === 1 ? "vaga" : "vagas"}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </AppShell>
  );
}