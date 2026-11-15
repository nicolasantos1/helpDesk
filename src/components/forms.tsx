"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
type Field = {
  name: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  value?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
};
export function Form({
  endpoint,
  fields,
  extra = {},
  label = "Salvar",
  redirect,
}: {
  endpoint: string;
  fields: Field[];
  extra?: Record<string, unknown>;
  label?: string;
  redirect?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [errors, setErrors] = useState<Record<string, string[]>>({}),
    [success, setSuccess] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setErrors({});
    setSuccess("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const payload = {
      ...data,
      ...extra,
      ...("active" in data ? { active: data.active === "true" } : {}),
      ...("confirmed" in data ? { confirmed: data.confirmed === "yes" } : {}),
    };
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        setErrors(json.fields ?? {});
        if (res.status === 409) router.refresh();
        return;
      }
      if (redirect) {
        router.push(redirect === "ticket" ? `/chamados/${json.id}` : redirect);
        router.refresh();
      } else {
        setSuccess("Alteração salva.");
        router.refresh();
      }
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form">
      {fields.map((f) => (
        <label key={f.name}>
          {f.label}
          {f.options ? (
            <select
              aria-label={f.label}
              name={f.name}
              defaultValue={f.value}
              required={f.required ?? true}
              aria-invalid={!!errors[f.name]}
            >
              {f.options.map((o) => (
                <option value={o.value} key={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              name={f.name}
              defaultValue={f.value}
              required={f.required ?? true}
              minLength={f.minLength}
              maxLength={f.maxLength ?? 10000}
              aria-invalid={!!errors[f.name]}
            />
          ) : (
            <input
              name={f.name}
              type={f.type ?? "text"}
              defaultValue={f.value}
              required={f.required ?? true}
              minLength={f.minLength}
              maxLength={f.maxLength ?? (f.type === "password" ? 72 : 254)}
              autoComplete={
                f.type === "password"
                  ? endpoint === "/api/login"
                    ? "current-password"
                    : "new-password"
                  : f.name === "email"
                    ? "email"
                    : undefined
              }
              aria-invalid={!!errors[f.name]}
            />
          )}
          <small className="error">{errors[f.name]?.join(" ")}</small>
        </label>
      ))}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="success">
          {success}
        </p>
      )}
      <button disabled={busy}>{busy ? "Salvando…" : label}</button>
    </form>
  );
}
export function Logout() {
  const router = useRouter();
  return (
    <button
      className="subtle"
      onClick={async () => {
        await fetch("/api/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        router.push("/login");
        router.refresh();
      }}
    >
      Sair da conta ↗
    </button>
  );
}
