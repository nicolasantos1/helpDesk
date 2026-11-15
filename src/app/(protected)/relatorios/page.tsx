import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/page-auth";
import { report } from "@/lib/service";
import { AppError, labels } from "@/lib/domain";
export default async function Reports({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const u = await requirePageUser();
  if (u.role !== "ADMINISTRADOR") redirect("/chamados");
  const p = await searchParams,
    today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
    }).format(new Date()),
    start = p.start ?? today.slice(0, 7) + "-01",
    end = p.end ?? today;
  const result = await report(u, start, end)
    .then((data) => ({ data, error: "" }))
    .catch((e) => {
      if (e instanceof AppError) return { data: null, error: e.message };
      throw e;
    });
  const { data, error } = result;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">INDICADORES</p>
          <h1>Relatórios de chamados</h1>
          <p className="muted">
            Uma visão da operação, do primeiro contato à resolução.
          </p>
        </div>
      </div>
      <section className="panel">
        <form className="filters">
          <label>
            Abertos a partir de
            <input type="date" name="start" defaultValue={start} required />
          </label>
          <label>
            Até (inclusive)
            <input type="date" name="end" defaultValue={end} required />
          </label>
          <button>Consultar relatório</button>
        </form>
        <p className="muted">
          Datas de abertura no fuso America/Sao_Paulo. Os dois dias são
          incluídos integralmente.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
      {data && (
        <>
          <div className="report-total">
            <span>Total de chamados no período</span>
            <strong>{data.total}</strong>
          </div>
          {data.total === 0 && (
            <p className="muted">Nenhum registro no período selecionado.</p>
          )}
          <div className="report-grid">
            {[
              {
                title: "Por status",
                rows: data.status.map((x) => ({
                  name: labels[x.status],
                  count: x._count,
                })),
              },
              {
                title: "Por prioridade",
                rows: data.priority.map((x) => ({
                  name: labels[x.priority],
                  count: x._count,
                })),
              },
              {
                title: "Por categoria",
                rows: data.category.map((x) => ({
                  name: x.name ?? "Categoria",
                  count: x._count,
                })),
              },
            ].map((group) => (
              <section className="panel" key={group.title}>
                <h2>{group.title}</h2>
                {group.rows.map((row) => (
                  <div className="report-row" key={row.name}>
                    <div>
                      <span>{row.name}</span>
                      <strong>{row.count}</strong>
                    </div>
                    <progress max={data.total || 1} value={row.count} />
                  </div>
                ))}
                <p className="muted">
                  Total: {group.rows.reduce((sum, x) => sum + x.count, 0)}
                </p>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
