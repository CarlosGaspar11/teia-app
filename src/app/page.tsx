"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { buscarPerfil, type Perfil } from "@/lib/auth";
import styles from "./splash.module.css";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    let ativo = true;
    const inicio = Date.now();

    // Se a verificação demorar mais de 4s, segue como "sem login"
    const limite = new Promise<Perfil | null>((resolve) =>
      setTimeout(() => resolve(null), 4000)
    );

    Promise.race([buscarPerfil(), limite]).then((p) => {
      if (!ativo) return;
      const espera = Math.max(0, 1500 - (Date.now() - inicio));
      setTimeout(() => {
        if (ativo) router.replace(p ? `/${p.role}` : "/login");
      }, espera);
    });

    return () => {
      ativo = false;
    };
  }, [router]);

  return (
    <main className={styles.splash}>
      <img src="/logo.svg" alt="TEIA Carreiras" className={styles.logo} />
    </main>
  );
}