"use client";

import { usePerfil } from "@/lib/usePerfil";
import BotaoSair from "@/components/BotaoSair";

export default function AlunoPage() {
  const perfil = usePerfil("aluno");
  if (!perfil) return <p style={{ padding: "2.4rem" }}>Carregando...</p>;

  return (
    <main>
      <h1>Olá, {perfil.nome}!</h1>
      <p>Tela do aluno</p>
      <BotaoSair />
    </main>
  );
}