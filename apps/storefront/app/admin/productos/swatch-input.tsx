"use client";

import { useState } from "react";
import { label } from "../ui";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Elige el color del círculo que se ve en la tienda junto al nombre del color. Vacío = sin círculo. */
export function SwatchInput({ defaultValue }: { defaultValue?: string | null }) {
  const [hex, setHex] = useState(defaultValue && HEX.test(defaultValue) ? defaultValue.toLowerCase() : "");
  return (
    <div className={label}>
      Color del círculo
      <div className="mt-1 flex items-center gap-3">
        <input type="hidden" name="swatch" value={hex} />
        <input
          type="color"
          aria-label="Elegir el color del círculo"
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
    </div>
  );
}
