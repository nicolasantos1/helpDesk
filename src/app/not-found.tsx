import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty">
      <h1>Página ou chamado indisponível</h1>
      <p>Confira o endereço ou sua permissão de acesso.</p>
      <Link className="button" href="/chamados">
        Voltar aos chamados
      </Link>
    </main>
  );
}
