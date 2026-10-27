"use client";

import { useRouter } from "next/navigation";
import Icone from "@/components/Icone";
import { sairDaConta } from "@/lib/auth";

export default function BotaoSair({ className }: { className?: string }) {
  const router = useRouter();

  async function sair() {
    await sairDaConta();
    router.replace("/login");
  }

  return (
    <button type="button" className={className} onClick={sair}>
      <Icone nome="logout" /> Sair da conta
    </button>
  );
}