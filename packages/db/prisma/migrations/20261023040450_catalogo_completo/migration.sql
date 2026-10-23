-- AlterTable
ALTER TABLE "product_images" ADD COLUMN     "variant_id" UUID;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "swatch" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "faq" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "highlights" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "inBox" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "video_poster" TEXT,
ADD COLUMN     "video_url" TEXT;

-- CreateIndex
CREATE INDEX "product_images_variant_id_idx" ON "product_images"("variant_id");

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
