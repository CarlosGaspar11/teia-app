"use client";

import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import BotaoSair from "@/components/BotaoSair";
import Icone from "@/components/Icone";
import styles from "./perfil.module.css";

const TIPOS = { aluno: "Aluno", empresa: "Empresa", admin: "Administrador" };

export default function PerfilPage() {
  const perfil = usePerfil();
  if (!perfil) return <p className={styles.carregando}>Carregando...</p>;

  const inicial = (perfil.nome || perfil.email || "?").trim().charAt(0).toUpperCase();

  return (
    <AppShell perfil={perfil}>
      <h1 className={styles.titulo}>Meu perfil</h1>

      <section className={styles.topo}>
        <div className={styles.avatar}>{inicial}</div>
        <h2>{perfil.nome || "Sem nome"}</h2>
        <span className={styles.selo}>{TIPOS[perfil.role]}</span>
      </section>

      <ul className={styles.dados}>
        <li>
          <Icone nome="person" />
          <div>
            <span>Nome</span>
            <strong>{perfil.nome || "-"}</strong>
          </div>
        </li>
        <li>
          <Icone nome="mail" />
          <div>
            <span>E-mail</span>
            <strong>{perfil.email || "-"}</strong>
          </div>
        </li>
        <li>
          <Icone nome="badge" />
          <div>
            <span>Tipo de conta</span>
            <strong>{TIPOS[perfil.role]}</strong>
          </div>
        </li>
      </ul>

      <BotaoSair className={styles.sair} />
    </AppShell>
  );
}