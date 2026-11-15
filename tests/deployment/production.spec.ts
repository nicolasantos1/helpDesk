import { test, expect, Page } from "@playwright/test";
const password = process.env.SEED_PASSWORD!;
async function login(page: Page, email = "usuario@helpdesk.test") {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar na plataforma" }).click();
  await expect(page).toHaveURL(/chamados/);
}
test("ONF06 HTTPS público, Secure e autenticação obrigatória", async ({
  page,
  request,
}) => {
  const res = await request.get("/login");
  expect(res.status()).toBe(200);
  expect(res.url().startsWith("https://")).toBe(true);
  await page.goto("/chamados");
  await expect(page).toHaveURL(/login/);
  await login(page);
  const cookie = (await page.context().cookies()).find(
    (c) => c.name === "helpdesk_session",
  );
  expect(cookie?.secure).toBe(true);
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  const csrf = await page.request.post("/api/tickets", {
    headers: { Origin: "https://foreign.invalid" },
    data: {},
  });
  expect(csrf.status()).toBe(403);
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/login/);
});
test("UC01–UC10 fluxo publicado com banco Neon", async ({ page }) => {
  const title = `Validação publicada ${Date.now()}`;
  await login(page);
  await page.getByRole("link", { name: "Novo chamado" }).first().click();
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page
    .getByLabel("Categoria", { exact: true })
    .selectOption({ label: "Software" });
  await page
    .getByLabel("Descrição do problema")
    .fill("Solicitação fictícia de validação da aplicação publicada.");
  await page.getByRole("button", { name: "Abrir chamado" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const ticketURL = page.url();
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await login(page, "tecnico@helpdesk.test");
  await page.goto(ticketURL);
  await page.getByRole("button", { name: "Assumir chamado" }).click();
  await expect(page.getByLabel("Status", { exact: true })).toBeVisible();
  await page.getByLabel("Prioridade", { exact: true }).selectOption("ALTA");
  await page.getByRole("button", { name: "Definir prioridade" }).click();
  await expect(page.getByText("Prioridade: MEDIA → ALTA")).toBeVisible();
  await page.getByLabel("Status", { exact: true }).selectOption("AGUARDANDO");
  await page.getByRole("button", { name: "Atualizar status" }).click();
  await expect(
    page.getByText("Status: EM_ATENDIMENTO → AGUARDANDO"),
  ).toBeVisible();
  await page
    .getByLabel("Solução aplicada")
    .fill("Fluxo de produção validado em Vercel e Neon com dados fictícios.");
  await page.getByRole("button", { name: "Registrar solução" }).click();
  await expect(
    page.getByRole("heading", { name: "Solução registrada" }),
  ).toBeVisible();
  await page
    .getByLabel("Confirma o encerramento definitivo?")
    .selectOption("yes");
  await page.getByRole("button", { name: "Encerrar chamado" }).click();
  await expect(
    page.getByText(
      "Atendimento finalizado. Histórico preservado para consulta.",
    ),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/evidence/production-ticket.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await login(page, "admin@helpdesk.test");
  await page.getByRole("link", { name: /Usuários/ }).click();
  const create = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Cadastrar conta" }) });
  const email = `deploy-${Date.now()}@test.invalid`;
  await create
    .getByLabel("Nome", { exact: true })
    .fill("Demonstração Publicada");
  await create.getByLabel("E-mail", { exact: true }).fill(email);
  await create.getByLabel("Perfil", { exact: true }).selectOption("USUARIO");
  await create.getByLabel("Senha inicial (12 a 72 caracteres)").fill(password);
  await create.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(create.getByRole("status")).toHaveText("Alteração salva.");
  // Email is a form value, so select this unique display name after the server refresh.
  const person = page
    .locator("details")
    .filter({
      has: page.locator("summary strong", {
        hasText: "Demonstração Publicada",
      }),
    })
    .last();
  await person.locator("summary").click();
  await person
    .getByLabel("Nome", { exact: true })
    .fill("Demonstração Publicada - inativa");
  await person.getByLabel("Situação", { exact: true }).selectOption("false");
  await person.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(person.getByRole("status")).toHaveText("Alteração salva.");
  await page.getByRole("link", { name: /Relatórios/ }).click();
  await expect(page.getByText("Total de chamados no período")).toBeVisible();
  await page.screenshot({
    path: "docs/evidence/production-report.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await login(page);
  await page.goto(ticketURL);
  await expect(
    page
      .getByText(
        "Fluxo de produção validado em Vercel e Neon com dados fictícios.",
      )
      .first(),
  ).toBeVisible();
});
