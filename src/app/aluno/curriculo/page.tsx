"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import Icone from "@/components/Icone";
import {
  abrirCurriculo,
  apagarCurriculo,
  dataBR,
  enviarCurriculo,
  listarCurriculos,
  vagasDoCurriculo,
  type Curriculo,
} from "@/lib/curriculos";
import styles from "@/styles/curriculos.module.css";

export default function CurriculoAlunoPage() {
  const perfil = usePerfil("aluno");
  const alunoId = perfil?.id;
  const inputRef = useRef<HTMLInputElement>(null);
  const versaoDeRef = useRef<string | null>(null);
  const [lista, setLista] = useState<Curriculo[] | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  const carregar = useCallback(async () => {
    if (!alunoId) return;
    setLista(await listarCurriculos(alunoId));
  }, [alunoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!perfil) return <p style={{ padding: "2.4rem" }}>Carregando...</p>;

  // anteriorId = id do currículo que está sendo corrigido (ou null para um currículo novo)
  function escolherArquivo(anteriorId: string | null) {
    versaoDeRef.current = anteriorId;
    inputRef.current?.click();
  }

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    const anterior = versaoDeRef.current;
    versaoDeRef.current = null;
    if (!arquivo || !alunoId) return;

    setErro("");
    setOk("");
    setEnviando(true);
    const r = await enviarCurriculo(alunoId, arquivo, anterior);
    setEnviando(false);
    if (r.erro) {
      setErro(r.erro);
      return;
    }
    setOk(anterior ? "Nova versão enviada!" : "Currículo enviado com sucesso!");
    await carregar();
  }

  async function abrir(c: Curriculo) {
    const msg = await abrirCurriculo(c.arquivo_path);
    if (msg) setErro(msg);
  }

  async function apagar(c: Curriculo) {
    setErro("");
    setOk("");

    const vagas = await vagasDoCurriculo(c.id);
    let aviso = "Apagar este currículo e os feedbacks dele?";

    if (vagas.length > 0) {
      const itens = vagas.map((v) => `• ${v.titulo} (${v.empresa_nome})`).join("\n");
      const plural = vagas.length > 1;
      aviso =
        `Este currículo foi enviado para ${plural ? "as vagas" : "a vaga"}:\n${itens}\n\n` +
        `Se você apagar, ${plural ? "as candidaturas serão retiradas" : "a candidatura será retirada"} ` +
        `e a empresa deixará de ver o seu currículo. Os feedbacks dele também serão apagados.\n\n` +
        `Deseja apagar mesmo assim?`;
    }

    if (!window.confirm(aviso)) return;

    const msg = await apagarCurriculo(c);
    if (msg) setErro(msg);
    else await carregar();
  }

  return (
    <AppShell perfil={perfil}>
      <h1 className={styles.titulo}>Meu currículo</h1>
      <p className={styles.intro}>Envie seu currículo em PDF e veja o feedback da equipe do TEIA.</p>

      <section className={`${styles.cartao} ${styles.envio}`}>
        <Icone nome="upload_file" />
        <p>Arquivo PDF de até 5 MB</p>
        <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={aoEscolher} />
        <button
          type="button"
          className={styles.botao}
          disabled={enviando}
          onClick={() => escolherArquivo(null)}
        >
          {enviando ? "Enviando..." : "Escolher PDF"}
        </button>
        {erro && <p className={styles.erro}>{erro}</p>}
        {ok && <p className={styles.ok}>{ok}</p>}
      </section>

      <h2 className={styles.secaoTitulo}>Currículos enviados</h2>

      {lista === null ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : lista.length === 0 ? (
        <p className={styles.vazio}>Você ainda não enviou nenhum currículo.</p>
      ) : (
        <div className={styles.lista}>
          {lista.map((c) => {
            const usos = c.candidaturas?.[0]?.count ?? 0;
            const anterior = lista.find((x) => x.id === c.curriculo_anterior_id);
            return (
              <article key={c.id} className={styles.cartao}>
                <div className={styles.topoCurriculo}>
                  <Icone nome="description" />
                  <div className={styles.infoCurriculo}>
                    <span className={styles.nomeArquivo}>{c.nome_arquivo}</span>
                    <span className={styles.data}>Enviado em {dataBR(c.created_at)}</span>
                    {anterior && (
                      <span className={styles.data} style={{ display: "block" }}>
                        Nova versão de {anterior.nome_arquivo}
                      </span>
                    )}
                    {usos > 0 && (
                      <div>
                        <span className={styles.uso}>
                          Enviado para {usos} {usos === 1 ? "vaga" : "vagas"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.acoes}>
                  <button type="button" className={styles.botaoSec} onClick={() => abrir(c)}>
                    <Icone nome="open_in_new" /> Abrir
                  </button>
                  <button
                    type="button"
                    className={styles.botaoSec}
                    disabled={enviando}
                    onClick={() => escolherArquivo(c.id)}
                  >
                    <Icone nome="upload_file" /> Nova versão
                  </button>
                  <button type="button" className={styles.botaoSec} onClick={() => apagar(c)}>
                    <Icone nome="delete" /> Apagar
                  </button>
                </div>

                <div className={styles.feedbacks}>
                  <h3>Feedback da equipe</h3>
                  {c.feedbacks.length === 0 ? (
                    <p className={styles.semFeedback}>Ainda sem feedback.</p>
                  ) : (
                    <>
                      {c.feedbacks.map((f) => (
                        <div key={f.id} className={styles.feedback}>
                          {f.texto}
                          <small>{dataBR(f.created_at)}</small>
                        </div>
                      ))}
                      <p className={styles.semFeedback}>
                        Ajustou o currículo? Toque em <strong>Nova versão</strong> para enviar a corrigida.
                      </p>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}