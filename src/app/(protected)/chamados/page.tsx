import Link from "next/link";
import { requirePageUser } from "@/lib/page-auth";
import { db } from "@/lib/db";
import { listTickets } from "@/lib/service";
import { labels } from "@/lib/domain";
export default async function Tickets({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const u = await requirePageUser(),
    filters = await searchParams,
    tickets = await listTickets(u, filters),
    categories = await db.category.findMany();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">VISÃO GERAL</p>
          <h1>
            {u.role === "TECNICO"
              ? "Fila de atendimento"
              : u.role === "USUARIO"
                ? "Meus chamados"
                : "Todos os chamados"}
          </h1>
          <p className="muted">
            {u.role === "USUARIO"
              ? "Acompanhe suas solicitações de suporte."
              : "Organize a demanda e acompanhe cada atendimento."}
          </p>
        </div>
        {u.role === "USUARIO" && (
          <Link className="button" href="/chamados/novo">
            ＋ Novo chamado
          </Link>
        )}
      </div>
      <div className="stats">
        {[
          ["Solicitações exibidas", tickets.length],
          ["Em aberto", tickets.filter((t) => t.status === "ABERTO").length],
          [
            "Em andamento",
            tickets.filter((t) =>
              ["EM_ATENDIMENTO", "AGUARDANDO"].includes(t.status),
            ).length,
          ],
          [
            "Concluídas",
            tickets.filter((t) => ["SOLUCIONADO", "FECHADO"].includes(t.status))
              .length,
          ],
        ].map(([label, value], i) => (
          <div className="stat" key={label}>
            <span className={"stat-icon tone" + i}>
              {["▤", "◷", "↗", "✓"][i]}
            </span>
            <p>
              {label}
              <strong>{value}</strong>
            </p>
          </div>
        ))}
      </div>
      <section className="panel">
        <div className="panel-title">
          <h2>Solicitações</h2>
          <span className="muted">
            {tickets.length} resultados · limite de 200
          </span>
        </div>
        <form className="filters">
          <label>
            Buscar
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Número ou título…"
            />
          </label>
          <label>
            Status
            <select name="status" defaultValue={filters.status}>
              <option value="">Todos os status</option>
              {[
                "ABERTO",
                "EM_ATENDIMENTO",
                "AGUARDANDO",
                "SOLUCIONADO",
                "FECHADO",
              ].map((x) => (
                <option key={x} value={x}>
                  {labels[x]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prioridade
            <select name="priority" defaultValue={filters.priority}>
              <option value="">Todas</option>
              {["BAIXA", "MEDIA", "ALTA"].map((x) => (
                <option key={x} value={x}>
                  {labels[x]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Categoria
            <select name="categoryId" defaultValue={filters.categoryId}>
              <option value="">Todas</option>
              {categories.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          {u.role === "TECNICO" && (
            <label>
              Visualização
              <select name="queue" defaultValue={filters.queue}>
                <option value="">Todos</option>
                <option value="available">Disponíveis</option>
                <option value="mine">Meus atendimentos</option>
              </select>
            </label>
          )}
          <button>Filtrar</button>
          <Link className="muted" href="/chamados">
            Limpar
          </Link>
        </form>
        <div className="ticket-list">
          {tickets.length === 0 ? (
            <div className="empty">
              ▤<h3>Nenhum chamado por aqui</h3>
              <p>
                Novas solicitações aparecerão nesta lista. Revise os filtros ou
                abra um chamado.
              </p>
            </div>
          ) : (
            tickets.map((t) => (
              <Link
                className="ticket-row"
                href={`/chamados/${t.id}`}
                key={t.id}
              >
                <span className="ticket-number">
                  #{String(t.id).padStart(4, "0")}
                </span>
                <div className="ticket-name">
                  <strong>{t.title}</strong>
                  <small>
                    {t.category.name} ·{" "}
                    {new Intl.DateTimeFormat("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    }).format(t.createdAt)}
                  </small>
                </div>
                <span className={"badge " + t.status}>{labels[t.status]}</span>
                <span className={"priority " + t.priority}>
                  ● {labels[t.priority]}
                </span>
                <span className="assignee">
                  {t.technician?.name ?? "Sem responsável"}
                </span>
                <span>↗</span>
              </Link>
            ))
          )}
        </div>
      </section>
    </>
  );
}
