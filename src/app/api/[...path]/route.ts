import { NextResponse } from "next/server";
import { z } from "zod";
import { checkOrigin, login, logout, requireUser } from "@/lib/auth";
import { AppError } from "@/lib/domain";
import { db } from "@/lib/db";
import { createTicket, changeTicket, saveUser } from "@/lib/service";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    checkOrigin(request);
    if (Number(request.headers.get("content-length") ?? 0) > 32000)
      throw new AppError("Requisição muito grande.", 413);
    const path = (await params).path;
    const raw = await request.text();
    if (raw.length > 32000) throw new AppError("Requisição muito grande.", 413);
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new AppError("JSON inválido.");
    }
    if (path.join("/") === "login") {
      const input = z
        .object({
          email: z.string().email().max(254),
          password: z.string().min(1).max(72),
        })
        .parse(body);
      await login(input.email, input.password);
      return NextResponse.json({ ok: true });
    }
    const actor = await requireUser();
    if (path.join("/") === "logout") {
      await logout();
      return NextResponse.json({ ok: true });
    }
    if (path.join("/") === "tickets")
      return NextResponse.json(await createTicket(actor, body), {
        status: 201,
      });
    if (path[0] === "tickets" && /^\d+$/.test(path[1] ?? ""))
      return NextResponse.json(
        await changeTicket(actor, Number(path[1]), body),
      );
    if (path[0] === "users" && path.length <= 2)
      return NextResponse.json(await saveUser(actor, path[1], body));
    throw new AppError("Operação indisponível.", 404);
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        {
          error: "Confira os campos informados.",
          fields: e.flatten().fieldErrors,
        },
        { status: 400 },
      );
    if (e instanceof AppError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json(
      { error: "Serviço indisponível. Tente novamente." },
      { status: 503 },
    );
  }
}
export async function GET() {
  try {
    await requireUser();
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ database: "ok" });
  } catch {
    return NextResponse.json({ error: "Indisponível" }, { status: 503 });
  }
}
