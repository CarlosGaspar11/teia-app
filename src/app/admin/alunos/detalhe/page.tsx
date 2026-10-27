"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import Icone from "@/components/Icone";
import {
  abrirCurriculo,
  buscarAluno,
  dataBR,
  enviarFeedback,
  listarCurriculos,
  type Curriculo,
} from "@/lib/curriculos";
import styles from "@/styles/curriculos.module.css";

export default function DetalheAlunoPage() {
  // useSearchParams precisa estar dentro de um Suspense no export estático
  return (
    <Suspense fallback={<p style={{ padding: "2.4rem" }}>Carregando...</p>}>
      <Detalhe />
    </Suspense>
  );
}

function Detalhe() {
  const perfil = usePerfil("admin");
  const adminId = perfil?.id;
  const alunoId = useSearchParams().get("id");

  const [aluno, setAluno] = useState<{ nome: string; email: string | null } | null>(null);
  const [lista, setLista] = useState<Curriculo[] | null>(null);
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!adminId || !alunoId) return;
    const [a, c] = await Promise.all([buscarAluno(alunoId), listarCurriculos(alunoId)]);
    setAluno(a);
    setLista(c);
  }, [adminId, alunoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!perfil) return <p style={{ padding: "2.4rem" }}>Carregando...</p>;

  async function abrir(c: Curriculo) {
    const msg = await abrirCurriculo(c.arquivo_path);
    if (msg) setErro(msg);
  }

  async function enviar(c: Curriculo) {
    const texto = (rascunhos[c.id] ?? "").trim();
    if (!texto) {
      setErro("Escreva o feedback antes de enviar.");
      return;
    }
    setErro("");
    setEnviandoId(c.id);
    const msg = await enviarFeedback(c.id, texto);
    setEnviandoId(null);
    if (msg) {
      setErro(msg);
      return;
    }
    setRascunhos((r) => ({ ...r, [c.id]: "" }));
    await carregar();
  }

  return (
    <AppShell perfil={perfil}>
      <Link href="/admin/alunos" className={styles.voltar}>
        <Icone nome="arrow_back" /> Alunos
      </Link>

      {!alunoId ? (
        <p className={styles.vazio}>Aluno não informado.</p>
      ) : (
        <>
          <h1 className={styles.titulo}>{aluno?.nome || "Aluno"}</h1>
          <p className={styles.intro}>{aluno?.email}</p>

          {erro && <p className={styles.erro}>{erro}</p>}

          {lista === null ? (
            <p className={styles.vazio}>Carregando...</p>
          ) : lista.length === 0 ? (
            <p className={styles.vazio}>Este aluno ainda não enviou currículos.</p>
          ) : (
            <div className={styles.lista}>
              {lista.map((c) => (
                <article key={c.id} className={styles.cartao}>
                  <div className={styles.topoCurriculo}>
                    <Icone nome="description" />
                    <div className={styles.infoCurriculo}>
                      <span className={styles.nomeArquivo}>{c.nome_arquivo}</span>
                      <span className={styles.data}>Enviado em {dataBR(c.created_at)}</span>
                    </div>
                  </div>

                  <div className={styles.acoes}>
                    <button type="button" className={styles.botaoSec} onClick={() => abrir(c)}>
                      <Icone nome="open_in_new" /> Abrir PDF
                    </button>
                  </div>

                  <div className={styles.feedbacks}>
                    <h3>Feedbacks</h3>
                    {c.feedbacks.length === 0 ? (
                      <p className={styles.semFeedback}>Nenhum feedback ainda.</p>
                    ) : (
                      c.feedbacks.map((f) => (
                        <div key={f.id} className={styles.feedback}>
                          {f.texto}
                          <small>{dataBR(f.created_at)}</small>
                        </div>
                      ))
                    )}

                    <textarea
                      className={styles.textarea}
                      placeholder="Escreva um feedback sobre este currículo..."
                      maxLength={2000}
                      value={rascunhos[c.id] ?? ""}
                      onChange={(e) => setRascunhos((r) => ({ ...r, [c.id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      className={styles.botao}
                      disabled={enviandoId === c.id}
                      onClick={() => enviar(c)}
                    >
                      {enviandoId === c.id ? "Enviando..." : "Enviar feedback"}
                    </button>
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