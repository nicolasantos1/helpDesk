import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { labels } from "@/lib/domain";
import { Logout } from "@/components/forms";
export const dynamic = "force-dynamic";
export default async function Shell({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await currentUser();
  if (!u) redirect("/login");
  return (
    <div className="shell">
      <aside>
        <Link className="brand" href="/chamados">
          ▧ HelpDesk<span>BEST PROJECT</span>
        </Link>
        <p className="nav-label">ÁREA DE TRABALHO</p>
        <nav>
          <Link href="/chamados">
            ▤ &nbsp; {u.role === "TECNICO" ? "Fila de atendimento" : "Chamados"}
          </Link>
          {u.role === "USUARIO" && (
            <Link href="/chamados/novo">＋ &nbsp; Novo chamado</Link>
          )}
          {u.role === "ADMINISTRADOR" && (
            <>
              <Link href="/usuarios">♙ &nbsp; Usuários</Link>
              <Link href="/relatorios">▥ &nbsp; Relatórios</Link>
            </>
          )}
        </nav>
        <div className="sidebar-foot">
          <span className="online" /> Sistema de suporte
          <br />
          <small>Mackenzie · ADS 2026</small>
        </div>
      </aside>
      <div className="workspace">
        <header>
          <span>
            Central de suporte <span className="muted">/ {labels[u.role]}</span>
          </span>
          <div className="account">
            <span className="avatar">{u.name.charAt(0)}</span>
            <span>
              {u.name}
              <small>{labels[u.role]}</small>
            </span>
            <Logout />
          </div>
        </header>
        <main id="content">{children}</main>
        <footer>
          HelpDesk · Best Project <span>Organização em cada atendimento.</span>
        </footer>
      </div>
    </div>
  );
}
