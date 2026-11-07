import { BrandMark } from "@/components/brand-mark";
import { IgSlides } from "@/components/ig-slides";
import { Rail } from "@/components/rail";
import { isVideoUrl, type IgPost, type IgReview } from "@/lib/site-settings";

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
              {isVideoUrl(r.image) ? (
                <video src={`${r.image}#t=0.1`} controls playsInline preload="metadata" className="aspect-square w-full bg-black object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              )}
              <figcaption className="flex flex-1 flex-col justify-between gap-3 p-5">
                <p className="tracking-[0.2em] text-[#c9a24d]" role="img" aria-label="5 de 5 estrellas">
                  ★★★★★
                </p>
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

const icon = "size-[22px]";
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Usuario de Instagram a partir del enlace del perfil (https://www.instagram.com/usuario). */
const handleOf = (url: string) => /instagram\.com\/([A-Za-z0-9._]+)/.exec(url)?.[1] ?? "";

/**
 * Carrusel de publicaciones con el formato de una publicación de Instagram (modo oscuro): cabecera con el perfil,
 * foto, iconos, texto y fecha. Cada tarjeta abre su publicación (o el perfil) en Instagram.
 */
export function HomeInstagram({ posts, profileUrl }: { posts: IgPost[]; profileUrl: string }) {
  if (posts.length === 0) return null;
  const handle = handleOf(profileUrl);
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
            const card = (
              <>
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-black ring-1 ring-white/20">
                    <BrandMark className="h-4 w-7 text-white" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{handle || "Nitro Col"}</span>
                  <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="currentColor" aria-hidden="true">
                    <circle cx="5" cy="12" r="1.6" />
                    <circle cx="12" cy="12" r="1.6" />
                    <circle cx="19" cy="12" r="1.6" />
                  </svg>
                </div>
                <IgSlides images={p.images} alt={p.caption.slice(0, 80)} />
                <div className="flex items-center gap-4 px-3.5 pb-1 pt-3">
                  <svg viewBox="0 0 24 24" className={icon} {...stroke} aria-hidden="true">
                    <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.1 3.4 5 6.6 5c1.9 0 3.5 1 5.4 3 1.9-2 3.5-3 5.4-3 3.2 0 5.1 3.1 3.9 6.3-1.8 4.6-9.3 9.2-9.3 9.2Z" />
                  </svg>
                  <svg viewBox="0 0 24 24" className={icon} {...stroke} aria-hidden="true">
                    <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20.5l1.5-5.2A8.5 8.5 0 1 1 21 11.5Z" />
                  </svg>
                  <svg viewBox="0 0 24 24" className={icon} {...stroke} aria-hidden="true">
                    <path d="M22 3 2 10.5l7.5 3L12.5 21 22 3ZM9.5 13.5 22 3" />
                  </svg>
                  <svg viewBox="0 0 24 24" className={`${icon} ml-auto`} {...stroke} aria-hidden="true">
                    <path d="M6 3h12v18l-6-4.5L6 21V3Z" />
                  </svg>
                </div>
                <div className="px-3.5 pb-4 pt-1 text-[14px] leading-snug">
                  {p.caption && (
                    <p className="line-clamp-4 whitespace-pre-line">
                      <b>{handle || "Nitro Col"}</b> {p.caption}
                    </p>
                  )}
                  {p.date && <p className="mt-2 text-[12px] text-white/55">{p.date}</p>}
                </div>
              </>
            );
            const cls = "block w-[76vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-[16px] bg-[#0c1014] text-white ring-1 ring-white/10";
            return href ? (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer" data-theme="dark" className={cls}>
                {card}
              </a>
            ) : (
              <div key={i} data-theme="dark" className={cls}>
                {card}
              </div>
            );
          })}
        </Rail>
      </div>
    </section>
  );
}
