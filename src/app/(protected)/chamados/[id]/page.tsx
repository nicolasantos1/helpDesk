import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/page-auth";
import { readTicket } from "@/lib/service";
import { labels, AppError } from "@/lib/domain";
import { Form } from "@/components/forms";
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await requirePageUser(),
    id = Number((await params).id);
  if (!Number.isSafeInteger(id)) notFound();
  const t = await readTicket(u, id).catch((e) => {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  });
  const endpoint = `/api/tickets/${id}`,
    extra = { version: t.version };
  const working = ["EM_ATENDIMENTO", "AGUARDANDO"].includes(t.status),
    owner = u.role === "TECNICO" && u.id === t.technicianId;
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(d);
  return (
    <>
      <Link href="/chamados" className="back">
        ← Voltar aos chamados
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CHAMADO #{String(id).padStart(4, "0")}</p>
          <h1>{t.title}</h1>
          <p className="muted">
            Aberto em {fmt(t.createdAt)} por {t.requester.name}
          </p>
        </div>
        <span className={"badge " + t.status}>{labels[t.status]}</span>
      </div>
      <div className="detail-grid">
        <div>
          <section className="panel">
            <h2>Descrição da solicitação</h2>
            <p className="preserve">{t.description}</p>
            <div className="metadata">
              <div>
                Categoria<strong>{t.category.name}</strong>
              </div>
              <div>
                Prioridade<strong>{labels[t.priority]}</strong>
              </div>
              <div>
                Responsável
                <strong>{t.technician?.name ?? "Não atribuído"}</strong>
              </div>
              {t.closedAt && (
                <div>
                  Encerramento<strong>{fmt(t.closedAt)}</strong>
                </div>
              )}
            </div>
          </section>
          {t.solution && (
            <section className="panel solution">
              <h2>✓ Solução registrada</h2>
              <p className="preserve">{t.solution.description}</p>
              <small>{fmt(t.solution.createdAt)}</small>
            </section>
          )}
          <section className="panel">
            <h2>Histórico do atendimento</h2>
            <ol className="timeline">
              {t.history.map((h) => (
                <li key={h.id}>
                  <strong>{h.author.name}</strong>
                  <small>
                    {fmt(h.createdAt)} · {labels[h.newStatus]}
                  </small>
                  <p className="preserve">{h.description}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <section className="panel actions">
          <p className="eyebrow">ATENDIMENTO</p>
          <h2>Próximos passos</h2>
          {u.role === "TECNICO" && t.status === "ABERTO" && !t.technicianId && (
            <Form
              endpoint={endpoint}
              extra={{ ...extra, action: "claim" }}
              fields={[]}
              label="Assumir chamado"
            />
          )}
          {owner && working && (
            <>
              <Form
                endpoint={endpoint}
                extra={{ ...extra, action: "status" }}
                fields={[
                  {
                    name: "status",
                    label: "Status",
                    value: t.status,
                    options: ["EM_ATENDIMENTO", "AGUARDANDO"].map((x) => ({
                      value: x,
                      label: labels[x],
                    })),
                  },
                ]}
                label="Atualizar status"
              />
              <hr />
              <Form
                endpoint={endpoint}
                extra={{ ...extra, action: "priority" }}
                fields={[
                  {
                    name: "priority",
                    label: "Prioridade",
                    value: t.priority,
                    options: ["BAIXA", "MEDIA", "ALTA"].map((x) => ({
                      value: x,
                      label: labels[x],
                    })),
                  },
                ]}
                label="Definir prioridade"
              />
              <hr />
              <Form
                endpoint={endpoint}
                extra={{ ...extra, action: "solve" }}
                fields={[
                  {
                    name: "description",
                    label: "Solução aplicada",
                    type: "textarea",
                  },
                ]}
                label="Registrar solução"
              />
            </>
          )}
          {owner && t.status === "SOLUCIONADO" && (
            <Form
              endpoint={endpoint}
              extra={{ ...extra, action: "close" }}
              fields={[
                {
                  name: "confirmed",
                  label: "Confirma o encerramento definitivo?",
                  options: [
                    { value: "", label: "Selecione para confirmar" },
                    { value: "yes", label: "Sim, encerrar chamado" },
                  ],
                },
              ]}
              label="Encerrar chamado"
            />
          )}
          {(!owner || t.status === "FECHADO") &&
            !(u.role === "TECNICO" && t.status === "ABERTO") && (
              <p className="muted">
                {t.status === "FECHADO"
                  ? "Atendimento finalizado. Histórico preservado para consulta."
                  : "Acompanhe o andamento e as atualizações no histórico."}
              </p>
            )}
        </section>
      </div>
    </>
  );
}
