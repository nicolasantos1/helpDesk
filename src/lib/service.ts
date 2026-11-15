import { Prisma, Role, Status, Priority } from "@prisma/client";
import { hash } from "bcryptjs";
import { db } from "./db";
import {
  AppError,
  Mutation,
  mutationInput,
  period,
  ticketChange,
  ticketInput,
  userInput,
} from "./domain";
export type Actor = { id: string; role: Role };
export async function active(
  tx: Prisma.TransactionClient,
  actor: Actor,
  role?: Role,
) {
  const u = await tx.user.findUnique({ where: { id: actor.id } });
  if (!u?.active) throw new AppError("Sessão inválida.", 401);
  if (role && u.role !== role) throw new AppError("Acesso não permitido.", 403);
  return u;
}
export async function createTicket(actor: Actor, input: unknown) {
  const data = ticketInput.parse(input);
  return db.$transaction(async (tx) => {
    const u = await active(tx, actor, "USUARIO");
    if (!(await tx.category.findUnique({ where: { id: data.categoryId } })))
      throw new AppError("Categoria inválida.");
    return tx.ticket.create({
      data: {
        ...data,
        requesterId: u.id,
        history: {
          create: {
            authorId: u.id,
            event: "OPEN",
            description: "Chamado aberto.",
            newStatus: "ABERTO",
          },
        },
      },
    });
  });
}
export async function changeTicket(actor: Actor, id: number, input: unknown) {
  const action: Mutation = mutationInput.parse(input);
  return db.$transaction(async (tx) => {
    const u = await active(tx, actor, "TECNICO");
    // Serialize account changes with assignment, so a technician cannot be deactivated mid-claim.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${u.id}::uuid FOR UPDATE`;
    await active(tx, actor, "TECNICO");
    const ticket = await tx.ticket.findUnique({
      where: { id },
      include: { solution: true },
    });
    if (!ticket) throw new AppError("Chamado indisponível.", 404);
    const data = ticketChange(u, ticket, action, !!ticket.solution);
    if (!data) return ticket;
    const result = await tx.ticket.updateMany({
      where: { id, version: action.version },
      data: { ...data, version: { increment: 1 } },
    });
    if (!result.count)
      throw new AppError("O chamado foi atualizado. Recarregue os dados.", 409);
    if (action.action === "solve")
      await tx.solution.create({
        data: { ticketId: id, description: action.description },
      });
    const description =
      action.action === "priority"
        ? `Prioridade: ${ticket.priority} → ${action.priority}`
        : action.action === "solve"
          ? action.description
          : action.action === "claim"
            ? "Técnico assumiu o atendimento."
            : action.action === "close"
              ? "Encerramento confirmado."
              : `Status: ${ticket.status} → ${"status" in data ? data.status : ticket.status}`;
    await tx.history.create({
      data: {
        ticketId: id,
        authorId: u.id,
        event: action.action,
        description,
        previousStatus: ticket.status,
        newStatus:
          "status" in data && data.status ? data.status : ticket.status,
      },
    });
    return tx.ticket.findUniqueOrThrow({ where: { id } });
  });
}
export async function readTicket(actor: Actor, id: number) {
  const u = await active(db, actor);
  const t = await db.ticket.findFirst({
    where: { id, ...(u.role === "USUARIO" ? { requesterId: u.id } : {}) },
    include: {
      category: true,
      requester: { select: { name: true } },
      technician: { select: { name: true } },
      solution: true,
      history: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!t) throw new AppError("Chamado indisponível.", 404);
  return t;
}
export async function listTickets(
  actor: Actor,
  filters: Record<string, string>,
) {
  const u = await active(db, actor);
  const where: Prisma.TicketWhereInput = {
    ...(u.role === "USUARIO" ? { requesterId: u.id } : {}),
  };
  if (filters.q)
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      ...(Number.isSafeInteger(Number(filters.q))
        ? [{ id: Number(filters.q) }]
        : []),
    ];
  if (
    filters.status &&
    Object.values(Status).includes(filters.status as Status)
  )
    where.status = filters.status as Status;
  if (
    filters.priority &&
    Object.values(Priority).includes(filters.priority as Priority)
  )
    where.priority = filters.priority as Priority;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (u.role === "TECNICO" && filters.queue === "available") {
    where.status = "ABERTO";
    where.technicianId = null;
  }
  if (u.role === "TECNICO" && filters.queue === "mine")
    where.technicianId = u.id;
  return db.ticket.findMany({
    where,
    include: { category: true, technician: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
export async function saveUser(
  actor: Actor,
  id: string | undefined,
  input: unknown,
) {
  const data = userInput.parse(input);
  const passwordHash = data.password
    ? await hash(data.password, 12)
    : undefined;
  try {
    return await db.$transaction(async (tx) => {
      await active(tx, actor, "ADMINISTRADOR");
      if (!id) {
        if (!passwordHash)
          throw new AppError("Senha inicial obrigatória (12 a 72 caracteres).");
        return tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            role: data.role,
            active: data.active,
            passwordHash,
          },
          select: { id: true },
        });
      }
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${id}::uuid FOR UPDATE`;
      const old = await tx.user.findUnique({ where: { id } });
      if (!old) throw new AppError("Conta não encontrada.", 404);
      if (id === actor.id && (!data.active || data.role !== old.role))
        throw new AppError(
          "Você não pode desativar sua conta ou alterar seu próprio perfil.",
        );
      if (
        old.role === "TECNICO" &&
        (!data.active || old.role !== data.role) &&
        (await tx.ticket.count({
          where: { technicianId: id, status: { not: "FECHADO" } },
        }))
      )
        throw new AppError("Técnico possui chamados não fechados.");
      const result = await tx.user.updateMany({
        where: { id, version: data.version ?? -1 },
        data: {
          name: data.name,
          email: data.email,
          role: data.role,
          active: data.active,
          ...(passwordHash ? { passwordHash } : {}),
          version: { increment: 1 },
        },
      });
      if (!result.count)
        throw new AppError(
          "Conta atualizada por outra operação. Recarregue.",
          409,
        );
      await tx.session.deleteMany({ where: { userId: id } });
      return { id };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      throw new AppError("E-mail já cadastrado.");
    throw e;
  }
}
export async function report(actor: Actor, start: string, end: string) {
  await active(db, actor, "ADMINISTRADOR");
  const range = period(start, end);
  return db.$transaction(
    async (tx) => {
      const where = { createdAt: range };
      const total = await tx.ticket.count({ where });
      const status = await tx.ticket.groupBy({
        by: ["status"],
        where,
        _count: true,
      });
      const priority = await tx.ticket.groupBy({
        by: ["priority"],
        where,
        _count: true,
      });
      const category = await tx.ticket.groupBy({
        by: ["categoryId"],
        where,
        _count: true,
      });
      const categories = await tx.category.findMany();
      return {
        total,
        status,
        priority,
        category: category.map((c) => ({
          ...c,
          name: categories.find((x) => x.id === c.categoryId)?.name,
        })),
      };
    },
    { isolationLevel: "RepeatableRead" },
  );
}
