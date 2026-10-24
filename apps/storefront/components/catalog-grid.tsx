"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@nitro/shared";
import { ProductTile } from "@/components/product-tile";
import { colorFamilies } from "@/lib/products";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Botón que abre una lista de opciones (se pueden marcar varias). */
function FilterMenu({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const toggle = (o: string) => {
    const next = new Set(selected);
    if (next.has(o)) next.delete(o);
    else next.add(o);
    onChange(next);
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(!open)}
        className={`rounded-button border border-ink/30 px-5 py-3 text-[17px] backdrop-blur-md transition-colors ${
          selected.size > 0 ? "bg-ink text-canvas" : "text-ink hover:bg-ink/10"
        }`}
      >
        {label}
        {selected.size > 0 && ` (${selected.size})`} <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="glass absolute left-0 top-full z-20 mt-2 max-h-[320px] min-w-[220px] overflow-y-auto rounded-card p-3 text-ink">
          {selected.size > 0 && (
            <button type="button" onClick={() => onChange(new Set())} className="mb-1 w-full rounded-chip px-3 py-2 text-left text-sm text-muted hover:text-ink">
              Quitar selección
            </button>
          )}
          {options.map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-3 rounded-chip px-3 py-2 text-[15px] hover:bg-ink/10">
              <input type="checkbox" checked={selected.has(o)} onChange={() => toggle(o)} className="size-4 accent-current" />
              {o}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Lista de productos con búsqueda por nombre y filtros de Color y Modelo.
 * Con `byColor`, cada color de cada modelo es su propia tarjeta (ej. las 5 Vintage completas).
 */
export function CatalogGrid({ products, byColor = false }: { products: Product[]; byColor?: boolean }) {
  const [query, setQuery] = useState("");
  const [colors, setColors] = useState<Set<string>>(new Set());
  const [models, setModels] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Set<string>>(new Set());

  const colorOptions = useMemo(
    () => [...new Set(products.filter((p) => p.variants.length > 1).flatMap((p) => p.variants.flatMap((v) => colorFamilies(v.label))))].sort((a, b) => a.localeCompare(b, "es")),
    [products],
  );
  const typeOptions = useMemo(() => [...new Set(products.flatMap((p) => p.tags ?? []))].sort((a, b) => a.localeCompare(b, "es")), [products]);
  const modelOptions = useMemo(() => products.map((p) => p.name).sort((a, b) => a.localeCompare(b, "es", { numeric: true })), [products]);

  const shown = useMemo(() => {
    const q = norm(query.trim());
    const matchesColor = (label: string) => colors.size === 0 || colorFamilies(label).some((c) => colors.has(c));
    return products
      .filter((p) => models.size === 0 || models.has(p.name))
      .filter((p) => types.size === 0 || (p.tags ?? []).some((t) => types.has(t)))
      .flatMap((p) => {
        const variants = p.variants.filter((v) => matchesColor(v.label));
        if (variants.length === 0) return [];
        if (byColor) {
          return variants
            .filter((v) => !q || norm(`${p.name} ${p.brand} ${v.label}`).includes(q))
            .map((v) => ({ key: v.sku, product: p, sku: v.sku }));
        }
        if (q && !norm(`${p.name} ${p.brand}`).includes(q)) return [];
        return [{ key: p.slug, product: p, sku: colors.size > 0 ? variants[0]!.sku : undefined }];
      });
  }, [products, query, colors, models, types, byColor]);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-end gap-3">
        <label className="block min-w-[220px] flex-1 text-sm text-muted sm:max-w-md">
          Buscar por nombre
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ej. ${products[0]?.name ?? ""}`}
            className="mt-2 w-full rounded-button border border-ink/30 bg-transparent px-4 py-3 text-[17px] text-ink backdrop-blur-md"
          />
        </label>
        {colorOptions.length > 1 && <FilterMenu label="Color" options={colorOptions} selected={colors} onChange={setColors} />}
        {modelOptions.length > 1 && <FilterMenu label="Modelo" options={modelOptions} selected={models} onChange={setModels} />}
        {typeOptions.length > 1 && <FilterMenu label="Tipo" options={typeOptions} selected={types} onChange={setTypes} />}
      </div>

      <p className="mt-8 text-[20px] text-muted" aria-live="polite">
        {shown.length} {shown.length === 1 ? "producto" : "productos"}
      </p>

      <section
        className={
          byColor
            ? "mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4"
            : "mt-6 flex flex-wrap gap-6"
        }
      >
        {shown.map(({ key, product, sku }) => (
          <ProductTile key={key} product={product} sku={sku} showColor={byColor} />
        ))}
      </section>
      {shown.length === 0 && <p className="mt-6 text-[17px] text-muted">No hay productos con esos filtros.</p>}
    </>
  );
}
