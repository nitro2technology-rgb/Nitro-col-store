"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@nitro/ui";

const field = "mt-2 w-full rounded-button border border-ink/30 bg-transparent px-4 py-3 text-[17px] text-ink backdrop-blur-md";

/** Formulario de reseña: solo lo acepta el servidor si el pedido (pagado) y el correo coinciden. */
export function ReviewForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, stars, order: f.get("order"), email: f.get("email"), text: f.get("text") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo enviar la reseña.");
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la reseña.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p className="mt-8 text-[17px]">¡Gracias! Tu reseña ya está publicada.</p>;
  if (!open) {
    return (
      <Button type="button" variant="ghost" className="mt-8" onClick={() => setOpen(true)}>
        Escribir una reseña
      </Button>
    );
  }
  return (
    <form onSubmit={submit} className="glass mt-8 max-w-xl rounded-card p-7">
      <h3 className="text-[22px] font-semibold">Tu reseña</h3>
      <p className="mt-2 text-[15px] text-muted">Solo pueden reseñar quienes compraron este producto: usa el número de pedido (NC-…) y el correo de la compra.</p>
      <div className="mt-5 flex gap-1" role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
            onClick={() => setStars(n)}
            className={`text-[30px] leading-none ${n <= stars ? "" : "text-muted/40"}`}
          >
            ★
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-muted">
          Número de pedido
          <input name="order" required placeholder="NC-12" maxLength={14} className={field} />
        </label>
        <label className="block text-sm text-muted">
          Correo de la compra
          <input name="email" type="email" required maxLength={160} className={field} />
        </label>
      </div>
      <label className="mt-4 block text-sm text-muted">
        Tu opinión
        <textarea name="text" required minLength={10} maxLength={600} rows={4} className={field} />
      </label>
      {error && (
        <p role="alert" className="mt-4 text-[15px] text-red-600">
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Enviando…" : "Publicar reseña"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
