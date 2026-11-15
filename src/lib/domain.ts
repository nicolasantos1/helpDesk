import { Priority, Role, Status, Ticket } from "@prisma/client";
import { z } from "zod";
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const labels: Record<string, string> = {
  USUARIO: "Usuário",
  TECNICO: "Técnico",
  ADMINISTRADOR: "Administrador",
  ABERTO: "Aberto",
  EM_ATENDIMENTO: "Em atendimento",
  AGUARDANDO: "Aguardando",
  SOLUCIONADO: "Solucionado",
  FECHADO: "Fechado",
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};
export const ticketInput = z.object({
  title: z.string().trim().min(3, "Informe ao menos 3 caracteres.").max(160),
  description: z
    .string()
    .trim()
    .min(10, "Descreva o problema em pelo menos 10 caracteres.")
    .max(10000),
  categoryId: z.string().uuid("Selecione uma categoria."),
});
export const userInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  role: z.nativeEnum(Role),
  active: z.boolean(),
  password: z.string().min(12).max(72).optional(),
  version: z.number().int().nonnegative().optional(),
});
export const mutationInput = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("claim"),
    version: z.number().int().nonnegative(),
  }),
  z.object({
    action: z.literal("status"),
    version: z.number().int().nonnegative(),
    status: z.nativeEnum(Status),
  }),
  z.object({
    action: z.literal("priority"),
    version: z.number().int().nonnegative(),
    priority: z.nativeEnum(Priority),
  }),
  z.object({
    action: z.literal("solve"),
    version: z.number().int().nonnegative(),
    description: z.string().trim().min(1, "Informe a solução.").max(10000),
  }),
  z.object({
    action: z.literal("close"),
    version: z.number().int().nonnegative(),
    confirmed: z.literal(true),
  }),
]);
export type Mutation = z.infer<typeof mutationInput>;
export function ticketChange(
  user: { id: string; role: Role },
  ticket: Ticket,
  action: Mutation,
  hasSolution: boolean,
) {
  if (user.role !== "TECNICO")
    throw new AppError("Ação exclusiva do técnico responsável.", 403);
  if (ticket.version !== action.version)
    throw new AppError("O chamado foi atualizado. Recarregue os dados.", 409);
  if (ticket.status === "FECHADO")
    throw new AppError("Chamado fechado não aceita alterações.");
  if (action.action === "claim") {
    if (ticket.status !== "ABERTO" || ticket.technicianId)
      throw new AppError("Chamado indisponível.", 409);
    return { technicianId: user.id, status: Status.EM_ATENDIMENTO };
  }
  if (ticket.technicianId !== user.id)
    throw new AppError("Ação exclusiva do técnico responsável.", 403);
  if (action.action === "close") {
    if (ticket.status !== "SOLUCIONADO" || !hasSolution)
      throw new AppError("Registre uma solução antes de encerrar.");
    return { status: Status.FECHADO, closedAt: new Date() };
  }
  if (!["EM_ATENDIMENTO", "AGUARDANDO"].includes(ticket.status))
    throw new AppError("Operação não permitida neste estado.");
  if (action.action === "status") {
    if (action.status === ticket.status) return null;
    if (!["EM_ATENDIMENTO", "AGUARDANDO"].includes(action.status))
      throw new AppError("Transição inválida.");
    return { status: action.status };
  }
  if (action.action === "priority")
    return action.priority === ticket.priority
      ? null
      : { priority: action.priority };
  return { status: Status.SOLUCIONADO };
}
export function period(start: string, end: string) {
  const date = z.string().date();
  if (
    !date.safeParse(start).success ||
    !date.safeParse(end).success ||
    start > end
  )
    throw new AppError("Informe um intervalo de datas válido.");
  // America/Sao_Paulo: UTC-03, inclusive civil dates for the supported contemporary period.
  const from = new Date(`${start}T00:00:00-03:00`),
    to = new Date(`${end}T00:00:00-03:00`);
  to.setUTCDate(to.getUTCDate() + 1);
  return { gte: from, lt: to };
}
