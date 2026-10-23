"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildSearchIndex, normalizeText } from "@/lib/products";

const MAX = 12;

/** Icono de búsqueda y panel: encuentra productos por nombre, color o cualquier palabra clave. */
export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const index = useMemo(() => (open ? buildSearchIndex() : []), [open]);

  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  // Se compara la raíz de cada palabra, así "negros" encuentra "negro" y "negras".
  const words = normalizeText(query).split(/\s+/).filter(Boolean).map((w) => (w.length > 4 ? w.replace(/(as|os|es|a|o|s)$/, "") : w));
  const results = words.length === 0 ? [] : index.filter((e) => words.every((w) => e.haystack.includes(w)));

  return (
    <div ref={wrap}>
      <button
        type="button"
        aria-label="Buscar productos"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="nav-fx"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
      </button>

      {open && (
        <div role="search" className="menu-in glass-nav absolute inset-x-0 top-full rounded-b-[28px]" style={{ background: "rgb(20 20 20 / 0.95)" }}>
          <div className="mx-auto max-w-[720px] px-6 py-8">
            <input
              ref={input}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca por nombre, color o palabra clave"
              aria-label="Buscar productos"
              className="w-full rounded-button border border-ink/30 bg-transparent px-5 py-3 text-[17px] text-ink placeholder:text-ink/50"
            />
            <div aria-live="polite" className="mt-5 max-h-[55vh] overflow-y-auto">
              {words.length > 0 && results.length === 0 && (
                <p className="text-[15px] text-ink/70">No encontramos productos con “{query}”.</p>
              )}
              <ul className="space-y-1">
                {results.slice(0, MAX).map((r) => (
                  <li key={r.key}>
                    <Link href={r.href} className="flex items-center gap-4 rounded-card p-2 transition-colors hover:bg-ink/10">
                      {r.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image} alt="" className="size-14 shrink-0 rounded-[14px] bg-white object-contain" />
                      ) : (
                        <span className="size-14 shrink-0 rounded-[14px] bg-ink/10" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-[17px] font-semibold">{r.title}</span>
                        <span className="block truncate text-[14px] text-ink/70">{r.subtitle}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {results.length > MAX && (
                <p className="mt-3 text-[14px] text-ink/70">Y {results.length - MAX} más. Escribe más palabras para afinar.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
