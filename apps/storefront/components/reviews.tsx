import type { Review } from "@/lib/reviews";

function Stars({ n }: { n: number }) {
  return (
    <span className="text-[19px] tracking-[0.15em]" role="img" aria-label={`${n} de 5 estrellas`}>
      {"★".repeat(n)}
      <span className="text-muted/40">{"★".repeat(5 - n)}</span>
    </span>
  );
}

const fmt = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function Reviews({ reviews, titleClass }: { reviews: Review[]; titleClass: string }) {
  const avg = reviews.reduce((s, r) => s + r.stars, 0) / reviews.length;
  return (
    <section className="mx-auto max-w-[1440px] px-6 pb-28">
      <h2 className={titleClass}>Reseñas.</h2>
      <p className="mt-4 flex items-center gap-3 text-[17px] text-muted">
        <Stars n={Math.round(avg)} />
        {avg.toFixed(1)} · {reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reviews.map((r) => (
          <article key={`${r.author}-${r.date}`} className="glass p-7">
            <Stars n={r.stars} />
            <p className="mt-4 text-[17px] leading-[1.47]">{r.text}</p>
            <p className="mt-5 text-[14px] text-muted">
              {r.author} · {fmt.format(new Date(r.date))}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
