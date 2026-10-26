"use client";

import { useRouter } from "next/navigation";
import { sairDaConta } from "@/lib/auth";

export default function BotaoSair() {
  const router = useRouter();

  async function sair() {
    await sairDaConta();
    router.replace("/login");
  }

  return (
    <button type="button" onClick={sair}>
      Sair
    </button>
  );
}