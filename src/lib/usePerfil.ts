"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { buscarPerfil, type Papel, type Perfil } from "@/lib/auth";

export function usePerfil(papel: Papel): Perfil | null {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  const carregar = useCallback(async () => {
    const p = await buscarPerfil();
    if (!p) router.replace("/login");
    else if (p.role !== papel) router.replace(`/${p.role}`);
    else setPerfil(p);
  }, [papel, router]);

  useEffect(() => {
    carregar();

    // Se a sessão terminar (logout em outra aba, por exemplo), volta ao login
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") setTimeout(() => router.replace("/login"), 0);
    });

    // Ao voltar para a aba, recarrega o perfil
    const aoVoltar = () => {
      if (document.visibilityState === "visible") carregar();
    };
    document.addEventListener("visibilitychange", aoVoltar);

    return () => {
      data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [carregar, router]);

  return perfil;
}