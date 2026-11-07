"use client";

import { useState } from "react";
import { formatCOP } from "@nitro/shared";
import { field, label } from "../ui";
import type { PaletteColor } from "../palette";
import { SwatchInput } from "./swatch-input";

export type VariantRow = {
  sku: string;
  label: string;
  swatch: string | null;
  photo?: { url: string; alt: string };
  /** En pesos (sin centavos), como se escriben en el formulario. */
  regular: number;
  offer: number | null;
  cost: number | null;
  stock: number;
  reserved: number;
  lowAt: number;
};

const num = (s: string) => {
  const clean = s.replace(/[.\s$]/g, "");
  return /^\d+$/.test(clean) ? Number(clean) : null;
};
const money = (pesos: number) => formatCOP(pesos * 100);

/** Un color del producto: precios, costo y stock, con la ganancia calculada mientras se escribe. */
export function VariantForm({ v, palette, form, children }: { v: VariantRow; form: string; palette: { popular: PaletteColor[]; basics: PaletteColor[] }; children?: React.ReactNode }) {
  const [regular, setRegular] = useState(String(v.regular));
  const [offer, setOffer] = useState(v.offer ? String(v.offer) : "");
  const [cost, setCost] = useState(v.cost != null ? String(v.cost) : "");
  const [stock, setStock] = useState(String(v.stock));

  const n = (f: string) => `v__${v.sku}__${f}`;
  const r = num(regular);
  const o = offer ? num(offer) : null;
  const c = cost ? num(cost) : null;
  const s = num(stock) ?? 0;
  const charged = o && r && o < r ? o : r;
  const profit = charged != null && c != null ? charged - c : null;
  const margin = profit != null && charged ? (profit / charged) * 100 : null;
  const discount = o && r && o < r ? Math.round((1 - o / r) * 100) : null;
  const offerInvalid = !!offer && (o === null || (r !== null && o >= r));

  return (
    <div className="rounded-[14px] border border-[#e6e6ee] bg-white">
    <div data-color-card>
      <input type="hidden" name="skus" form={form} value={v.sku} />
      <div className="grid gap-5 p-5 md:grid-cols-[120px_1fr]">
        <div className="aspect-square overflow-hidden rounded-[10px] bg-[#f3f3f8]">
          {v.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.photo.url} alt={v.photo.alt} loading="lazy" className="size-full object-contain p-2" />
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className={`${label} sm:col-span-2`}>
            Color o versión
            <input name={n("label")} form={form} required maxLength={60} defaultValue={v.label} className={`${field} mt-1`} />
            <span className="mt-1 block text-[12px] font-normal text-[#a0a0b2]">Código {v.sku}</span>
          </label>
          <SwatchInput name={n("swatch")} labelName={n("label")} form={form} defaultValue={v.swatch} popular={palette.popular} basics={palette.basics} />
          <label className={label}>
            Stock (unidades)
            <input name={n("stock")} form={form} inputMode="numeric" required value={stock} onChange={(e) => setStock(e.target.value)} className={`${field} mt-1`} />
            {v.reserved > 0 && <span className="mt-1 block text-[12px] font-normal text-amber-700">{v.reserved} apartadas por pagos en curso</span>}
          </label>
          <label className={label}>
            Avisar con poco stock
            <input name={n("lowAt")} form={form} inputMode="numeric" defaultValue={v.lowAt} className={`${field} mt-1`} />
          </label>
          <label className={label}>
            Precio normal
            <input name={n("price")} form={form} inputMode="numeric" required value={regular} onChange={(e) => setRegular(e.target.value)} className={`${field} mt-1`} />
          </label>
          <label className={label}>
            Precio de oferta
            <input
              name={n("offer")}
              form={form}
              inputMode="numeric"
              placeholder="Sin oferta"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              aria-invalid={offerInvalid}
              className={`${field} mt-1 ${offerInvalid ? "!border-red-400" : ""}`}
            />
            {offerInvalid ? (
              <span className="mt-1 block text-[12px] font-normal text-red-700">Debe ser menor que el normal</span>
            ) : discount ? (
              <span className="mt-1 block text-[12px] font-normal text-rose-700">−{discount} % · el normal sale tachado</span>
            ) : null}
          </label>
          <label className={label}>
            Me costó cada uno
            <input name={n("cost")} form={form} inputMode="numeric" placeholder="Sin registrar" value={cost} onChange={(e) => setCost(e.target.value)} className={`${field} mt-1`} />
          </label>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-b-[14px] border-t border-[#e6e6ee] bg-[#e6e6ee] text-[13px] md:grid-cols-4">
        <Figure term="Cobras" value={charged != null ? money(charged) : "—"} />
        <Figure
          term="Ganas por unidad"
          value={profit != null ? `${money(profit)}${margin != null ? ` · ${margin.toFixed(0)} %` : ""}` : "Falta el costo"}
          tone={profit != null && profit <= 0 ? "bad" : profit != null ? "good" : "muted"}
        />
        <Figure term="Invertido en este stock" value={c != null ? money(c * s) : "—"} />
        <Figure term="Ganancia si vendes todo" value={profit != null ? money(profit * s) : "—"} tone={profit != null && profit <= 0 ? "bad" : undefined} />
      </dl>
    </div>
    {children && <div className="space-y-5 border-t border-[#e6e6ee] p-5">{children}</div>}
    </div>
  );
}

function Figure({ term, value, tone }: { term: string; value: string; tone?: "good" | "bad" | "muted" }) {
  const color = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-red-700" : tone === "muted" ? "text-[#a0a0b2]" : "text-[#1d1b3a]";
  return (
    <div className="bg-[#fafafc] px-5 py-3">
      <dt className="text-[#6b6b80]">{term}</dt>
      <dd className={`text-[16px] font-semibold ${color}`}>{value}</dd>
    </div>
  );
}
