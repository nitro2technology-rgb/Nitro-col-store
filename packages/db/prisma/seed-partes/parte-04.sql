BEGIN;
-- gafas-europe
INSERT INTO brands (id, name, slug, updated_at) VALUES (gen_random_uuid(), 'Nitro Col', 'nitro-col', now()) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, brand_id, seller_id, name, slug, tagline, description, status, featured_rank, theme, specs, tags, highlights, "inBox", faq, video_url, video_poster, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM brands WHERE slug = 'nitro-col'), (SELECT id FROM sellers WHERE slug = 'nitro-col'), 'Gafas Europe', 'gafas-europe', 'Modelo Europe.', 'Gafas de sol modelo Europe, disponibles en 3 colores.', 'published', NULL, 'light', '{"Modelo":"Europe","Colores":"Azules, Blancas, Negras"}'::jsonb, ARRAY['Casuales']::text[], '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, clock_timestamp(), now())
ON CONFLICT (slug) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, status = EXCLUDED.status, featured_rank = EXCLUDED.featured_rank, theme = EXCLUDED.theme, specs = EXCLUDED.specs, tags = EXCLUDED.tags, highlights = EXCLUDED.highlights, "inBox" = EXCLUDED."inBox", faq = EXCLUDED.faq, video_url = EXCLUDED.video_url, video_poster = EXCLUDED.video_poster, updated_at = now();
DELETE FROM product_categories WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-europe');
INSERT INTO product_categories (product_id, category_id) VALUES ((SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM categories WHERE slug = 'gafas'));
DELETE FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-europe');
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), 'GAF-EUR-01', 'Azules', '#3b6fb6', 4290000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-01'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-01');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-01'), '/products/gafas/europe/azules-1.webp', 'Gafas Europe Azules, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-01'), '/products/gafas/europe/azules-foto-1.webp', 'Gafas Europe Azules, con modelo 1', 'gallery', 1);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-01'), '/products/gafas/europe/azules-foto-2.webp', 'Gafas Europe Azules, con modelo 2', 'gallery', 2);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-01'), '/products/gafas/europe/azules-foto-3.webp', 'Gafas Europe Azules, con modelo 3', 'gallery', 3);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-01'), '/products/gafas/europe/azules-foto-4.webp', 'Gafas Europe Azules, con modelo 4', 'gallery', 4);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-01'), '/products/gafas/europe/azules-foto-5.webp', 'Gafas Europe Azules, con modelo 5', 'gallery', 5);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-01'), '/products/gafas/europe/azules-foto-6.webp', 'Gafas Europe Azules, con modelo 6', 'gallery', 6);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), 'GAF-EUR-02', 'Blancas', '#f3f4f6', 4290000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-02'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-02');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-02'), '/products/gafas/europe/blancas-1.webp', 'Gafas Europe Blancas, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-02'), '/products/gafas/europe/blancas-foto-1.webp', 'Gafas Europe Blancas, con modelo 1', 'gallery', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), 'GAF-EUR-03', 'Negras', '#111827', 4290000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-03'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-03');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-03'), '/products/gafas/europe/negras-1.webp', 'Gafas Europe Negras, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-03'), '/products/gafas/europe/negras-foto-1.webp', 'Gafas Europe Negras, con modelo 1', 'gallery', 1);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-03'), '/products/gafas/europe/negras-foto-2.webp', 'Gafas Europe Negras, con modelo 2', 'gallery', 2);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-03'), '/products/gafas/europe/negras-foto-3.webp', 'Gafas Europe Negras, con modelo 3', 'gallery', 3);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-03'), '/products/gafas/europe/negras-foto-4.webp', 'Gafas Europe Negras, con modelo 4', 'gallery', 4);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-03'), '/products/gafas/europe/negras-foto-5.webp', 'Gafas Europe Negras, con modelo 5', 'gallery', 5);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-europe'), (SELECT id FROM product_variants WHERE sku = 'GAF-EUR-03'), '/products/gafas/europe/negras-foto-6.webp', 'Gafas Europe Negras, con modelo 6', 'gallery', 6);

