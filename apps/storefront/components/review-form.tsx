"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@nitro/ui";

const field = "mt-2 w-full rounded-button border border-ink/30 bg-transparent px-4 py-3 text-[17px] text-ink backdrop-blur-md";
const MAX = 3;
const MAX_BYTES = 6 * 1024 * 1024;

/** Formulario de reseña abierto: nombre, correo, estrellas, opinión y hasta 3 fotos. El correo no se publica. */
export function ReviewForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function pick(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)];
    if (next.length > MAX) setError(`Puedes subir hasta ${MAX} fotos.`);
    else if (next.some((f) => f.size > MAX_BYTES)) setError("Cada foto debe pesar menos de 6 MB.");
    else setError("");
    setFiles(next.filter((f) => f.size <= MAX_BYTES).slice(0, MAX));
    if (input.current) input.current.value = "";
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const body = new FormData();
    body.set("slug", slug);
    body.set("stars", String(stars));
    for (const k of ["name", "email", "text"]) body.set(k, String(f.get(k) ?? ""));
    files.forEach((file) => body.append("photos", file));
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
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
    <form onSubmit={submit} className="glass mt-8 max-w-xl rounded-card p-5 sm:p-7">
      <h3 className="text-[22px] font-semibold">Tu reseña</h3>
      <p className="mt-2 text-[15px] text-muted">Cuéntanos qué tal te fue. Tu correo no se publica.</p>
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
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm text-muted">
          Tu nombre
          <input name="name" required minLength={2} maxLength={60} autoComplete="name" className={field} />
        </label>
        <label className="block text-sm text-muted">
          Tu correo
          <input name="email" type="email" required maxLength={160} autoComplete="email" className={field} />
        </label>
      </div>
      <label className="mt-4 block text-sm text-muted">
        Tu opinión
        <textarea name="text" required minLength={10} maxLength={600} rows={4} className={field} />
      </label>

      <div className="mt-4">
        <p className="text-sm text-muted">Fotos (opcional, hasta {MAX})</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files)} />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {previews.map((src, i) => (
            <div key={src} className="relative size-20 overflow-hidden rounded-[12px] border border-ink/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Foto ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                aria-label={`Quitar la foto ${i + 1}`}
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/75 text-[13px] leading-none text-white"
              >
                ✕
              </button>
            </div>
          ))}
          {files.length < MAX && (
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="grid size-20 place-items-center rounded-[12px] border border-dashed border-ink/40 text-center text-[12px] leading-tight text-muted hover:border-ink hover:text-ink"
            >
              + Agregar
              <br />
              foto
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-[15px] text-red-600">
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? (files.length > 0 ? "Enviando fotos…" : "Enviando…") : "Publicar reseña"}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
