"use client";

import { useState } from "react";
import { Button } from "@nitro/ui";
import { supabaseBrowser } from "@/lib/supabase/client";
import { GoogleButton } from "./google-button";

const field = "mt-2 w-full rounded-button border border-ink/30 bg-transparent px-4 py-3 text-[17px] text-ink backdrop-blur-md";
const showApple = process.env.NEXT_PUBLIC_AUTH_APPLE === "1";

type Mode = "signin" | "signup" | "reset";

/** Ingreso y registro con correo y contraseña, Google (y Apple cuando se active) y recuperación de contraseña. */
export function AuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const go = (m: Mode) => {
    setMode(m);
    setError("");
    setInfo("");
  };

  async function apple() {
    setError("");
    const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider: "apple", options: { redirectTo: callback() } });
    if (error) setError("No se pudo iniciar con Apple.");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    const supabase = supabaseBrowser();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(/confirm/i.test(error.message) ? "Confirma tu correo: te enviamos un enlace al registrarte." : "Correo o contraseña incorrectos.");
        window.location.href = next; // recarga completa: el servidor lee la sesión recién creada
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callback(), data: { full_name: String(f.get("name") ?? "").trim() } },
        });
        if (error) throw new Error(/registered|exists/i.test(error.message) ? "Ese correo ya tiene cuenta. Ingresa o recupera tu contraseña." : error.message);
        if (data.session) window.location.href = next;
        else setInfo("Te enviamos un enlace para confirmar tu correo. Ábrelo para activar tu cuenta.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/cuenta/clave` });
        if (error) throw new Error("No se pudo enviar el correo. Intenta de nuevo.");
        setInfo("Si ese correo tiene cuenta, te enviamos un enlace para crear una contraseña nueva.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signin" ? "Ingresar" : mode === "signup" ? "Crear cuenta" : "Recuperar contraseña";
  return (
    <div className="glass mt-10 rounded-card p-6 md:p-8">
      <h2 className="text-[24px] font-semibold">{title}</h2>

      {mode !== "reset" && (
        <div className="mt-5 space-y-3">
          <GoogleButton next={next} callback={callback} onError={setError} />
          {showApple && (
            <Button type="button" variant="ghost" className="w-full" onClick={apple}>
              Continuar con Apple
            </Button>
          )}
          <p className="pt-1 text-center text-sm text-muted">o con tu correo</p>
        </div>
      )}

      <form onSubmit={submit} className="mt-5 space-y-5">
        {mode === "signup" && (
          <label className="block text-sm text-muted">
            Nombre
            <input name="name" required minLength={2} maxLength={120} autoComplete="name" className={field} />
          </label>
        )}
        <label className="block text-sm text-muted">
          Correo
          <input name="email" type="email" required maxLength={160} autoComplete="email" className={field} />
        </label>
        {mode !== "reset" && (
          <label className="block text-sm text-muted">
            Contraseña {mode === "signup" && <span>(mínimo 8 caracteres)</span>}
            <input
              name="password"
              type="password"
              required
              minLength={mode === "signup" ? 8 : 1}
              maxLength={72}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className={field}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-[15px] text-red-600">
            {error}
          </p>
        )}
        {info && <p className="text-[15px]">{info}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Un momento…" : mode === "reset" ? "Enviar enlace" : title}
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {mode !== "signin" && (
          <button type="button" className="text-link hover:underline" onClick={() => go("signin")}>
            Ya tengo cuenta
          </button>
        )}
        {mode !== "signup" && (
          <button type="button" className="text-link hover:underline" onClick={() => go("signup")}>
            Crear cuenta
          </button>
        )}
        {mode === "signin" && (
          <button type="button" className="text-link hover:underline" onClick={() => go("reset")}>
            Olvidé mi contraseña
          </button>
        )}
      </div>
    </div>
  );
}
