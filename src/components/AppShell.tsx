"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icone from "@/components/Icone";
import type { Papel, Perfil } from "@/lib/auth";
import styles from "./AppShell.module.css";

const ABAS: Record<Papel, { href: string; nome: string; icone: string }[]> = {
  aluno: [
    { href: "/aluno", nome: "Início", icone: "home" },
    { href: "/aluno/curriculo", nome: "Currículo", icone: "description" },
  ],
  empresa: [
    { href: "/empresa", nome: "Início", icone: "home" },
    { href: "/empresa/curriculos", nome: "Currículos", icone: "description" },
  ],
  admin: [
    { href: "/admin", nome: "Início", icone: "home" },
    { href: "/admin/curriculos", nome: "Currículos", icone: "description" },
  ],
};

const AREA: Record<Papel, string> = {
  aluno: "Área do aluno",
  empresa: "Área da empresa",
  admin: "Painel administrativo",
};

export default function AppShell({
  perfil,
  children,
}: {
  perfil: Perfil;
  children: React.ReactNode;
}) {
  const caminho = (usePathname() ?? "").replace(/\/$/, "");
  const abas = ABAS[perfil.role];

  // A aba ativa é a de endereço mais longo que combina com a página atual
  const ativa = abas
    .filter((a) => caminho === a.href || caminho.startsWith(a.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const inicial = (perfil.nome || perfil.email || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      <header className={styles.cabecalho}>
        <div className={styles.marca}>
          <img src="/logo.svg" alt="" />
          <div className={styles.marcaTexto}>
            <span className={styles.marcaNome}>
              TEIA <span>Carreiras</span>
            </span>
            <span className={styles.marcaArea}>{AREA[perfil.role]}</span>
          </div>
        </div>
        <Link href="/perfil" className={styles.avatar} aria-label="Meu perfil">
          {inicial}
        </Link>
      </header>

      <main className={styles.conteudo}>{children}</main>

      <nav className={styles.nav} aria-label="Navegação principal">
        <div className={styles.navInterna}>
          {abas.map((aba) => (
            <Link
              key={aba.href}
              href={aba.href}
              className={`${styles.aba} ${ativa === aba.href ? styles.ativa : ""}`}
            >
              <Icone nome={aba.icone} />
              {aba.nome}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}