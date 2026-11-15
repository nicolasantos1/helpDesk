import "dotenv/config";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { db } from "../src/lib/db";
import {
  changeTicket,
  createTicket,
  readTicket,
  listTickets,
  saveUser,
  report,
} from "../src/lib/service";
import { Role } from "@prisma/client";
import { randomUUID } from "node:crypto";
const suffix = randomUUID(),
  ids: string[] = [],
  tickets: number[] = [];
let requester: { id: string; role: Role },
  other: typeof requester,
  tech: typeof requester,
  tech2: typeof requester,
  admin: typeof requester,
  categoryId: string;
beforeAll(async () => {
  for (const role of [
    "USUARIO",
    "USUARIO",
    "TECNICO",
    "TECNICO",
    "ADMINISTRADOR",
  ] as Role[]) {
    const u = await db.user.create({
      data: {
        name: "Teste automatizado",
        email: `${ids.length}-${suffix}@test.invalid`,
        role,
        passwordHash: "not-a-login-hash",
      },
    });
    ids.push(u.id);
  }
  [requester, other, tech, tech2, admin] = ids.map((id, i) => ({
    id,
    role: (
      ["USUARIO", "USUARIO", "TECNICO", "TECNICO", "ADMINISTRADOR"] as Role[]
    )[i],
  }));
  categoryId = (await db.category.create({ data: { name: `Teste ${suffix}` } }))
    .id;
});
afterAll(async () => {
  await db.$transaction([
    db.history.deleteMany({ where: { ticketId: { in: tickets } } }),
    db.solution.deleteMany({ where: { ticketId: { in: tickets } } }),
    db.ticket.deleteMany({ where: { id: { in: tickets } } }),
  ]);
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.category.delete({ where: { id: categoryId } });
  await db.$disconnect();
});
const open = async () => {
  const t = await createTicket(requester, {
    title: "Problema de teste",
    description: "Descrição suficientemente detalhada.",
    categoryId,
  });
  tickets.push(t.id);
  return t;
};
describe("PostgreSQL real", () => {
  it("UC02/ONF04 abertura persiste histórico inicial e padrões", async () => {
    const t = await open();
    const found = await readTicket(requester, t.id);
    expect(found.history).toHaveLength(1);
    expect(found.status).toBe("ABERTO");
    expect(found.priority).toBe("MEDIA");
  });
  it("UC02 falha não cria chamado parcial", async () => {
    const count = await db.ticket.count();
    await expect(
      createTicket(requester, {
        title: "Teste válido",
        description: "Uma descrição válida.",
        categoryId: randomUUID(),
      }),
    ).rejects.toThrow();
    expect(await db.ticket.count()).toBe(count);
  });
  it("UC03/ONF03 impede leitura de outro solicitante e filtra listagem", async () => {
    const t = await open();
    await expect(readTicket(other, t.id)).rejects.toThrow("indisponível");
    expect(await listTickets(other, { q: String(t.id) })).toHaveLength(0);
  });
  it("UC04 atribuição concorrente aceita apenas um técnico e um evento", async () => {
    const t = await open();
    const results = await Promise.allSettled([
      changeTicket(tech, t.id, { action: "claim", version: 0 }),
      changeTicket(tech2, t.id, { action: "claim", version: 0 }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const found = await readTicket(admin, t.id);
    expect([tech.id, tech2.id]).toContain(found.technicianId);
    expect(found.history).toHaveLength(2);
    expect(found.version).toBe(1);
  });
  it("UC04 rejeita administrador e conta inativa", async () => {
    const t = await open();
    await expect(
      changeTicket(admin, t.id, { action: "claim", version: 0 }),
    ).rejects.toThrow();
    await db.user.update({ where: { id: tech2.id }, data: { active: false } });
    await expect(
      changeTicket(tech2, t.id, { action: "claim", version: 0 }),
    ).rejects.toThrow();
    await db.user.update({ where: { id: tech2.id }, data: { active: true } });
  });
  it("UC05/06/07/09 fluxo completo, proprietário, versão e imutabilidade", async () => {
    const t = await open();
    await changeTicket(tech, t.id, { action: "claim", version: 0 });
    await expect(
      changeTicket(tech2, t.id, {
        action: "priority",
        priority: "ALTA",
        version: 1,
      }),
    ).rejects.toThrow();
    await expect(
      changeTicket(tech, t.id, {
        action: "status",
        status: "FECHADO",
        version: 1,
      }),
    ).rejects.toThrow();
    await changeTicket(tech, t.id, {
      action: "priority",
      priority: "ALTA",
      version: 1,
    });
    await expect(
      changeTicket(tech, t.id, {
        action: "priority",
        priority: "BAIXA",
        version: 1,
      }),
    ).rejects.toThrow();
    await changeTicket(tech, t.id, {
      action: "status",
      status: "AGUARDANDO",
      version: 2,
    });
    await changeTicket(tech, t.id, {
      action: "status",
      status: "EM_ATENDIMENTO",
      version: 3,
    });
    await expect(
      changeTicket(tech, t.id, {
        action: "close",
        version: 4,
        confirmed: true,
      }),
    ).rejects.toThrow();
    await expect(
      changeTicket(tech, t.id, {
        action: "solve",
        version: 4,
        description: " ",
      }),
    ).rejects.toThrow();
    await changeTicket(tech, t.id, {
      action: "solve",
      version: 4,
      description: "Configuração corrigida.",
    });
    await expect(
      changeTicket(tech, t.id, {
        action: "priority",
        version: 5,
        priority: "BAIXA",
      }),
    ).rejects.toThrow();
    await expect(
      changeTicket(tech, t.id, {
        action: "close",
        version: 5,
        confirmed: false,
      }),
    ).rejects.toThrow();
    await changeTicket(tech, t.id, {
      action: "close",
      version: 5,
      confirmed: true,
    });
    const found = await readTicket(requester, t.id);
    expect(found.status).toBe("FECHADO");
    expect(found.closedAt).not.toBeNull();
    expect(found.solution?.description).toBe("Configuração corrigida.");
    expect(found.history).toHaveLength(7);
    await expect(
      changeTicket(tech, t.id, {
        action: "status",
        status: "EM_ATENDIMENTO",
        version: 6,
      }),
    ).rejects.toThrow();
  });
  it("UC08 restrições próprias, técnico ocupado e e-mail duplicado", async () => {
    const t = await open();
    await changeTicket(tech, t.id, { action: "claim", version: 0 });
    const u = await db.user.findUniqueOrThrow({ where: { id: tech.id } });
    const data = {
      name: u.name,
      email: u.email,
      role: u.role,
      active: false,
      version: 0,
    };
    await expect(saveUser(admin, tech.id, data)).rejects.toThrow(
      "não fechados",
    );
    await expect(
      saveUser(admin, tech.id, { ...data, active: true, role: "USUARIO" }),
    ).rejects.toThrow("não fechados");
    const a = await db.user.findUniqueOrThrow({ where: { id: admin.id } });
    await expect(
      saveUser(admin, admin.id, {
        name: a.name,
        email: a.email,
        role: a.role,
        active: false,
        version: 0,
      }),
    ).rejects.toThrow("sua conta");
    await expect(
      saveUser(admin, undefined, {
        ...data,
        password: "test-password-123",
        active: true,
      }),
    ).rejects.toThrow("já cadastrado");
    await expect(saveUser(requester, tech.id, data)).rejects.toThrow();
  });
  it("UC08 cadastro, edição e desativação preservam histórico", async () => {
    const created = await saveUser(admin, undefined, {
      name: "Nova Pessoa",
      email: `new-${suffix}@test.invalid`,
      role: "USUARIO",
      active: true,
      password: "test-password-123",
    });
    ids.push(created.id);
    await saveUser(admin, created.id, {
      name: "Pessoa editada",
      email: `new-${suffix}@test.invalid`,
      role: "USUARIO",
      active: false,
      version: 0,
    });
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: created.id } })).active,
    ).toBe(false);
  });
  it("UC10 totais consistentes e intervalo vazio", async () => {
    const r = await report(admin, "2020-01-01", "2099-12-31");
    for (const group of [r.status, r.priority, r.category])
      expect(group.reduce((s, x) => s + x._count, 0)).toBe(r.total);
    expect((await report(admin, "2000-01-01", "2000-01-02")).total).toBe(0);
    await expect(report(tech, "2020-01-01", "2099-12-31")).rejects.toThrow();
    await expect(report(admin, "2026-11-15", "2026-11-01")).rejects.toThrow();
  });
  it("ONF04 persistência após reconexão", async () => {
    const t = await open();
    await db.$disconnect();
    expect((await readTicket(requester, t.id)).title).toBe(t.title);
  });

  it("ONF04 banco rejeita chamado sem histórico e desfaz a gravação", async () => {
    const u = await db.user.findFirstOrThrow({
        where: { email: "usuario@helpdesk.test" },
      }),
      c = await db.category.findFirstOrThrow();
    const before = await db.ticket.count();
    await expect(
      db.ticket.create({
        data: {
          title: "Registro sem histórico",
          description: "Esta transação deve ser rejeitada.",
          requesterId: u.id,
          categoryId: c.id,
        },
      }),
    ).rejects.toThrow();
    expect(await db.ticket.count()).toBe(before);
  });
});
