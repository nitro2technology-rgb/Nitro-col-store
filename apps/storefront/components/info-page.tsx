import type { ReactNode } from "react";

/** Contenedor común de las páginas informativas (ayuda, términos, privacidad). */
export function InfoPage({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-[820px] px-6 pb-28 pt-16 md:pt-24">
      <h1 className="text-[clamp(40px,7vw,80px)]">{title}</h1>
      {intro && <p className="mt-6 text-[20px] text-muted">{intro}</p>}
      <div className="mt-12 space-y-10">{children}</div>
    </main>
  );
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass rounded-card p-6 md:p-8">
      <h2 className="text-[24px] font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-[17px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

/** Aviso de texto pendiente de revisión legal. */
export function DraftNotice() {
  return (
    <p className="rounded-card border border-ink/20 p-4 text-sm text-muted">
      Texto provisional: pendiente de revisión por el dueño y asesoría legal antes de publicar.
    </p>
  );
}
