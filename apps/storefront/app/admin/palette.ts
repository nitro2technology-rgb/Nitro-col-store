// Colores para elegir al crear o editar un color de producto: los más usados en la tienda (salen solos de los
// colores ya guardados) y unos básicos predeterminados. Un color nuevo queda disponible apenas se guarda en algún producto.
export type PaletteColor = { name: string; hex: string; uses: number };

const DEFAULTS: [string, string][] = [
  ["Negro", "#111111"],
  ["Blanco", "#f5f5f5"],
  ["Gris", "#9ca3af"],
  ["Plateado", "#c0c0c0"],
  ["Dorado", "#c9a24d"],
  ["Beige", "#d9c7a8"],
  ["Café", "#7a5230"],
  ["Rojo", "#d33a3a"],
  ["Naranja", "#f2994a"],
  ["Amarillo", "#f2c94c"],
  ["Verde", "#3f9d5a"],
  ["Azul", "#3b6fb6"],
  ["Azul oscuro", "#1e3a5f"],
  ["Morado", "#7e57c2"],
  ["Lila", "#b7a3d6"],
  ["Rosado", "#f2b4c6"],
];

export async function getPalette(): Promise<{ popular: PaletteColor[]; basics: PaletteColor[] }> {
  const { db } = await import("@nitro/db");
  const rows = await db.productVariant.groupBy({
    by: ["swatch", "label"],
    where: { deletedAt: null, swatch: { not: null } },
    _count: { _all: true },
  });
  // Un mismo círculo con varios nombres ("Negro" / "Negras"): se queda el nombre más usado.
  const byHex = new Map<string, PaletteColor & { top: number }>();
  for (const r of rows) {
    const hex = r.swatch!.toLowerCase();
    const n = r._count._all;
    const cur = byHex.get(hex);
    if (!cur) byHex.set(hex, { name: r.label, hex, uses: n, top: n });
    else {
      cur.uses += n;
      if (n > cur.top) Object.assign(cur, { name: r.label, top: n });
    }
  }
  const popular = [...byHex.values()]
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 14)
    .map(({ name, hex, uses }) => ({ name, hex, uses }));
  const taken = new Set(popular.map((c) => c.hex));
  const basics = DEFAULTS.filter(([, hex]) => !taken.has(hex)).map(([name, hex]) => ({ name, hex, uses: 0 }));
  return { popular, basics };
}
