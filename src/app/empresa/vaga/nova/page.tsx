"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import Icone from "@/components/Icone";
import { criarVaga, separarPalavras, type Modalidade, type TipoEstagio } from "@/lib/vagas";
import base from "@/styles/curriculos.module.css";
import styles from "@/styles/vagas.module.css";

const MODALIDADES: { id: Modalidade; nome: string }[] = [
  { id: "presencial", nome: "Presencial" },
  { id: "hibrido", nome: "Híbrido" },
  { id: "remoto", nome: "Remoto" },
];

export default function NovaVagaPage() {
  const router = useRouter();
  const perfil = usePerfil("empresa");
  const empresaId = perfil?.id;

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoEstagio>("nao_obrigatorio");
  const [modalidade, setModalidade] = useState<Modalidade>("presencial");
  const [localizacao, setLocalizacao] = useState("");
  const [bolsa, setBolsa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [palavras, setPalavras] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [remunerada, setRemunerada] = useState(true);

  if (!perfil) return <p style={{ padding: "2.4rem" }}>Carregando...</p>;

async function publicar(e: React.FormEvent) {
  e.preventDefault();
  if (!empresaId) return;

  if (titulo.trim().length < 3) {
    setErro("Informe o título da vaga.");
    return;
  }
  if (!descricao.trim()) {
    setErro("Descreva a vaga.");
    return;
  }

  let valor: number | null = null;
  const texto = bolsa.trim();
  if (remunerada && texto) {
    valor = texto.includes(",") ? Number(texto.replace(/\./g, "").replace(",", ".")) : Number(texto);
    if (!Number.isFinite(valor) || valor < 0) {
      setErro("Informe a bolsa só com números, por exemplo 1500 ou 1500,50.");
      return;
    }
  }

  setErro("");
  setEnviando(true);
  const msg = await criarVaga(empresaId, {
    titulo: titulo.trim(),
    descricao: descricao.trim(),
    tipo_estagio: tipo,
    modalidade,
    localizacao: localizacao.trim(),
    remunerada,
    bolsa: remunerada ? valor : null,
    palavras_chave: separarPalavras(palavras),
  });
  setEnviando(false);

  if (msg) {
    setErro(msg);
    return;
  }
  router.replace("/empresa");
}

  return (
    <AppShell perfil={perfil}>
      <Link href="/empresa" className={base.voltar}>
        <Icone nome="arrow_back" /> Minhas vagas
      </Link>
      <h1 className={base.titulo}>Nova vaga</h1>
      <p className={base.intro}>Preencha os dados para os alunos verem a vaga.</p>

      <form className={styles.form} onSubmit={publicar}>
        <div className={styles.grupo}>
          <label className={styles.rotulo} htmlFor="titulo">Título da vaga</label>
          <input
            id="titulo"
            className={styles.entrada}
            placeholder="Ex.: Estágio em Desenvolvimento Web"
            maxLength={120}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>

        <div className={styles.grupo}>
          <span className={styles.rotulo}>Tipo de estágio</span>
          <div className={styles.opcoes}>
            <button
            type="button"
            className={tipo === "nao_obrigatorio" ? styles.opcaoAtiva : styles.opcao}
            onClick={() => {
                setTipo("nao_obrigatorio");
                setRemunerada(true);
            }}
            >
            Não obrigatório
            </button>
            <button
              type="button"
              className={tipo === "obrigatorio" ? styles.opcaoAtiva : styles.opcao}
              onClick={() => setTipo("obrigatorio")}
            >
              Obrigatório
            </button>
          </div>
          <span className={styles.dica}>
            No estágio obrigatório, os candidatos aparecem na ordem de envio.
          </span>
        </div>

        <div className={styles.grupo}>
          <span className={styles.rotulo}>Modalidade</span>
          <div className={styles.opcoes}>
            {MODALIDADES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={modalidade === m.id ? styles.opcaoAtiva : styles.opcao}
                onClick={() => setModalidade(m.id)}
              >
                {m.nome}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grupo}>
          <label className={styles.rotulo} htmlFor="local">Local</label>
          <input
            id="local"
            className={styles.entrada}
            placeholder="Ex.: São Luís, MA"
            value={localizacao}
            onChange={(e) => setLocalizacao(e.target.value)}
          />
        </div>

        <div className={styles.grupo}>
          <span className={styles.rotulo}>Remuneração</span>
          <div className={styles.opcoes}>
            <button
              type="button"
              className={remunerada ? styles.opcaoAtiva : styles.opcao}
              onClick={() => setRemunerada(true)}
            >
              Remunerada
            </button>
            <button
              type="button"
              className={!remunerada ? styles.opcaoAtiva : styles.opcao}
              onClick={() => setRemunerada(false)}
            >
              Não remunerada
            </button>
          </div>
          {tipo === "nao_obrigatorio" && (
            <span className={styles.dica}>
              No estágio não obrigatório a bolsa é obrigatória (Lei nº 11.788/2008).
            </span>
          )}
        </div>

        {remunerada && (
          <div className={styles.grupo}>
            <label className={styles.rotulo} htmlFor="bolsa">Bolsa (R$ por mês)</label>
            <input
              id="bolsa"
              className={styles.entrada}
              inputMode="decimal"
              placeholder="Ex.: 1500 ou 1500,50"
              value={bolsa}
              onChange={(e) => setBolsa(e.target.value)}
            />
            <span className={styles.dica}>Deixe em branco para "a combinar".</span>
          </div>
        )}

        <div className={styles.grupo}>
          <label className={styles.rotulo} htmlFor="descricao">Descrição</label>
          <textarea
            id="descricao"
            className={`${styles.entrada} ${styles.area}`}
            placeholder="Atividades, requisitos e benefícios da vaga..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div className={styles.grupo}>
          <label className={styles.rotulo} htmlFor="palavras">Palavras-chave</label>
          <input
            id="palavras"
            className={styles.entrada}
            placeholder="Ex.: react, sql, git"
            value={palavras}
            onChange={(e) => setPalavras(e.target.value)}
          />
          <span className={styles.dica}>
            Separe por vírgula. Serão usadas para comparar com os currículos.
          </span>
        </div>

        {erro && <p className={base.erro}>{erro}</p>}

        <button type="submit" className={`${base.botao} ${styles.largo}`} disabled={enviando}>
          {enviando ? "Publicando..." : "Publicar vaga"}
        </button>
      </form>
    </AppShell>
  );
}