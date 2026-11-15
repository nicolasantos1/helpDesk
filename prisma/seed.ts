import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";
const db = new PrismaClient();
async function main() {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 12 || password.length > 72)
    throw new Error("Defina SEED_PASSWORD com 12 a 72 caracteres.");
  const passwordHash = await hash(password, 12);
  for (const [email, name, role] of [
    ["usuario@helpdesk.test", "Alex Solicitante", "USUARIO"],
    ["tecnico@helpdesk.test", "Rafa Suporte", "TECNICO"],
    ["tecnico2@helpdesk.test", "Dani Suporte", "TECNICO"],
    ["admin@helpdesk.test", "Administração Best Project", "ADMINISTRADOR"],
  ] as const) {
    await db.user.upsert({
      where: { email },
      update: {},
      create: { email, name, role: role as Role, passwordHash },
    });
  }
  for (const name of ["Hardware", "Software", "Rede", "Acessos"])
    await db.category.upsert({ where: { name }, update: {}, create: { name } });
  const user = await db.user.findUniqueOrThrow({
      where: { email: "usuario@helpdesk.test" },
    }),
    category = await db.category.findUniqueOrThrow({ where: { name: "Rede" } });
  if (!(await db.ticket.count()))
    await db.ticket.create({
      data: {
        title: "Sem conexão na estação de trabalho",
        description:
          "O computador da recepção está sem acesso à rede desde o início do expediente.",
        requesterId: user.id,
        categoryId: category.id,
        history: {
          create: {
            authorId: user.id,
            event: "OPEN",
            description: "Chamado aberto pelo solicitante.",
            newStatus: "ABERTO",
          },
        },
      },
    });
}
main().finally(() => db.$disconnect());
