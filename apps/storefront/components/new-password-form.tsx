"use client";

import { useState } from "react";
import { Button } from "@nitro/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

const field = "mt-2 w-full rounded-button border border-ink/30 bg-transparent px-4 py-3 text-[17px] text-ink backdrop-blur-md";

/** Define la contraseña nueva tras abrir el enlace de recuperación (la sesión ya la creó /auth/callback). */
export function NewPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setBusy(true);
    setError("");
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setBusy(false);
    if (error) setError("No se pudo cambiar la contraseña. Pide un enlace nuevo.");
    else setDone(true);
  }

  if (done) return <p className="mt-8 text-[17px]">Listo, tu contraseña quedó actualizada.</p>;
  return (
    <form onSubmit={submit} className="glass mt-10 max-w-md space-y-5 rounded-card p-6 md:p-8">
      <label className="block text-sm text-muted">
        Contraseña nueva (mínimo 8 caracteres)
        <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={field} />
      </label>
      {error && (
        <p role="alert" className="text-[15px] text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}
