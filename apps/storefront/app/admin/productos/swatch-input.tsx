"use client";

import { useEffect, useRef, useState } from "react";
import { label } from "../ui";
import type { PaletteColor } from "../palette";

const HEX = /^#[0-9a-fA-F]{6}$/;

function Dot({ c, onPick, selected }: { c: PaletteColor; onPick: (c: PaletteColor) => void; selected: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onPick(c)}
      title={c.uses > 0 ? `${c.name} · usado ${c.uses} ${c.uses === 1 ? "vez" : "veces"}` : c.name}
      aria-label={c.name}
      aria-pressed={selected}
      className={`size-7 rounded-full border ${selected ? "border-[#5b4fe0] ring-2 ring-[#5b4fe0]/40" : "border-[#dcdce6]"}`}
      style={{ background: c.hex }}
    />
  );
}

/**
 * Color del círculo que se ve en la tienda. Se elige de los más usados / básicos (rellena también el nombre si está vacío)
 * o con el selector libre para un color nuevo. Vacío = sin círculo.
 */
export function SwatchInput({
  defaultValue,
  popular = [],
  basics = [],
  name = "swatch",
  labelName = "label",
  form,
}: {
  /** Nombre del campo del color y del campo del nombre (para varios colores en un mismo formulario). */
  name?: string;
  labelName?: string;
  /** id del formulario si los campos están fuera de él. */
  form?: string;
  defaultValue?: string | null;
  popular?: PaletteColor[];
  basics?: PaletteColor[];
}) {
  const [hex, setHex] = useState(defaultValue && HEX.test(defaultValue) ? defaultValue.toLowerCase() : "");
  const root = useRef<HTMLDivElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const initial = useRef(hex);
  // Avisa al botón de guardar de que hubo un cambio (el campo oculto no lo hace solo).
  useEffect(() => {
    if (hex !== initial.current) hidden.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [hex]);

  function pick(c: PaletteColor) {
    setHex(c.hex);
    // Rellena el nombre del color solo si el campo está vacío (no pisa lo que ya escribiste).
    const name = root.current?.closest("[data-color-card],form")?.querySelector<HTMLInputElement>(`input[name="${labelName}"]`);
    if (name && !name.value.trim()) name.value = c.name;
  }

  return (
    <div className={`${label} sm:col-span-2`} ref={root}>
      Color del círculo
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <input ref={hidden} type="hidden" name={name} form={form} value={hex} />
        <input
          type="color"
          aria-label="Elegir un color nuevo"
          value={hex || "#888888"}
          onChange={(e) => setHex(e.target.value.toLowerCase())}
          className="size-10 shrink-0 cursor-pointer rounded-full border border-[#dcdce6] bg-white p-0.5"
        />
        <span className="text-[13px] font-normal text-[#6b6b80]">{hex ? hex.toUpperCase() : "Sin círculo"}</span>
        {hex && (
          <button type="button" onClick={() => setHex("")} className="text-[12px] font-normal text-[#5b4fe0] underline">
            Quitar
          </button>
        )}
      </div>
      {popular.length > 0 && (
        <div className="mt-2">
          <p className="text-[12px] font-normal text-[#a0a0b2]">Más usados en la tienda</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {popular.map((c) => (
              <Dot key={c.hex} c={c} onPick={pick} selected={c.hex === hex} />
            ))}
          </div>
        </div>
      )}
      {basics.length > 0 && (
        <div className="mt-2">
          <p className="text-[12px] font-normal text-[#a0a0b2]">Básicos</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {basics.map((c) => (
              <Dot key={c.hex} c={c} onPick={pick} selected={c.hex === hex} />
            ))}
          </div>
        </div>
      )}
      <p className="mt-2 text-[12px] font-normal text-[#a0a0b2]">¿Otro color? Usa el círculo grande; al guardar queda en «Más usados» para los demás productos.</p>
    </div>
  );
}
