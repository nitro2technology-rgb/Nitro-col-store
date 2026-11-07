"use client";

import { useEffect, useRef, useState } from "react";

const btn =
  "inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#5b4fe0] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#4a3fd0] disabled:cursor-not-allowed disabled:opacity-50";

const spinner = (
  <svg viewBox="0 0 24 24" className="size-4 animate-spin" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/**
 * Botón de guardar con estado visible. Se asocia a su formulario (también con el atributo `form`, aunque esté fuera):
 *  - Sin cambios: desactivado y dice «Sin cambios por guardar».
 *  - Tras tocar cualquier campo: se activa y dice «Hay cambios sin guardar».
 *  - Al enviar: se bloquea y dice «Guardando…», y no deja enviar otra vez (así no se duplican fotos ni ventas).
 * Al terminar, la página se recarga con la clave `v` nueva y el botón vuelve a empezar desactivado.
 * Con `requireChange={false}` (formularios que nacen completos) solo se bloquea al enviar.
 */
export function SaveButton({
  children = "Guardar",
  pendingText = "Guardando… no cierres esta página",
  form,
  requireChange = true,
  disabled = false,
}: {
  children?: React.ReactNode;
  pendingText?: string;
  /** id del formulario si el botón está fuera de él. */
  form?: string;
  requireChange?: boolean;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    const f = ref.current?.form;
    if (!f) return;
    const touched = (e: Event) => {
      if ((e.target as HTMLInputElement | null)?.form === f) setDirty(true);
    };
    const submit = (e: Event) => {
      if (busyRef.current) {
        e.preventDefault(); // un segundo envío mientras se guarda
        return;
      }
      busyRef.current = true;
      setBusy(true);
    };
    document.addEventListener("input", touched);
    document.addEventListener("change", touched);
    f.addEventListener("submit", submit);
    return () => {
      document.removeEventListener("input", touched);
      document.removeEventListener("change", touched);
      f.removeEventListener("submit", submit);
    };
  }, [form]);

  useEffect(() => {
    if (!busy) return;
    const t = setTimeout(() => {
      busyRef.current = false;
      setBusy(false);
    }, 120_000);
    return () => clearTimeout(t);
  }, [busy]);

  const locked = disabled || busy || (requireChange && !dirty);
  return (
    <>
      <button ref={ref} type="submit" form={form} disabled={locked} aria-busy={busy} className={btn}>
        {busy && spinner}
        {busy ? "Guardando…" : children}
      </button>
      <span role="status" aria-live="polite" className={`text-[13px] ${busy ? "font-semibold text-[#5b4fe0]" : "text-[#6b6b80]"}`}>
        {busy ? pendingText : requireChange ? (dirty ? "Hay cambios sin guardar." : "Sin cambios por guardar.") : ""}
      </span>
    </>
  );
}

/**
 * «Eliminar seleccionadas (n)»: cuenta las casillas marcadas con el nombre dado que pertenecen al formulario `form`,
 * pide confirmación y bloquea el botón al enviar para no borrar dos veces.
 */
export function DeleteSelectedButton({ form, name, noun = "fotos" }: { form: string; name: string; noun?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const checked = () => document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${name}"][form="${form}"]:checked`).length;
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement | null;
      if (t?.name === name && t.getAttribute("form") === form) setCount(checked());
    };
    document.addEventListener("change", onChange);
    return () => document.removeEventListener("change", onChange);
  }, [form, name]);

  useEffect(() => {
    const f = document.getElementById(form) as HTMLFormElement | null;
    if (!f) return;
    const submit = (e: Event) => {
      if (busy) {
        e.preventDefault();
        return;
      }
      if (!window.confirm(`¿Eliminar ${count} ${noun}? No se puede deshacer.`)) {
        e.preventDefault();
        return;
      }
      setBusy(true);
    };
    f.addEventListener("submit", submit);
    return () => f.removeEventListener("submit", submit);
  }, [form, name, noun, count, busy]);

  return (
    <button
      ref={ref}
      type="submit"
      form={form}
      disabled={count === 0 || busy}
      aria-busy={busy}
      className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-red-300 px-4 py-2 text-[14px] font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy && spinner}
      {busy ? "Eliminando…" : count > 0 ? `Eliminar seleccionadas (${count})` : "Eliminar seleccionadas"}
    </button>
  );
}
