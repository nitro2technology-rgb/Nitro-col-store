-- Reseñas abiertas: sin número de pedido, con correo y hasta 3 fotos.
ALTER TABLE "reviews" ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "author_email" TEXT;
