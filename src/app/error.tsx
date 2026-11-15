"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty">
      <h1>Não foi possível carregar</h1>
      <p>O serviço está temporariamente indisponível.</p>
      <button onClick={reset}>Tentar novamente</button>
    </main>
  );
}
