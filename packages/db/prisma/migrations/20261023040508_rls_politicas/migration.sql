-- Seguridad por filas (RLS). Prisma se conecta como dueño de la base y la ignora;
-- estas reglas solo gobiernan a la API pública de Supabase (anon / authenticated).
-- Escrituras de pedidos, pagos e inventario: siempre desde el servidor, nunca desde el navegador.

-- 0. Solo para la base sombra de Prisma (fuera de Supabase): crea lo mínimo que las políticas necesitan.
-- En Supabase el esquema auth y estos roles ya existen y este bloque no hace nada.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';
  END IF;
END $$;

-- 1. RLS activo en todas las tablas de public.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

-- 2. Catálogo público de solo lectura.
GRANT SELECT ON categories, brands, products, product_variants, product_images TO anon, authenticated;

CREATE POLICY categories_public_read ON categories FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL);

CREATE POLICY brands_public_read ON brands FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY products_public_read ON products FOR SELECT TO anon, authenticated
  USING (status = 'published' AND deleted_at IS NULL);

CREATE POLICY variants_public_read ON product_variants FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL AND EXISTS (
    SELECT 1 FROM products p WHERE p.id = product_id AND p.status = 'published' AND p.deleted_at IS NULL));

CREATE POLICY images_public_read ON product_images FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM products p WHERE p.id = product_id AND p.status = 'published' AND p.deleted_at IS NULL));

-- 3. El cliente solo ve lo suyo.
GRANT SELECT ON profiles, addresses, orders, order_items TO authenticated;
GRANT UPDATE (full_name, phone, document_id) ON profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON addresses TO authenticated;

CREATE POLICY profiles_own_read ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY profiles_own_update ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY addresses_own_all ON addresses FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

CREATE POLICY orders_own_read ON orders FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY order_items_own_read ON order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.profile_id = auth.uid()));
