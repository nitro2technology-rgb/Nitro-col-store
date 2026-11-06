"use client";

import { useMemo, useState } from "react";
import type { Product } from "@nitro/shared";
import { ProductTile } from "@/components/product-tile";
import { colorFamilies } from "@/lib/products";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Sort = "destacados" | "precio-asc" | "precio-desc" | "nombre";

/** Grupo de filtros plegable con casillas y cuántos productos tiene cada opción (como el inventario de referencia). */
function FilterGroup({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: { name: string; count: number }[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  if (options.length < 2) return null;
  const toggle = (o: string) => {
    const next = new Set(selected);
    if (next.has(o)) next.delete(o);
    else next.add(o);
    onChange(next);
  };
  return (
    <details open className="group border-t border-ink/20 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[17px] [&::-webkit-details-marker]:hidden">
        {title}
        {selected.size > 0 && <span className="ml-2 text-[13px] text-muted">({selected.size})</span>}
        <span aria-hidden="true" className="ml-auto text-[20px] leading-none group-open:hidden">
          +
        </span>
        <span aria-hidden="true" className="ml-auto hidden text-[20px] leading-none group-open:inline">
          −
        </span>
      </summary>
      <ul className="mt-3 max-h-[320px] space-y-2.5 overflow-y-auto pr-1">
        {options.map((o) => (
          <li key={o.name}>
            <label className="flex cursor-pointer items-center gap-3 text-[15px]">
              <input type="checkbox" checked={selected.has(o.name)} onChange={() => toggle(o.name)} className="size-[18px] shrink-0 rounded-[5px] accent-current" />
              <span className="flex-1">{o.name}</span>
              <span className="text-muted">({o.count})</span>
            </label>
          </li>
        ))}
      </ul>
    </details>
  );
}

/**
 * Lista de productos con filtros laterales (Color, Modelo, Tipo), buscador, orden y contador, como el inventario de
 * referencia. Con `byColor`, cada color de cada modelo es su propia tarjeta (ej. las 5 Vintage completas).
 */
export function CatalogGrid({ products, byColor = false }: { products: Product[]; byColor?: boolean }) {
  const [query, setQuery] = useState("");
  const [colors, setColors] = useState<Set<string>>(new Set());
  const [models, setModels] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<Sort>("destacados");
  const [showFilters, setShowFilters] = useState(true);

  const colorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) if (p.variants.length > 1) for (const v of p.variants) for (const c of colorFamilies(v.label)) counts.set(c, (counts.get(c) ?? 0) + 1);
    return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [products]);
  const typeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) for (const t of p.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [products]);
  const modelOptions = useMemo(
    () => products.map((p) => ({ name: p.name, count: byColor ? p.variants.length : 1 })).sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true })),
    [products, byColor],
  );

  const shown = useMemo(() => {
    const q = norm(query.trim());
    const matchesColor = (label: string) => colors.size === 0 || colorFamilies(label).some((c) => colors.has(c));
    const list = products
      .filter((p) => models.size === 0 || models.has(p.name))
      .filter((p) => types.size === 0 || (p.tags ?? []).some((t) => types.has(t)))
      .flatMap((p) => {
        const variants = p.variants.filter((v) => matchesColor(v.label));
        if (variants.length === 0) return [];
        if (byColor) {
          return variants
            .filter((v) => !q || norm(`${p.name} ${p.brand} ${v.label}`).includes(q))
            .map((v) => ({ key: v.sku, product: p, sku: v.sku, price: v.priceCents }));
        }
        if (q && !norm(`${p.name} ${p.brand}`).includes(q)) return [];
        return [{ key: p.slug, product: p, sku: colors.size > 0 ? variants[0]!.sku : undefined, price: Math.min(...variants.map((v) => v.priceCents)) }];
      });
    if (sort === "precio-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "precio-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "nombre") return [...list].sort((a, b) => a.product.name.localeCompare(b.product.name, "es", { numeric: true }));
    return list;
  }, [products, query, colors, models, types, byColor, sort]);

  const active = colors.size + models.size + types.size;
  const clear = () => {
    setColors(new Set());
    setModels(new Set());
    setTypes(new Set());
    setQuery("");
  };
  const hasFilters = colorOptions.length > 1 || modelOptions.length > 1 || typeOptions.length > 1;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          {hasFilters && (
            <button type="button" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} className="flex items-center gap-2 text-[17px] font-semibold">
              {showFilters ? "Ocultar filtro" : "Mostrar filtro"}
              {active > 0 && <span className="rounded-full bg-ink px-2 text-[12px] text-canvas">{active}</span>}
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
                <circle cx="16" cy="7" r="2" />
                <circle cx="8" cy="17" r="2" />
              </svg>
            </button>
          )}
          <p className="text-[16px] text-muted" aria-live="polite">
            {shown.length} {shown.length === 1 ? "producto" : "productos"}
          </p>
        </div>
        <label className="flex items-center gap-3 text-[16px]">
          <span className="font-semibold">Ordenar por</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-[10px] border border-ink/25 bg-canvas/70 px-3 py-2 text-[15px] backdrop-blur-md">
            <option value="destacados">Destacados</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="nombre">Nombre (A–Z)</option>
          </select>
        </label>
      </div>

      <div className={`mt-6 grid gap-8 ${showFilters && hasFilters ? "lg:grid-cols-[260px_1fr]" : ""}`}>
        {showFilters && hasFilters && (
          <aside aria-label="Filtros" className="lg:sticky lg:top-24 lg:self-start">
            <label className="block text-[15px] font-semibold">
              Buscar por nombre
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Ej. ${products[0]?.name ?? ""}`}
                className="mt-2 w-full rounded-[10px] border border-ink/25 bg-canvas/70 px-3 py-2.5 text-[16px] font-normal backdrop-blur-md"
              />
            </label>
            <div className="mt-5">
              <FilterGroup title="Color" options={colorOptions} selected={colors} onChange={setColors} />
              <FilterGroup title="Modelo" options={modelOptions} selected={models} onChange={setModels} />
              <FilterGroup title="Tipo" options={typeOptions} selected={types} onChange={setTypes} />
              <div className="border-t border-ink/20" />
            </div>
            {active > 0 && (
              <button type="button" onClick={clear} className="mt-3 text-[14px] underline underline-offset-4">
                Quitar todos los filtros
              </button>
            )}
          </aside>
        )}

        <div>
          <section
            className={
              byColor
                ? `grid grid-cols-2 gap-3 md:gap-5 ${showFilters && hasFilters ? "md:grid-cols-3" : "md:grid-cols-3 xl:grid-cols-4"}`
                : "flex flex-wrap gap-6"
            }
          >
            {shown.map(({ key, product, sku }) => (
              <ProductTile key={key} product={product} sku={sku} showColor={byColor} />
            ))}
          </section>
          {shown.length === 0 && <p className="mt-6 text-[17px] text-muted">No hay productos con esos filtros.</p>}
        </div>
      </div>
    </div>
  );
}
