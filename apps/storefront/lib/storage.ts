// Fotos de productos en Supabase Storage (bucket público "productos"). Solo el servidor, después de requireAdmin().
// Usa la llave de servicio (SUPABASE_SERVICE_ROLE_KEY, SECRETA: nunca con NEXT_PUBLIC_ ni en el navegador).
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { COVERS, type Cover, type CoverMedia } from "./covers";

export const BUCKET = "productos";
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
const SIZES = [
  { suffix: "", width: 1600, quality: 86 },
  { suffix: "-960", width: 960, quality: 82 },
  { suffix: "-480", width: 480, quality: 80 },
] as const;

export const storageConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

function client() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const ready = new Set<string>();
async function ensureBucket(c: ReturnType<typeof client>, name: string = BUCKET) {
  if (ready.has(name)) return;
  const { error } =
    name === BUCKET
      ? await c.storage.createBucket(name, { public: true, fileSizeLimit: "5MB", allowedMimeTypes: ["image/webp"] })
      : await c.storage.createBucket(name, { public: true, fileSizeLimit: "50MB" });
  if (error && !/already exists|duplicate/i.test(error.message)) throw new Error(error.message);
  ready.add(name);
}

/** Convierte la foto a WebP en tres tamaños, la sube y devuelve la dirección pública de la grande. */
export async function uploadPhoto(input: Buffer, folder: string) {
  const c = client();
  await ensureBucket(c);
  const id = crypto.randomUUID();
  // rotate() aplica la orientación EXIF del celular; los metadatos no se copian.
  const base = sharp(input, { failOn: "none", limitInputPixels: 60_000_000 }).rotate();
  for (const s of SIZES) {
    const out = await base.clone().resize({ width: s.width, withoutEnlargement: true }).webp({ quality: s.quality }).toBuffer();
    const { error } = await c.storage.from(BUCKET).upload(`${folder}/${id}${s.suffix}.webp`, out, {
      contentType: "image/webp",
      cacheControl: "31536000",
    });
    if (error) throw new Error(error.message);
  }
  return c.storage.from(BUCKET).getPublicUrl(`${folder}/${id}.webp`).data.publicUrl;
}

/** Borra los tres tamaños si la dirección es de nuestro bucket; las fotos del código (/products/…) no se tocan. */
export async function deletePhoto(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i < 0 || !storageConfigured()) return;
  const path = url.slice(i + marker.length);
  if (!path.endsWith(".webp")) return;
  const stem = path.slice(0, -".webp".length);
  await client().storage.from(BUCKET).remove(SIZES.map((s) => `${stem}${s.suffix}.webp`));
}

// ───────────── Portadas de categoría (bucket "portadas": fotos y un JSON con los textos por categoría) ─────────────

export const COVER_MAX_BYTES = 20 * 1024 * 1024;
const VIDEO_TYPES: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm" };

/**
 * Sube el medio de una portada y devuelve su dirección pública y su tipo. Las fotos (JPG, PNG, WebP) se convierten a
 * WebP ancho; los GIF y los videos (MP4, WebM) se suben tal cual para no perder la animación.
 */
export async function uploadCoverMedia(file: File, slug: string, width: number): Promise<CoverMedia> {
  const c = client();
  await ensureBucket(c, COVERS);
  const input = Buffer.from(await file.arrayBuffer());
  let body: Buffer = input;
  let ext: string;
  let contentType = file.type;
  let type: CoverMedia["type"] = "image";
  if (VIDEO_TYPES[file.type]) {
    ext = VIDEO_TYPES[file.type]!;
    type = "video";
  } else if (file.type === "image/gif") {
    ext = "gif";
  } else if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    body = await sharp(input, { failOn: "none", limitInputPixels: 80_000_000 }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    ext = "webp";
    contentType = "image/webp";
  } else {
    throw new Error("Formato no permitido");
  }
  const path = `${slug}-${crypto.randomUUID()}.${ext}`;
  const { error } = await c.storage.from(COVERS).upload(path, body, { contentType, cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return { url: c.storage.from(COVERS).getPublicUrl(path).data.publicUrl, type };
}

export async function saveCover(slug: string, cover: Cover) {
  const c = client();
  await ensureBucket(c, COVERS);
  const { error } = await c.storage.from(COVERS).upload(`${slug}.json`, JSON.stringify(cover), {
    contentType: "application/json",
    cacheControl: "30",
    upsert: true,
  });
  if (error) throw new Error(error.message);
}

export async function removeCoverFiles(slug: string, urls: (string | undefined)[], withJson: boolean) {
  const marker = `/storage/v1/object/public/${COVERS}/`;
  const names = urls.flatMap((u) => (u && u.includes(marker) ? [u.slice(u.indexOf(marker) + marker.length)] : []));
  if (withJson) names.push(`${slug}.json`);
  if (names.length > 0) await client().storage.from(COVERS).remove(names);
}

// ───────────── Ajustes de la página de inicio (bucket "portadas": ajustes.json + fotos de Instagram) ─────────────

/** Sube una foto (JPG, PNG o WebP) como WebP de hasta 1200 px de ancho y devuelve su dirección pública. */
export async function uploadSiteImage(file: File, prefix: string): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Formato no permitido");
  const c = client();
  await ensureBucket(c, COVERS);
  const body = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "none", limitInputPixels: 60_000_000 })
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const path = `${prefix}-${crypto.randomUUID()}.webp`;
  const { error } = await c.storage.from(COVERS).upload(path, body, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return c.storage.from(COVERS).getPublicUrl(path).data.publicUrl;
}

export const SITE_VIDEO_MAX_BYTES = 30 * 1024 * 1024;

/** Sube una foto (se convierte a WebP) o un video MP4/WebM (tal cual) para las publicaciones de Instagram. */
export async function uploadSiteMedia(file: File, prefix: string): Promise<string> {
  const ext = file.type === "video/mp4" ? "mp4" : file.type === "video/webm" ? "webm" : null;
  if (!ext) return uploadSiteImage(file, prefix);
  const c = client();
  await ensureBucket(c, COVERS);
  const path = `${prefix}-${crypto.randomUUID()}.${ext}`;
  const { error } = await c.storage.from(COVERS).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return c.storage.from(COVERS).getPublicUrl(path).data.publicUrl;
}

export async function saveSettingsFile(settings: unknown) {
  const c = client();
  await ensureBucket(c, COVERS);
  const { error } = await c.storage.from(COVERS).upload("ajustes.json", JSON.stringify(settings), {
    contentType: "application/json",
    cacheControl: "30",
    upsert: true,
  });
  if (error) throw new Error(error.message);
}
