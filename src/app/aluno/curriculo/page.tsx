"use client";

import { usePerfil } from "@/lib/usePerfil";
import AppShell from "@/components/AppShell";
import EmConstrucao from "@/components/EmConstrucao";

export default function CurriculoAlunoPage() {
  const perfil = usePerfil("aluno");
  if (!perfil) return <p>Carregando...</p>;

  return (
    <AppShell perfil={perfil}>
      <EmConstrucao titulo="Meu currículo" texto="Aqui o aluno vai criar ou enviar o currículo e ver o feedback." />
    </AppShell>
  );
}