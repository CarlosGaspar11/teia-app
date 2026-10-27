import Icone from "@/components/Icone";
import styles from "./EmConstrucao.module.css";

export default function EmConstrucao({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <section>
      <h1 className={styles.titulo}>{titulo}</h1>
      <div className={styles.caixa}>
        <Icone nome="construction" />
        <p>{texto ?? "Esta tela está em construção."}</p>
      </div>
    </section>
  );
}