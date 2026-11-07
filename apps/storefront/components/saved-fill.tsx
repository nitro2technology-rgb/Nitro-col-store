"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Addr = { id: string; fullName: string; phone: string; department: string; city: string; line: string; notes: string; isDefault: boolean };
type Saved = { signedIn: boolean; email?: string; name?: string; phone?: string; addresses?: Addr[] };

let cache: Promise<Saved> | null = null;
const load = (): Promise<Saved> => (cache ??= fetch("/api/cuenta/datos", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { signedIn: false })).catch(() => ({ signedIn: false })));

function setValue(form: HTMLFormElement, name: string, value: string) {
  const el = form.elements.namedItem(name);
  if (el instanceof HTMLInputElement) el.value = value;
}

/**
 * Dentro de un formulario de pedido: con sesión, rellena nombre, correo, celular y la dirección principal guardados,
 * deja elegir otra dirección y ofrece guardar los datos de este pedido para la próxima vez (campo `saveData`).
 * Solo rellena campos que la persona aún no escribió.
 */
export function SavedFill() {
  const anchor = useRef<HTMLSpanElement>(null);
  const [saved, setSaved] = useState<Saved | null>(null);

  const fill = (form: HTMLFormElement, a: Addr | undefined, s: Saved, force: boolean) => {
    const put = (name: string, value: string | undefined) => {
      const el = form.elements.namedItem(name);
      if (value && el instanceof HTMLInputElement && (force || !el.value)) el.value = value;
    };
    const full = a?.fullName || s.name || "";
    if (form.elements.namedItem("lastname")) {
      const [first, ...rest] = full.split(" ");
      put("name", first);
      put("lastname", rest.join(" "));
    } else {
      put("name", full);
    }
    put("email", s.email);
    put("phone", a?.phone || s.phone);
    if (a) {
      put("department", a.department);
      put("city", a.city);
      put("line", a.line);
      put("notes", a.notes);
    }
  };

  useEffect(() => {
    let alive = true;
    load().then((s: Saved) => {
      if (!alive) return;
      setSaved(s);
      const form = anchor.current?.closest("form");
      if (form && s.signedIn) fill(form, s.addresses?.find((a) => a.isDefault) ?? s.addresses?.[0], s, false);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span ref={anchor} className="contents">
      {saved?.signedIn && (saved.addresses?.length ?? 0) > 1 && (
        <label className="block text-[13px] text-muted sm:col-span-2">
          Usar una dirección guardada
          <select
            className="mt-1 w-full rounded-button border border-ink/30 bg-transparent px-3 py-2.5 text-[16px] text-ink"
            defaultValue={saved.addresses?.find((a) => a.isDefault)?.id ?? saved.addresses?.[0]?.id}
            onChange={(e) => {
              const form = anchor.current?.closest("form");
              const a = saved.addresses?.find((x) => x.id === e.target.value);
              if (form && a) fill(form, a, saved, true);
            }}
          >
            {saved.addresses?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.line}, {a.city}
                {a.isDefault ? " (principal)" : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      {saved?.signedIn && (
        <label className="flex items-start gap-3 text-[14px] sm:col-span-2">
          <input type="checkbox" name="saveData" defaultChecked className="mt-1 size-4" />
          <span>
            Guardar estos datos en mi cuenta para mis próximas compras.{" "}
            <Link href="/cuenta#datos" className="text-link hover:underline">
              Ver mis direcciones
            </Link>
          </span>
        </label>
      )}
      {saved && !saved.signedIn && (
        <p className="text-[13px] text-muted sm:col-span-2">
          ¿Ya tienes cuenta?{" "}
          <Link href="/ingresar?next=/checkout" className="text-link hover:underline">
            Inicia sesión
          </Link>{" "}
          y usamos tus datos guardados.
        </p>
      )}
    </span>
  );
}
