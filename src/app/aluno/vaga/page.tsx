"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import Icone from "@/components/Icone";
import { dataBR, enviarCurriculo, listarCurriculos, type Curriculo } from "@/lib/curriculos";
import {
  buscarMinhaCandidatura,
  buscarVaga,
  candidatar,
  formatarBolsa,
  retirarCandidatura,
  ROTULO_MODALIDADE,
  ROTULO_STATUS,
  ROTULO_TIPO,
  type MinhaCandidatura,
  type StatusCandidatura,
  type Vaga,
} from "@/lib/vagas";
import base from "@/styles/curriculos.module.css";
import styles from "@/styles/vagas.module.css";

export default function VagaAlunoPage() {
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
  const perfil = usePerfil("aluno");
  const alunoId = perfil?.id;
  const vagaId = useSearchParams().get("id");
  const inputRef = useRef<HTMLInputElement>(null);

  const [vaga, setVaga] = useState<Vaga | null>(null);
  const [carregou, setCarregou] = useState(false);
  const [minha, setMinha] = useState<MinhaCandidatura | null>(null);
  const [curriculos, setCurriculos] = useState<Curriculo[] | null>(null);
  const [aberto, setAberto] = useState(false);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [anexando, setAnexando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  const carregar = useCallback(async () => {
    if (!alunoId || !vagaId) return;
    const [v, m, c] = await Promise.all([
      buscarVaga(vagaId),
      buscarMinhaCandidatura(alunoId, vagaId),
      listarCurriculos(alunoId),
    ]);
    setVaga(v);
    setMinha(m);
    setCurriculos(c);
    setEscolhido((atual) => atual ?? c[0]?.id ?? null);
    setCarregou(true);
  }, [alunoId, vagaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!perfil) return <p style={{ padding: "2.4rem" }}>Carregando...</p>;

  async function aoAnexar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo || !alunoId) return;
    setErro("");
    setOk("");
    setAnexando(true);
    const r = await enviarCurriculo(alunoId, arquivo);
    setAnexando(false);
    if (r.erro) {
      setErro(r.erro);
      return;
    }
    await carregar();
    if (r.id) setEscolhido(r.id);
  }

  async function enviar() {
    if (!alunoId || !vagaId || !escolhido) return;
    setErro("");
    setOk("");
    setEnviando(true);
    const msg = await candidatar(alunoId, vagaId, escolhido);
    setEnviando(false);
    if (msg) {
      setErro(msg);
      return;
    }
    setAberto(false);
    setOk("Candidatura enviada!");
    await carregar();
  }

  async function retirar() {
    if (!minha) return;
    if (!window.confirm("Retirar sua candidatura a esta vaga? Você poderá se candidatar de novo depois.")) return;
    setErro("");
    setOk("");
    const msg = await retirarCandidatura(minha.id);
    if (msg) {
      setErro(msg);
      return;
    }
    setOk("Candidatura retirada.");
    await carregar();
  }

  const voltar = (
    <Link href="/aluno" className={base.voltar}>
      <Icone nome="arrow_back" /> Início
    </Link>
  );

  if (!vagaId || (carregou && !vaga)) {
    return (
      <AppShell perfil={perfil}>
        {voltar}
        <p className={base.vazio}>Vaga não encontrada.</p>
      </AppShell>
    );
  }

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
                <span className={styles.vagaSub}>{vaga.empresa_nome}</span>
              </div>
              <span className={styles.selo}>{ROTULO_TIPO[vaga.tipo_estagio]}</span>
            </div>

            <div className={styles.meta}>
              <span className={styles.seloCinza}>{ROTULO_MODALIDADE[vaga.modalidade]}</span>
              {vaga.localizacao && <span className={styles.seloCinza}>{vaga.localizacao}</span>}
            </div>
            <span className={styles.bolsa}>{formatarBolsa(vaga.bolsa, vaga.remunerada)}</span>
            <p className={styles.descricao}>{vaga.descricao}</p>

            {vaga.palavras_chave.length > 0 && (
              <div className={styles.chips}>
                {vaga.palavras_chave.map((p) => (
                  <span key={p} className={styles.chip}>{p}</span>
                ))}
              </div>
            )}
          </section>

          {erro && <p className={base.erro}>{erro}</p>}
          {ok && <p className={base.ok}>{ok}</p>}

          {minha ? (
            <section className={styles.painel}>
              <div className={styles.vagaTopo}>
                <strong>Sua candidatura</strong>
                <span className={seloDoStatus(minha.status)}>{ROTULO_STATUS[minha.status]}</span>
              </div>
              <span className={base.data}>
                Enviada em {dataBR(minha.created_at)}
                {minha.curriculos ? ` com o currículo ${minha.curriculos.nome_arquivo}` : ""}
              </span>
              {minha.status === "enviada" && (
                <div>
                  <button type="button" className={base.botaoSec} onClick={retirar}>
                    <Icone nome="undo" /> Retirar candidatura
                  </button>
                </div>
              )}
            </section>
          ) : vaga.status === "encerrada" ? (
            <p className={base.vazio}>Esta vaga foi encerrada.</p>
          ) : !aberto ? (
            <button
              type="button"
              className={`${base.botao} ${styles.largo}`}
              style={{ marginTop: "1.6rem" }}
              onClick={() => setAberto(true)}
            >
              Candidatar-se
            </button>
          ) : (
            <section className={styles.painel}>
              <h3>Escolha o currículo</h3>

              {curriculos === null ? (
                <p className={base.vazio}>Carregando...</p>
              ) : curriculos.length === 0 ? (
                <p className={base.intro}>
                  Você ainda não tem currículo enviado. Anexe um PDF para se candidatar.
                </p>
              ) : (
                <div className={base.lista}>
                  {curriculos.map((c) => (
                    <label
                      key={c.id}
                      className={escolhido === c.id ? styles.escolhaAtiva : styles.escolha}
                    >
                      <input
                        type="radio"
                        name="curriculo"
                        checked={escolhido === c.id}
                        onChange={() => setEscolhido(c.id)}
                      />
                      <div className={styles.escolhaTexto}>
                        <strong>{c.nome_arquivo}</strong>
                        <span>
                          Enviado em {dataBR(c.created_at)}
                          {c.feedbacks.length > 0
                            ? ` · ${c.feedbacks.length} ${c.feedbacks.length === 1 ? "feedback" : "feedbacks"}`
                            : ""}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={aoAnexar} />
              <div>
                <button
                  type="button"
                  className={base.botaoSec}
                  disabled={anexando}
                  onClick={() => inputRef.current?.click()}
                >
                  <Icone nome="upload_file" /> {anexando ? "Enviando..." : "Anexar outro PDF"}
                </button>
              </div>

              <button
                type="button"
                className={`${base.botao} ${styles.largo}`}
                disabled={!escolhido || enviando}
                onClick={enviar}
              >
                {enviando ? "Enviando..." : "Enviar candidatura"}
              </button>

              <Link href="/aluno/curriculo" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                Ver feedbacks e melhorar meu currículo
              </Link>
            </section>
          )}
        </>
      )}
    </AppShell>
  );
}