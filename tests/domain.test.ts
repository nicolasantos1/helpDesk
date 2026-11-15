import { describe, it, expect } from "vitest";
import { period, ticketChange, ticketInput } from "../src/lib/domain";
import { Ticket } from "@prisma/client";
const t = {
  id: 1,
  version: 0,
  status: "ABERTO",
  technicianId: null,
  priority: "MEDIA",
} as Ticket;
describe("Regras puras", () => {
  it("UC02 valida campos obrigatórios", () => {
    expect(
      ticketInput.safeParse({ title: "", description: "", categoryId: "x" })
        .success,
    ).toBe(false);
  });
  it("UC04 administrador não assume", () => {
    expect(() =>
      ticketChange(
        { id: "a", role: "ADMINISTRADOR" },
        t,
        { action: "claim", version: 0 },
        false,
      ),
    ).toThrow();
  });
  it("UC05 rejeita transição direta para fechado", () => {
    expect(() =>
      ticketChange(
        { id: "a", role: "TECNICO" },
        { ...t, status: "EM_ATENDIMENTO", technicianId: "a" },
        { action: "status", version: 0, status: "FECHADO" },
        false,
      ),
    ).toThrow();
  });
  it("UC07 exige solução", () => {
    expect(() =>
      ticketChange(
        { id: "a", role: "TECNICO" },
        { ...t, status: "SOLUCIONADO", technicianId: "a" },
        { action: "close", version: 0, confirmed: true },
        false,
      ),
    ).toThrow();
  });
  it("UC10 inclui integralmente o dia final em São Paulo", () => {
    const p = period("2026-11-01", "2026-11-15");
    expect(p.gte.toISOString()).toBe("2026-11-01T03:00:00.000Z");
    expect(p.lt.toISOString()).toBe("2026-11-16T03:00:00.000Z");
  });
  it("UC10 rejeita datas invertidas ou inexistentes", () => {
    expect(() => period("2026-11-15", "2026-11-01")).toThrow();
    expect(() => period("2026-02-30", "2026-03-01")).toThrow();
  });
});
