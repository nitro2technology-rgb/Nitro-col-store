-- Reseñas de compradores verificados: llegan con el número de pedido y no exigen cuenta.
ALTER TABLE "reviews" ALTER COLUMN "profile_id" DROP NOT NULL;
ALTER TABLE "reviews" ADD COLUMN "order_id" UUID,
ADD COLUMN "author_name" TEXT,
ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX "reviews_product_id_order_id_key" ON "reviews"("product_id", "order_id");
CREATE INDEX "reviews_product_id_published_created_at_idx" ON "reviews"("product_id", "published", "created_at");

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
