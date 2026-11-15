import { Form } from "@/components/forms";
export default function Login() {
  return (
    <main className="login">
      <section className="login-story">
        <div className="brand">
          ▧ HelpDesk<span>BEST PROJECT</span>
        </div>
        <div>
          <p className="eyebrow">SUPORTE QUE CONECTA</p>
          <h1>
            Menos obstáculos.
            <br />
            Mais soluções.
          </h1>
          <p>
            Um só lugar para solicitar ajuda, acompanhar atendimentos e manter
            sua equipe em movimento.
          </p>
          <div className="story-stats">
            <span>
              01
              <br />
              <small>Abra sua solicitação</small>
            </span>
            <span>
              02
              <br />
              <small>Acompanhe a evolução</small>
            </span>
            <span>
              03
              <br />
              <small>Volte ao que importa</small>
            </span>
          </div>
        </div>
        <small>MACKENZIE ADS · 2026</small>
      </section>
      <section className="login-form">
        <p className="eyebrow">BEM-VINDO DE VOLTA</p>
        <h2>Acesse seu espaço</h2>
        <p className="muted">
          Entre com as credenciais fornecidas pelo administrador.
        </p>
        <Form
          endpoint="/api/login"
          label="Entrar na plataforma →"
          redirect="/chamados"
          fields={[
            { name: "email", label: "E-mail", type: "email" },
            { name: "password", label: "Senha", type: "password" },
          ]}
        />
        <p className="login-note">
          Acesso seguro para usuários, técnicos e administradores.
        </p>
      </section>
    </main>
  );
}
