-- Costos (para calcular ganancia) y devoluciones.

-- 1. Costo por unidad: en inventory_items, que no tiene lectura pública (product_variants sí la tiene).
ALTER TABLE "inventory_items" ADD COLUMN "unit_cost_cents" INTEGER;

-- 2. Costo congelado en cada línea de pedido. El comprador puede leer sus order_items por la API de Supabase,
--    así que su permiso pasa a ser por columnas y no incluye el costo.
ALTER TABLE "order_items" ADD COLUMN "unit_cost_cents" INTEGER;
REVOKE SELECT ON "order_items" FROM anon, authenticated;
GRANT SELECT ("id", "order_id", "variant_id", "seller_id", "name", "sku", "unit_cents", "quantity", "total_cents") ON "order_items" TO authenticated;

-- 3. Devoluciones.
CREATE TYPE "ReturnStatus" AS ENUM ('requested', 'received', 'refunded', 'rejected');

CREATE TABLE "order_returns" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'requested',
    "kind" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "refund_cents" BIGINT NOT NULL DEFAULT 0,
    "restocked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "actor_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_returns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_returns_order_id_idx" ON "order_returns"("order_id");
CREATE INDEX "order_returns_status_created_at_idx" ON "order_returns"("status", "created_at");

ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Solo el servidor (Prisma) la usa: RLS activo y sin políticas = cerrada para la API pública.
ALTER TABLE "order_returns" ENABLE ROW LEVEL SECURITY;
