"use client";

import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import EmConstrucao from "@/components/EmConstrucao";

export default function AdminPage() {
  const perfil = usePerfil("admin");
  if (!perfil) return <p>Carregando...</p>;

  return (
    <AppShell perfil={perfil}>
      <EmConstrucao titulo={`Olá, ${perfil.nome}`} texto="O painel administrativo será montado aqui." />
    </AppShell>
  );
}