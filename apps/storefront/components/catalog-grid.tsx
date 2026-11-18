"use client";

import { useMemo, useState } from "react";
import type { Product } from "@nitro/shared";
import { ProductTile } from "@/components/product-tile";
import { colorFamilies, totalStock } from "@/lib/products";

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
  if (options.length < 1) return null;
  const toggle = (o: string) => {
    const next = new Set(selected);
    if (next.has(o)) next.delete(o);
    else next.add(o);
    onChange(next);
  };
  return (
    <details className="group border-t border-ink/20 py-2.5 md:py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[14px] md:text-[17px] [&::-webkit-details-marker]:hidden">
        {title}
        {selected.size > 0 && <span className="ml-2 text-[12px] text-muted md:text-[13px]">({selected.size})</span>}
        <span aria-hidden="true" className="ml-auto text-[18px] leading-none md:text-[20px] group-open:hidden">
          +
        </span>
        <span aria-hidden="true" className="ml-auto hidden text-[18px] leading-none md:text-[20px] group-open:inline">
          −
        </span>
      </summary>
      <ul className="mt-2 max-h-[220px] space-y-1.5 overflow-y-auto pr-1 md:mt-3 md:max-h-[320px] md:space-y-2.5">
        {options.map((o) => (
          <li key={o.name}>
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] md:gap-3 md:text-[15px]">
              <input type="checkbox" checked={selected.has(o.name)} onChange={() => toggle(o.name)} className="size-4 shrink-0 rounded-[4px] accent-current md:size-[18px] md:rounded-[5px]" />
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
  const [showFilters, setShowFilters] = useState(false);

  const colorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) for (const v of p.variants) for (const c of colorFamilies(v.label)) counts.set(c, (counts.get(c) ?? 0) + 1);
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
            .map((v) => ({ key: v.sku, product: p, sku: v.sku, price: v.priceCents, stock: Math.max(0, v.stock) }));
        }
        if (q && !norm(`${p.name} ${p.brand}`).includes(q)) return [];
        return [{ key: p.slug, product: p, sku: colors.size > 0 ? variants[0]!.sku : undefined, price: Math.min(...variants.map((v) => v.priceCents)), stock: totalStock(p) }];
      });
    if (sort === "precio-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "precio-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "nombre") return [...list].sort((a, b) => a.product.name.localeCompare(b.product.name, "es", { numeric: true }));
    // «Destacados»: con más stock primero y los agotados al final.
    return [...list].sort((a, b) => b.stock - a.stock);
  }, [products, query, colors, models, types, byColor, sort]);

  const active = colors.size + models.size + types.size;
  const clear = () => {
    setColors(new Set());
    setModels(new Set());
    setTypes(new Set());
    setQuery("");
  };
  const hasFilters = products.length > 0;

  return (
    <div className="mt-3 md:mt-8">
      <div className="plate flex items-center justify-between gap-3 md:flex-wrap md:gap-4">
        <div className="flex items-center gap-3 md:gap-5">
          {hasFilters && (
            <button type="button" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} className="flex items-center gap-1.5 text-[14px] font-semibold md:gap-2 md:text-[17px]">
              {showFilters ? "Ocultar filtro" : "Filtros"}
              {active > 0 && <span className="rounded-full bg-ink px-2 text-[11px] text-canvas md:text-[12px]">{active}</span>}
              <svg viewBox="0 0 24 24" className="size-4 md:size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
                <circle cx="16" cy="7" r="2" />
                <circle cx="8" cy="17" r="2" />
              </svg>
            </button>
          )}
          <p className="text-[13px] text-muted md:text-[16px]" aria-live="polite">
            {shown.length} {shown.length === 1 ? "producto" : "productos"}
          </p>
        </div>
        <label className="flex items-center gap-3 text-[16px]">
          <span className="hidden font-semibold md:inline">Ordenar por</span>
          <select aria-label="Ordenar por" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-[10px] border border-ink/25 bg-canvas/70 px-2 py-1.5 text-[13px] backdrop-blur-md md:px-3 md:py-2 md:text-[15px]">
            <option value="destacados">Destacados</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="nombre">Nombre (A–Z)</option>
          </select>
        </label>
      </div>

      <div className={`mt-3 grid gap-4 md:mt-6 md:gap-8 ${showFilters && hasFilters ? "lg:grid-cols-[260px_1fr]" : ""}`}>
        {showFilters && hasFilters && (
          <aside aria-label="Filtros" className="plate lg:sticky lg:top-24 lg:self-start">
            <label className="block text-[13px] font-semibold md:text-[15px]">
              Buscar por nombre
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Ej. ${products[0]?.name ?? ""}`}
                className="mt-1.5 w-full rounded-[10px] border border-ink/25 bg-canvas/70 px-3 py-2 text-[16px] font-normal backdrop-blur-md md:mt-2 md:py-2.5"
              />
            </label>
            <div className="mt-3 md:mt-5">
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
          {shown.length === 0 && <p className="plate mt-6 inline-block text-[17px] text-muted">No hay productos con esos filtros.</p>}
        </div>
      </div>
    </div>
  );
}
