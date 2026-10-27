"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import Icone from "@/components/Icone";
import { dataBR } from "@/lib/curriculos";
import { buscarEmpresa } from "@/lib/admin";
import {
  formatarBolsa,
  listarMinhasVagas,
  ROTULO_MODALIDADE,
  ROTULO_TIPO,
  type VagaComTotal,
} from "@/lib/vagas";
import base from "@/styles/curriculos.module.css";
import styles from "@/styles/vagas.module.css";

type Filtro = "todas" | "aberta" | "encerrada";

function normalizar(t: string) {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function DetalheEmpresaPage() {
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
  const empresaId = useSearchParams().get("id");

  const [empresa, setEmpresa] = useState<{ nome: string; email: string | null } | null>(null);
  const [vagas, setVagas] = useState<VagaComTotal[] | null>(null);
  const [carregou, setCarregou] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busca, setBusca] = useState("");
  const [expandida, setExpandida] = useState<string | null>(null);

  useEffect(() => {
    if (!adminId || !empresaId) return;
    Promise.all([buscarEmpresa(empresaId), listarMinhasVagas(empresaId)]).then(([e, v]) => {
      setEmpresa(e);
      setVagas(v);
      setCarregou(true);
    });
  }, [adminId, empresaId]);

  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim());
    return (vagas ?? []).filter(
      (v) =>
        (filtro === "todas" || v.status === filtro) &&
        (!termo || normalizar(v.titulo).includes(termo))
    );
  }, [vagas, filtro, busca]);

  if (!perfil) return <p style={{ padding: "2.4rem" }}>Carregando...</p>;

  const voltar = (
    <Link href="/admin/empresas" className={base.voltar}>
      <Icone nome="arrow_back" /> Empresas
    </Link>
  );

  if (!empresaId || (carregou && !empresa)) {
    return (
      <AppShell perfil={perfil}>
        {voltar}
        <p className={base.vazio}>Empresa não encontrada.</p>
      </AppShell>
    );
  }

  const total = vagas?.length ?? 0;
  const abertas = vagas?.filter((v) => v.status === "aberta").length ?? 0;
  const encerradas = total - abertas;

  const FILTROS: { id: Filtro; nome: string }[] = [
    { id: "todas", nome: `Todas (${total})` },
    { id: "aberta", nome: `Abertas (${abertas})` },
    { id: "encerrada", nome: `Encerradas (${encerradas})` },
  ];

  return (
    <AppShell perfil={perfil}>
      {voltar}
      <h1 className={base.titulo}>{empresa?.nome || "Empresa"}</h1>
      <p className={base.intro}>{empresa?.email}</p>

      <div className={styles.opcoes}>
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={filtro === f.id ? styles.opcaoAtiva : styles.opcao}
            onClick={() => setFiltro(f.id)}
          >
            {f.nome}
          </button>
        ))}
      </div>

      <label className={base.busca} style={{ marginTop: "1.2rem" }}>
        <Icone nome="search" />
        <input
          type="search"
          placeholder="Buscar vaga pelo título"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </label>

      <div className={base.lista} style={{ marginTop: "1.6rem" }}>
        {vagas === null ? (
          <p className={base.vazio}>Carregando...</p>
        ) : filtradas.length === 0 ? (
          <p className={base.vazio}>
            {total === 0 ? "Esta empresa ainda não publicou vagas." : "Nenhuma vaga com esse filtro."}
          </p>
        ) : (
          filtradas.map((v) => {
            const candidatos = v.candidaturas?.[0]?.count ?? 0;
            const aberta = expandida === v.id;
            return (
              <article key={v.id} className={styles.vaga}>
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
                  <span className={styles.bolsa}>{formatarBolsa(v.bolsa, v.remunerada)}</span>
                  <span>
                    {candidatos} {candidatos === 1 ? "candidato" : "candidatos"}
                  </span>
                </div>

                <div>
                  <button
                    type="button"
                    className={base.botaoSec}
                    onClick={() => setExpandida(aberta ? null : v.id)}
                  >
                    <Icone nome={aberta ? "expand_less" : "expand_more"} />
                    {aberta ? "Ocultar detalhes" : "Ver detalhes"}
                  </button>
                </div>

                {aberta && (
                  <>
                    <p className={styles.descricao}>{v.descricao || "Sem descrição."}</p>

                    {v.palavras_chave.length > 0 && (
                      <div className={styles.chips}>
                        {v.palavras_chave.map((p) => (
                          <span key={p} className={styles.chip}>{p}</span>
                        ))}
                      </div>
                    )}

                    <span className={base.data}>Publicada em {dataBR(v.created_at)}</span>
                  </>
                )}
              </article>
            );
          })
        )}
      </div>
    </AppShell>
  );
}