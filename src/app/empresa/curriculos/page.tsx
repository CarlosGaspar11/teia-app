"use client";

import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import EmConstrucao from "@/components/EmConstrucao";

export default function CurriculosEmpresaPage() {
  const perfil = usePerfil("empresa");
  if (!perfil) return <p>Carregando...</p>;

  return (
    <AppShell perfil={perfil}>
      <EmConstrucao titulo="Currículos" texto="O painel da empresa (vagas e candidatos) será montado aqui." />
    </AppShell>
  );
}