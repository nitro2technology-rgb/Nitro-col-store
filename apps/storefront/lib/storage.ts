// Fotos de productos en Supabase Storage (bucket público "productos"). Solo el servidor, después de requireAdmin().
// Usa la llave de servicio (SUPABASE_SERVICE_ROLE_KEY, SECRETA: nunca con NEXT_PUBLIC_ ni en el navegador).
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

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

let bucketReady = false;
async function ensureBucket(c: ReturnType<typeof client>) {
  if (bucketReady) return;
  const { error } = await c.storage.createBucket(BUCKET, { public: true, fileSizeLimit: "5MB", allowedMimeTypes: ["image/webp"] });
  if (error && !/already exists|duplicate/i.test(error.message)) throw new Error(error.message);
  bucketReady = true;
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
