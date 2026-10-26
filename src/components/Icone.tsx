export default function Icone({ nome }: { nome: string }) {
  return (
    <span className="material-symbols-outlined" aria-hidden="true">
      {nome}
    </span>
  );
}