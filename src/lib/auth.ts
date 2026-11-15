import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { compare } from "bcryptjs";
import { db } from "./db";
import { AppError } from "./domain";
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function currentUser() {
  const token = (await cookies()).get("helpdesk_session")?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: digest(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active)
    return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
}
export async function requireUser() {
  const u = await currentUser();
  if (!u) throw new AppError("Autenticação necessária.", 401);
  return u;
}
export async function login(email: string, password: string) {
  const u = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  // A fixed valid bcrypt hash keeps unknown-account failures on the same expensive path.
  const valid = await compare(
    password,
    u?.passwordHash ??
      "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxeztYQC4.N5.R5HjMqpdu6tD6C",
  );
  if (!u?.active || !valid)
    throw new AppError("E-mail ou senha inválidos.", 401);
  const token = randomBytes(32).toString("hex");
  const old = (await cookies()).get("helpdesk_session")?.value;
  if (old) await db.session.deleteMany({ where: { tokenHash: digest(old) } });
  await db.session.create({
    data: {
      tokenHash: digest(token),
      userId: u.id,
      expiresAt: new Date(Date.now() + 8 * 3600000),
    },
  });
  (await cookies()).set("helpdesk_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 3600,
  });
}
export async function logout() {
  const jar = await cookies(),
    token = jar.get("helpdesk_session")?.value;
  if (token)
    await db.session.deleteMany({ where: { tokenHash: digest(token) } });
  jar.delete("helpdesk_session");
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(process.env.APP_URL ?? request.url).origin)
    throw new AppError("Origem da operação inválida.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new AppError("Formato inválido.", 415);
}
