import { Rail } from "@/components/rail";
import type { IgPost, IgReview } from "@/lib/site-settings";

/** Reseñas que los clientes dejaron en Instagram (imagen + comentario), subidas desde el panel. */
export function HomeIgReviews({ reviews }: { reviews: IgReview[] }) {
  if (reviews.length === 0) return null;
  return (
    <section aria-labelledby="reseñas-ig" className="mx-auto max-w-[1440px] px-4 py-14 md:px-8 md:py-20">
      <h2 id="reseñas-ig" className="text-[clamp(26px,3.4vw,40px)] font-semibold">
        Lo que dicen de nosotros en Instagram
      </h2>
      <div className="mt-6">
        <Rail label="Reseñas de Instagram">
          {reviews.map((r, i) => (
            <figure key={i} className="flex w-[78vw] max-w-[340px] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] bg-[#111827] text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.image} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              <figcaption className="flex flex-1 flex-col justify-between gap-3 p-5">
                {r.text && <blockquote className="text-[15px] leading-snug text-white/90">“{r.text}”</blockquote>}
                {r.name && <span className="text-[13px] font-semibold text-white/70">{r.name}</span>}
              </figcaption>
            </figure>
          ))}
        </Rail>
      </div>
    </section>
  );
}

/** Carrusel de publicaciones de Instagram: cada una abre su publicación (o el perfil) en Instagram. */
export function HomeInstagram({ posts, profileUrl }: { posts: IgPost[]; profileUrl: string }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="instagram" className="mx-auto max-w-[1440px] px-4 py-14 md:px-8 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="instagram" className="text-[clamp(26px,3.4vw,40px)] font-semibold">
          Síguenos en Instagram
        </h2>
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-[15px] underline underline-offset-4">
            Ver nuestro perfil
          </a>
        )}
      </div>
      <div className="mt-6">
        <Rail label="Publicaciones de Instagram">
          {posts.map((p, i) => {
            const href = p.href || profileUrl;
            const body = (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.caption.slice(0, 80)} loading="lazy" className="aspect-square w-full rounded-[16px] object-cover" />
                {p.caption && <span className="mt-3 line-clamp-3 block text-[14px] leading-snug">{p.caption}</span>}
              </>
            );
            const cls = "block w-[64vw] max-w-[300px] shrink-0 snap-start";
            return href ? (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                {body}
              </a>
            ) : (
              <div key={i} className={cls}>
                {body}
              </div>
            );
          })}
        </Rail>
      </div>
    </section>
  );
}
