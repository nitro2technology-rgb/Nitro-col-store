-- Orden de los colores dentro de cada producto.
ALTER TABLE "product_variants" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- JSON (no JSONB) conserva el orden de las claves de las especificaciones.
ALTER TABLE "products" ALTER COLUMN "specs" DROP DEFAULT;
ALTER TABLE "products" ALTER COLUMN "specs" TYPE JSON USING "specs"::json;
ALTER TABLE "products" ALTER COLUMN "specs" SET DEFAULT '{}';
