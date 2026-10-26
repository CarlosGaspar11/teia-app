"use client";

import { usePerfil } from "@/lib/usePerfil";
import BotaoSair from "@/components/BotaoSair";

export default function AdminPage() {
  const perfil = usePerfil("admin");
  if (!perfil) return <p style={{ padding: "2.4rem" }}>Carregando...</p>;

  return (
    <main>
      <h1>Olá, {perfil.nome}!</h1>
      <p>Tela do admin</p>
      <BotaoSair />
    </main>
  );
}