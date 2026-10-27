"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import Icone from "@/components/Icone";
import { dataBR, listarCurriculos, type Curriculo } from "@/lib/curriculos";
import {
  formatarBolsa,
  listarMinhasCandidaturas,
  listarVagasAbertas,
  ROTULO_MODALIDADE,
  ROTULO_STATUS,
  ROTULO_TIPO,
  type CandidaturaAluno,
  type StatusCandidatura,
  type Vaga,
} from "@/lib/vagas";
import styles from "./aluno.module.css";
import cartoes from "@/styles/vagas.module.css";

function seloDoStatus(s: StatusCandidatura) {
  if (s === "selecionado") return cartoes.seloVerde;
  if (s === "recusado") return cartoes.seloCinza;
  return cartoes.selo;
}

export default function AlunoPage() {
  const perfil = usePerfil("aluno");
  const alunoId = perfil?.id;
  const [vagas, setVagas] = useState<Vaga[] | null>(null);
  const [candidaturas, setCandidaturas] = useState<CandidaturaAluno[] | null>(null);
  const [curriculos, setCurriculos] = useState<Curriculo[] | null>(null);

  useEffect(() => {
    if (!alunoId) return;
    Promise.all([
      listarVagasAbertas(),
      listarMinhasCandidaturas(alunoId),
      listarCurriculos(alunoId),
    ]).then(([v, c, cur]) => {
      setVagas(v);
      setCandidaturas(c);
      setCurriculos(cur);
    });
  }, [alunoId]);

  if (!perfil) return <p className={styles.carregando}>Carregando...</p>;

  const primeiroNome = perfil.nome.split(" ")[0] || "aluno";
  const jaCandidatou = new Set((candidaturas ?? []).map((c) => c.vaga_id));

  let textoCurriculo = "Carregando...";
  if (curriculos) {
    const n = curriculos.length;
    if (n === 0) {
      textoCurriculo = "Você ainda não enviou um currículo";
    } else {
      const fb = curriculos.reduce((soma, c) => soma + c.feedbacks.length, 0);
      textoCurriculo =
        `${n} ${n === 1 ? "currículo enviado" : "currículos enviados"}` +
        (fb > 0 ? ` · ${fb} ${fb === 1 ? "feedback" : "feedbacks"}` : "");
    }
  }

  return (
    <AppShell perfil={perfil}>
      <section className={styles.saudacao}>
        <h1>Olá, {primeiroNome}! 👋</h1>
        <p>Veja as vagas abertas e acompanhe suas candidaturas.</p>
      </section>

      <section className={`${styles.cartao} ${styles.curriculo}`}>
        <div className={styles.icone}>
          <Icone nome="description" />
        </div>
        <div>
          <strong>Seu currículo</strong>
          <span>{textoCurriculo}</span>
        </div>
        <Link href="/aluno/curriculo" className={styles.botaoPequeno}>
          {curriculos && curriculos.length > 0 ? "Ver" : "Enviar"}
        </Link>
      </section>

      <section className={styles.secao}>
        <h2>Minhas candidaturas</h2>
        {candidaturas === null ? (
          <p className={styles.carregando}>Carregando...</p>
        ) : candidaturas.length === 0 ? (
          <p className={styles.carregando}>Você ainda não se candidatou a nenhuma vaga.</p>
        ) : (
          <div className={styles.lista}>
            {candidaturas.map((c) => (
              <Link key={c.id} href={`/aluno/vaga?id=${c.vaga_id}`} className={cartoes.vaga}>
                <div className={cartoes.vagaTopo}>
                  <div>
                    <span className={cartoes.vagaTitulo}>{c.vagas?.titulo ?? "Vaga"}</span>
                    <span className={cartoes.vagaSub}>{c.vagas?.empresa_nome}</span>
                  </div>
                  <span className={seloDoStatus(c.status)}>{ROTULO_STATUS[c.status]}</span>
                </div>
                <div className={cartoes.rodape}>
                  <span>Enviada em {dataBR(c.created_at)}</span>
                  {c.vagas?.status === "encerrada" && <span>Vaga encerrada</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className={styles.secao}>
        <h2>Vagas abertas</h2>
        {vagas === null ? (
          <p className={styles.carregando}>Carregando...</p>
        ) : vagas.length === 0 ? (
          <p className={styles.carregando}>Nenhuma vaga aberta no momento.</p>
        ) : (
          <div className={styles.lista}>
            {vagas.map((vg) => (
              <Link key={vg.id} href={`/aluno/vaga?id=${vg.id}`} className={cartoes.vaga}>
                <div className={cartoes.vagaTopo}>
                  <div>
                    <span className={cartoes.vagaTitulo}>{vg.titulo}</span>
                    <span className={cartoes.vagaSub}>
                      {vg.empresa_nome} · {ROTULO_TIPO[vg.tipo_estagio]}
                    </span>
                  </div>
                  {jaCandidatou.has(vg.id) && <span className={cartoes.seloVerde}>Candidatura enviada</span>}
                </div>
                <div className={cartoes.meta}>
                  <span className={cartoes.seloCinza}>{ROTULO_MODALIDADE[vg.modalidade]}</span>
                  {vg.localizacao && <span className={cartoes.seloCinza}>{vg.localizacao}</span>}
                </div>
                <span className={cartoes.bolsa}>{formatarBolsa(vg.bolsa, vg.remunerada)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}