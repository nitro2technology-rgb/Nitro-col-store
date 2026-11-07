"use client";

import { useEffect, useState } from "react";
import { applyPrices } from "../actions";
import { SaveButton } from "../save-button";
import { field, label } from "../ui";

const SEL = 'input[type="checkbox"][name="slug"][form="bulk"]';

/**
 * Aplica el mismo precio, oferta y/o costo a todos los colores de los productos que marques en el catálogo.
 * Los campos vacíos no se tocan. Las casillas están en cada tarjeta (atributo form="bulk").
 */
export function BulkPrices() {
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const recount = () => {
      setCount(document.querySelectorAll(`${SEL}:checked`).length);
      setTotal(document.querySelectorAll(SEL).length);
    };
    document.addEventListener("change", recount);
    recount();
    return () => document.removeEventListener("change", recount);
  }, []);

  function toggleAll(on: boolean) {
    document.querySelectorAll<HTMLInputElement>(SEL).forEach((el) => {
      if (el.checked !== on) el.click();
    });
  }

  return (
    <details className="mt-6 rounded-[14px] border border-[#e6e6ee] bg-white p-5">
      <summary className="cursor-pointer text-[15px] font-semibold text-[#1d1b3a]">Aplicar el mismo precio, oferta o costo a varios productos</summary>
      <form id="bulk" action={applyPrices} className="mt-4">
        <p className="text-[13px] text-[#6b6b80]">
          Marca los productos con la casilla de su tarjeta (o usa «Marcar todos los que se ven»), escribe lo que quieras cambiar y guarda. Se aplica a <b>todos los colores</b> de cada producto marcado. Lo que dejes vacío no se cambia.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className={label}>
            Precio normal
            <input name="price" inputMode="numeric" placeholder="No cambiar" className={`${field} mt-1`} />
          </label>
          <label className={label}>
            Precio de oferta
            <input name="offer" inputMode="numeric" placeholder="No cambiar" className={`${field} mt-1`} />
            <span className="mt-1 flex items-center gap-1.5 text-[12px] font-normal text-[#6b6b80]">
              <input type="checkbox" name="clearOffer" className="size-4" /> Quitar la oferta
            </span>
          </label>
          <label className={label}>
            Me costó cada uno
            <input name="cost" inputMode="numeric" placeholder="No cambiar" className={`${field} mt-1`} />
          </label>
          <div className="flex flex-col justify-end gap-2">
            <button type="button" onClick={() => toggleAll(count < total)} className="rounded-[10px] border border-[#dcdce6] px-4 py-2 text-[14px] font-semibold hover:border-[#5b4fe0] hover:text-[#5b4fe0]">
              {total > 0 && count === total ? "Desmarcar todos" : "Marcar todos los que se ven"}
            </button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <SaveButton form="bulk" pendingText="Aplicando precios… no cierres esta página" disabled={count === 0}>
            {count === 0 ? "Aplicar a los marcados" : `Aplicar a ${count} ${count === 1 ? "producto" : "productos"}`}
          </SaveButton>
        </div>
      </form>
    </details>
  );
}
