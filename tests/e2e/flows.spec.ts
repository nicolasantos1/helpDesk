import "dotenv/config";
import { test, expect, Page } from "@playwright/test";
const password = process.env.SEED_PASSWORD!;
async function login(page: Page, email = "usuario@helpdesk.test") {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar na plataforma" }).click();
  await expect(page).toHaveURL(/chamados/);
}
test("UC01/ONF02 login, inválido, acesso protegido e logout", async ({
  page,
}) => {
  await page.goto("/chamados");
  await expect(page).toHaveURL(/login/);
  await page
    .getByLabel("E-mail", { exact: true })
    .fill("unknown@helpdesk.test");
  await page.getByLabel("Senha", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Entrar na plataforma" }).click();
  await expect(page.locator("p[role=alert]")).toHaveText(
    "E-mail ou senha inválidos.",
  );
  await login(page);
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/login/);
});
test("UC02–UC09 fluxo pela interface nos três perfis", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Novo chamado" }).first().click();
  await page
    .getByLabel("Título", { exact: true })
    .fill("Teste E2E teclado e fluxo");
  await page
    .getByLabel("Categoria", { exact: true })
    .selectOption({ label: "Software" });
  await page
    .getByLabel("Descrição do problema")
    .fill("O aplicativo de exemplo não está abrindo.");
  await page.getByRole("button", { name: "Abrir chamado" }).click();
  await expect(
    page.getByRole("heading", { name: "Teste E2E teclado e fluxo" }),
  ).toBeVisible();
  const url = page.url();
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await login(page, "tecnico@helpdesk.test");
  await page.goto(url);
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
    .fill("Aplicativo reinstalado e validado com solicitante.");
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
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await login(page, "admin@helpdesk.test");
  await page.getByRole("link", { name: /Usuários/ }).click();
  await expect(
    page.getByRole("heading", { name: "Pessoas e acessos" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Relatórios/ }).click();
  await expect(page.getByText("Total de chamados no período")).toBeVisible();
});
for (const width of [360, 768, 1366])
  test(`ONF05 responsividade ${width}px e teclado`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("link", { name: "HelpDesk BEST PROJECT" }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: /Chamados/ })).toBeFocused();
    await page.screenshot({
      path: `docs/evidence/chamados-${width}.png`,
      fullPage: true,
    });
  });
test("ONF06 cookie seguro e CSRF", async ({ page, request }) => {
  await login(page);
  const cookie = (await page.context().cookies()).find(
    (c) => c.name === "helpdesk_session",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  const res = await request.post("/api/tickets", {
    headers: { Origin: "https://foreign.invalid" },
    data: {},
  });
  expect(res.status()).toBe(403);
});

test("UC01 conta inativa, ONF02 sessão expirada e ONF03 endpoints protegidos", async ({
  page,
  request,
}) => {
  const { PrismaClient } = await import("@prisma/client");
  const { hash } = await import("bcryptjs");
  const db = new PrismaClient();
  const email = `inactive-${Date.now()}@test.invalid`;
  const u = await db.user.create({
    data: {
      name: "Conta Inativa E2E",
      email,
      passwordHash: await hash(password, 12),
      role: "USUARIO",
      active: false,
    },
  });
  try {
    await page.goto("/login");
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar na plataforma" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText(
      "E-mail ou senha inválidos.",
    );
    await login(page);
    const current = await db.user.findUniqueOrThrow({
      where: { email: "usuario@helpdesk.test" },
    });
    await db.session.updateMany({
      where: { userId: current.id },
      data: { expiresAt: new Date(0) },
    });
    await page.goto("/chamados");
    await expect(page).toHaveURL(/login/);
    const response = await request.post("/api/tickets", {
      headers: { Origin: "http://localhost:3000" },
      data: {},
    });
    expect(response.status()).toBe(401);
  } finally {
    await db.user.delete({ where: { id: u.id } });
    await db.$disconnect();
  }
});
