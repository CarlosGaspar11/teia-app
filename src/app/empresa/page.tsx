"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import Icone from "@/components/Icone";
import {
  formatarBolsa,
  listarMinhasVagas,
  ROTULO_MODALIDADE,
  ROTULO_TIPO,
  type VagaComTotal,
} from "@/lib/vagas";
import base from "@/styles/curriculos.module.css";
import styles from "@/styles/vagas.module.css";

export default function EmpresaPage() {
  const perfil = usePerfil("empresa");
  const empresaId = perfil?.id;
  const [vagas, setVagas] = useState<VagaComTotal[] | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    listarMinhasVagas(empresaId).then(setVagas);
  }, [empresaId]);

  if (!perfil) return <p style={{ padding: "2.4rem" }}>Carregando...</p>;

  const abertas = vagas?.filter((v) => v.status === "aberta").length ?? 0;
  const candidaturas = vagas?.reduce((soma, v) => soma + (v.candidaturas?.[0]?.count ?? 0), 0) ?? 0;

  return (
    <AppShell perfil={perfil}>
      <h1 className={base.titulo}>Olá, {perfil.nome}</h1>
      <p className={base.intro}>Publique vagas e acompanhe os candidatos.</p>

      <Link href="/empresa/vaga/nova" className={styles.publicar}>
        <Icone nome="add_circle" /> Publicar nova vaga
      </Link>

      <div className={styles.numeros}>
        <div>
          <strong>{abertas}</strong>
          <span>Vagas abertas</span>
        </div>
        <div>
          <strong>{candidaturas}</strong>
          <span>Candidaturas</span>
        </div>
      </div>

      <h2 className={base.secaoTitulo}>Minhas vagas</h2>

      {vagas === null ? (
        <p className={base.vazio}>Carregando...</p>
      ) : vagas.length === 0 ? (
        <p className={base.vazio}>Você ainda não publicou nenhuma vaga.</p>
      ) : (
        <div className={base.lista}>
          {vagas.map((v) => {
            const total = v.candidaturas?.[0]?.count ?? 0;
            return (
              <Link key={v.id} href={`/empresa/vaga?id=${v.id}`} className={styles.vaga}>
                <div className={styles.vagaTopo}>
                  <div>
                    <span className={styles.vagaTitulo}>{v.titulo}</span>
                    <span className={styles.vagaSub}>{ROTULO_TIPO[v.tipo_estagio]}</span>
                  </div>
                  <span className={v.status === "aberta" ? styles.seloVerde : styles.seloCinza}>
                    {v.status === "aberta" ? "Aberta" : "Encerrada"}
                  </span>
                </div>
                <div className={styles.meta}>
                  <span className={styles.seloCinza}>{ROTULO_MODALIDADE[v.modalidade]}</span>
                  {v.localizacao && <span className={styles.seloCinza}>{v.localizacao}</span>}
                </div>
                <div className={styles.rodape}>
                  <span className={styles.bolsa}>{formatarBolsa(v.bolsa)}</span>
                  <span>
                    {total} {total === 1 ? "candidato" : "candidatos"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}