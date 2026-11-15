import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePageUser } from "@/lib/page-auth";
import { db } from "@/lib/db";
import { Form } from "@/components/forms";
export default async function NewTicket() {
  const u = await requirePageUser();
  if (u.role !== "USUARIO") redirect("/chamados");
  const categories = await db.category.findMany();
  return (
    <>
      <Link href="/chamados" className="back">
        ← Voltar aos chamados
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">NOVA SOLICITAÇÃO</p>
          <h1>Como podemos ajudar?</h1>
          <p className="muted">
            Conte o que aconteceu para nossa equipe encontrar a melhor solução.
          </p>
        </div>
      </div>
      <section className="panel narrow">
        <h2>Informações do chamado</h2>
        <Form
          endpoint="/api/tickets"
          redirect="ticket"
          label="Abrir chamado →"
          fields={[
            { name: "title", label: "Título", minLength: 3, maxLength: 160 },
            {
              name: "categoryId",
              label: "Categoria",
              options: [
                { value: "", label: "Selecione uma categoria" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ],
            },
            {
              name: "description",
              label: "Descrição do problema",
              type: "textarea",
              minLength: 10,
            },
          ]}
        />
        <p className="muted">
          Seu chamado será aberto com prioridade média. Um técnico avaliará a
          urgência.
        </p>
      </section>
    </>
  );
}
