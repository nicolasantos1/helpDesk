import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/page-auth";
import { db } from "@/lib/db";
import { labels } from "@/lib/domain";
import { Form } from "@/components/forms";
const roles = ["USUARIO", "TECNICO", "ADMINISTRADOR"].map((x) => ({
  value: x,
  label: labels[x],
}));
export default async function Users() {
  const u = await requirePageUser();
  if (u.role !== "ADMINISTRADOR") redirect("/chamados");
  const users = await db.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      version: true,
    },
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ADMINISTRAÇÃO</p>
          <h1>Pessoas e acessos</h1>
          <p className="muted">
            Gerencie contas e mantenha as responsabilidades organizadas.
          </p>
        </div>
      </div>
      <section className="panel narrow">
        <h2>Cadastrar conta</h2>
        <Form
          endpoint="/api/users"
          extra={{ active: true }}
          fields={[
            { name: "name", label: "Nome" },
            { name: "email", label: "E-mail", type: "email" },
            { name: "role", label: "Perfil", options: roles },
            {
              name: "password",
              label: "Senha inicial (12 a 72 caracteres)",
              type: "password",
              minLength: 12,
            },
          ]}
        />
      </section>
      <section className="panel">
        <h2>Contas cadastradas</h2>
        {users.map((person) => (
          <details key={person.id}>
            <summary>
              <strong>{person.name}</strong>
              <span>
                {labels[person.role]} · {person.active ? "Ativa" : "Inativa"}
              </span>
            </summary>
            <Form
              endpoint={`/api/users/${person.id}`}
              extra={{ version: person.version }}
              fields={[
                { name: "name", label: "Nome", value: person.name },
                {
                  name: "email",
                  label: "E-mail",
                  type: "email",
                  value: person.email,
                },
                {
                  name: "role",
                  label: "Perfil",
                  value: person.role,
                  options: roles,
                },
                {
                  name: "active",
                  label: "Situação",
                  value: String(person.active),
                  options: [
                    { value: "true", label: "Ativa" },
                    { value: "false", label: "Inativa" },
                  ],
                },
              ]}
            />
          </details>
        ))}
      </section>
    </>
  );
}
