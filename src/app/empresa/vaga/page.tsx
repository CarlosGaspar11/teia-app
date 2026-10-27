"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import Icone from "@/components/Icone";
import { abrirCurriculo, dataBR } from "@/lib/curriculos";
import {
  buscarVaga,
  formatarBolsa,
  listarCandidatos,
  mudarStatusCandidatura,
  mudarStatusVaga,
  ROTULO_MODALIDADE,
  ROTULO_STATUS,
  ROTULO_TIPO,
  type Candidato,
  type StatusCandidatura,
  type Vaga,
} from "@/lib/vagas";
import base from "@/styles/curriculos.module.css";
import styles from "@/styles/vagas.module.css";

export default function VagaEmpresaPage() {
  // useSearchParams precisa estar dentro de um Suspense no export estático
  return (
    <Suspense fallback={<p style={{ padding: "2.4rem" }}>Carregando...</p>}>
      <Detalhe />
    </Suspense>
  );
}

function seloDoStatus(s: StatusCandidatura) {
  if (s === "selecionado") return styles.seloVerde;
  if (s === "recusado") return styles.seloCinza;
  return styles.selo;
}

function Detalhe() {
  const perfil = usePerfil("empresa");
  const empresaId = perfil?.id;
  const vagaId = useSearchParams().get("id");

  const [vaga, setVaga] = useState<Vaga | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[] | null>(null);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!empresaId || !vagaId) return;
    const [v, c] = await Promise.all([buscarVaga(vagaId), listarCandidatos(vagaId)]);
    setVaga(v);
    setCandidatos(c);
  }, [empresaId, vagaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!perfil) return <p style={{ padding: "2.4rem" }}>Carregando...</p>;

  async function alternarVaga() {
    if (!vaga) return;
    const novo = vaga.status === "aberta" ? "encerrada" : "aberta";
    const msg = await mudarStatusVaga(vaga.id, novo);
    if (msg) setErro(msg);
    else await carregar();
  }

  async function decidir(c: Candidato, status: StatusCandidatura) {
    setErro("");
    const msg = await mudarStatusCandidatura(c.id, status);
    if (msg) setErro(msg);
    else await carregar();
  }

  async function abrir(c: Candidato) {
    if (!c.curriculos) return;
    const msg = await abrirCurriculo(c.curriculos.arquivo_path);
    if (msg) setErro(msg);
  }

  const voltar = (
    <Link href="/empresa" className={base.voltar}>
      <Icone nome="arrow_back" /> Minhas vagas
    </Link>
  );

  if (!vagaId || (candidatos !== null && !vaga)) {
    return (
      <AppShell perfil={perfil}>
        {voltar}
        <p className={base.vazio}>Vaga não encontrada.</p>
      </AppShell>
    );
  }

  const obrigatorio = vaga?.tipo_estagio === "obrigatorio";

  return (
    <AppShell perfil={perfil}>
      {voltar}

      {!vaga ? (
        <p className={base.vazio}>Carregando...</p>
      ) : (
        <>
          <section className={styles.vaga}>
            <div className={styles.vagaTopo}>
              <div>
                <span className={styles.vagaTitulo}>{vaga.titulo}</span>
                <span className={styles.vagaSub}>{ROTULO_TIPO[vaga.tipo_estagio]}</span>
              </div>
              <span className={vaga.status === "aberta" ? styles.seloVerde : styles.seloCinza}>
                {vaga.status === "aberta" ? "Aberta" : "Encerrada"}
              </span>
            </div>

            <div className={styles.meta}>
              <span className={styles.seloCinza}>{ROTULO_MODALIDADE[vaga.modalidade]}</span>
              {vaga.localizacao && <span className={styles.seloCinza}>{vaga.localizacao}</span>}
            </div>
            <span className={styles.bolsa}>{formatarBolsa(vaga.bolsa)}</span>
            <p className={styles.descricao}>{vaga.descricao}</p>

            {vaga.palavras_chave.length > 0 && (
              <div className={styles.chips}>
                {vaga.palavras_chave.map((p) => (
                  <span key={p} className={styles.chip}>{p}</span>
                ))}
              </div>
            )}

            <div className={styles.acoesLinha}>
              <button type="button" className={base.botaoSec} onClick={alternarVaga}>
                <Icone nome={vaga.status === "aberta" ? "lock" : "lock_open"} />
                {vaga.status === "aberta" ? "Encerrar vaga" : "Reabrir vaga"}
              </button>
            </div>
          </section>

          {erro && <p className={base.erro}>{erro}</p>}

          <h2 className={base.secaoTitulo}>
            Candidatos{candidatos ? ` (${candidatos.length})` : ""}
          </h2>
          {obrigatorio && (
            <p className={base.intro}>Estágio obrigatório: ordem de envio das candidaturas.</p>
          )}

          {candidatos === null ? (
            <p className={base.vazio}>Carregando...</p>
          ) : candidatos.length === 0 ? (
            <p className={base.vazio}>Nenhum aluno se candidatou ainda.</p>
          ) : (
            <div className={base.lista}>
              {candidatos.map((c, i) => (
                <article key={c.id} className={base.cartao}>
                  <div className={base.topoCurriculo}>
                    {obrigatorio ? <span className={styles.ordem}>{i + 1}º</span> : <Icone nome="person" />}
                    <div className={base.infoCurriculo}>
                      <span className={base.nomeArquivo}>{c.aluno?.nome || "Aluno"}</span>
                      <span className={base.data}>{c.aluno?.email}</span>
                      <span className={base.data}>Candidatou-se em {dataBR(c.created_at)}</span>
                    </div>
                    <span className={seloDoStatus(c.status)}>{ROTULO_STATUS[c.status]}</span>
                  </div>

                  <div className={styles.acoesLinha}>
                    <button type="button" className={base.botaoSec} onClick={() => abrir(c)}>
                      <Icone nome="description" /> Currículo
                    </button>
                    <button
                      type="button"
                      className={base.botaoSec}
                      onClick={() => decidir(c, "selecionado")}
                    >
                      <Icone nome="check_circle" /> Selecionar
                    </button>
                    <button
                      type="button"
                      className={base.botaoSec}
                      onClick={() => decidir(c, "recusado")}
                    >
                      <Icone nome="cancel" /> Recusar
                    </button>
                    {c.aluno?.email && (
                      <a href={`mailto:${c.aluno.email}`} className={base.botaoSec}>
                        <Icone nome="mail" /> Contatar
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}