-- gafas-impact
INSERT INTO brands (id, name, slug, updated_at) VALUES (gen_random_uuid(), 'Nitro Col', 'nitro-col', now()) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, brand_id, seller_id, name, slug, tagline, description, status, featured_rank, theme, specs, tags, highlights, "inBox", faq, video_url, video_poster, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM brands WHERE slug = 'nitro-col'), (SELECT id FROM sellers WHERE slug = 'nitro-col'), 'Gafas Impact', 'gafas-impact', 'Modelo Impact.', 'Gafas de sol modelo Impact, disponibles en 4 colores.', 'published', NULL, 'light', '{"Modelo":"Impact","Colores":"Vino lente naranja, Negras lente espejo, Negras lente azul, Negras lente gris"}'::jsonb, ARRAY['Deportivas']::text[], '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, clock_timestamp(), now())
ON CONFLICT (slug) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, status = EXCLUDED.status, featured_rank = EXCLUDED.featured_rank, theme = EXCLUDED.theme, specs = EXCLUDED.specs, tags = EXCLUDED.tags, highlights = EXCLUDED.highlights, "inBox" = EXCLUDED."inBox", faq = EXCLUDED.faq, video_url = EXCLUDED.video_url, video_poster = EXCLUDED.video_poster, updated_at = now();
DELETE FROM product_categories WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-impact');
INSERT INTO product_categories (product_id, category_id) VALUES ((SELECT id FROM products WHERE slug = 'gafas-impact'), (SELECT id FROM categories WHERE slug = 'gafas'));
DELETE FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-impact');
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-impact'), 'GAF-IMP-01', 'Vino lente naranja', '#7f1d1d', 5490000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-01'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-01');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-impact'), (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-01'), '/products/gafas/impact/vino-lente-naranja-1.webp', 'Gafas Impact Vino lente naranja, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-impact'), (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-01'), '/products/gafas/impact/vino-lente-naranja-2.webp', 'Gafas Impact Vino lente naranja, foto 2', 'card', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-impact'), 'GAF-IMP-02', 'Negras lente espejo', '#111827', 5490000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-02'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-02');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-impact'), (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-02'), '/products/gafas/impact/negras-lente-espejo-1.webp', 'Gafas Impact Negras lente espejo, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-impact'), (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-02'), '/products/gafas/impact/negras-lente-espejo-2.webp', 'Gafas Impact Negras lente espejo, foto 2', 'card', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-impact'), 'GAF-IMP-03', 'Negras lente azul', '#111827', 5490000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-03'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-03');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-impact'), (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-03'), '/products/gafas/impact/negras-lente-azul-1.webp', 'Gafas Impact Negras lente azul, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-impact'), (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-03'), '/products/gafas/impact/negras-lente-azul-2.webp', 'Gafas Impact Negras lente azul, foto 2', 'card', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-impact'), 'GAF-IMP-04', 'Negras lente gris', '#111827', 5490000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-04'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-04');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-impact'), (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-04'), '/products/gafas/impact/negras-lente-gris-1.webp', 'Gafas Impact Negras lente gris, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-impact'), (SELECT id FROM product_variants WHERE sku = 'GAF-IMP-04'), '/products/gafas/impact/negras-lente-gris-2.webp', 'Gafas Impact Negras lente gris, foto 2', 'card', 1);

-- gafas-malibu
INSERT INTO brands (id, name, slug, updated_at) VALUES (gen_random_uuid(), 'Nitro Col', 'nitro-col', now()) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, brand_id, seller_id, name, slug, tagline, description, status, featured_rank, theme, specs, tags, highlights, "inBox", faq, video_url, video_poster, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM brands WHERE slug = 'nitro-col'), (SELECT id FROM sellers WHERE slug = 'nitro-col'), 'Gafas Malibu', 'gafas-malibu', 'Modelo Malibu.', 'Gafas de sol modelo Malibu, disponibles en 4 colores.', 'published', NULL, 'light', '{"Modelo":"Malibu","Colores":"Cafes, Cafes lente claro, Negras, Negras lente gris"}'::jsonb, ARRAY['Casuales']::text[], '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, clock_timestamp(), now())
ON CONFLICT (slug) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, status = EXCLUDED.status, featured_rank = EXCLUDED.featured_rank, theme = EXCLUDED.theme, specs = EXCLUDED.specs, tags = EXCLUDED.tags, highlights = EXCLUDED.highlights, "inBox" = EXCLUDED."inBox", faq = EXCLUDED.faq, video_url = EXCLUDED.video_url, video_poster = EXCLUDED.video_poster, updated_at = now();
DELETE FROM product_categories WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-malibu');
INSERT INTO product_categories (product_id, category_id) VALUES ((SELECT id FROM products WHERE slug = 'gafas-malibu'), (SELECT id FROM categories WHERE slug = 'gafas'));
DELETE FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-malibu');
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-malibu'), 'GAF-MAL-01', 'Cafes', '#6b4423', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-01'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-01');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-malibu'), (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-01'), '/products/gafas/malibu/cafes-1.webp', 'Gafas Malibu Cafes, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-malibu'), (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-01'), '/products/gafas/malibu/cafes-foto-1.webp', 'Gafas Malibu Cafes, con modelo 1', 'gallery', 1);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-malibu'), (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-01'), '/products/gafas/malibu/cafes-foto-2.webp', 'Gafas Malibu Cafes, con modelo 2', 'gallery', 2);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-malibu'), (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-01'), '/products/gafas/malibu/cafes-foto-3.webp', 'Gafas Malibu Cafes, con modelo 3', 'gallery', 3);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-malibu'), 'GAF-MAL-02', 'Cafes lente claro', '#6b4423', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-02'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-02');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-malibu'), (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-02'), '/products/gafas/malibu/cafes-lente-claro-1.webp', 'Gafas Malibu Cafes lente claro, foto 1', 'card', 0);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-malibu'), 'GAF-MAL-03', 'Negras', '#111827', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-03'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-03');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-malibu'), (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-03'), '/products/gafas/malibu/negras-1.webp', 'Gafas Malibu Negras, foto 1', 'card', 0);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-malibu'), 'GAF-MAL-04', 'Negras lente gris', '#111827', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-04'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-04');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-malibu'), (SELECT id FROM product_variants WHERE sku = 'GAF-MAL-04'), '/products/gafas/malibu/negras-lente-gris-1.webp', 'Gafas Malibu Negras lente gris, foto 1', 'card', 0);

COMMIT;
