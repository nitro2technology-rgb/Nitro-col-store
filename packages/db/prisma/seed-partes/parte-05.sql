BEGIN;
-- gafas-miami
INSERT INTO brands (id, name, slug, updated_at) VALUES (gen_random_uuid(), 'Nitro Col', 'nitro-col', now()) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, brand_id, seller_id, name, slug, tagline, description, status, featured_rank, theme, specs, tags, highlights, "inBox", faq, video_url, video_poster, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM brands WHERE slug = 'nitro-col'), (SELECT id FROM sellers WHERE slug = 'nitro-col'), 'Gafas Miami', 'gafas-miami', 'Modelo Miami.', 'Gafas de sol modelo Miami, disponibles en 6 colores.', 'published', NULL, 'light', '{"Modelo":"Miami","Colores":"Animal print, Blancas, Cafes claras, Cebra, Negras, Rosadas"}'::jsonb, ARRAY['Casuales']::text[], '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, clock_timestamp(), now())
ON CONFLICT (slug) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, status = EXCLUDED.status, featured_rank = EXCLUDED.featured_rank, theme = EXCLUDED.theme, specs = EXCLUDED.specs, tags = EXCLUDED.tags, highlights = EXCLUDED.highlights, "inBox" = EXCLUDED."inBox", faq = EXCLUDED.faq, video_url = EXCLUDED.video_url, video_poster = EXCLUDED.video_poster, updated_at = now();
DELETE FROM product_categories WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-miami');
INSERT INTO product_categories (product_id, category_id) VALUES ((SELECT id FROM products WHERE slug = 'gafas-miami'), (SELECT id FROM categories WHERE slug = 'gafas'));
DELETE FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-miami');
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), 'GAF-MIA-01', 'Animal print', '#a0652d', 4290000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-01'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-01');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-01'), '/products/gafas/miami/animal-print-1.webp', 'Gafas Miami Animal print, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-01'), '/products/gafas/miami/animal-print-foto-1.webp', 'Gafas Miami Animal print, con modelo 1', 'gallery', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), 'GAF-MIA-02', 'Blancas', '#f3f4f6', 4290000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-02'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-02');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-02'), '/products/gafas/miami/blancas-1.webp', 'Gafas Miami Blancas, foto 1', 'card', 0);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), 'GAF-MIA-03', 'Cafes claras', '#6b4423', 4290000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-03'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-03');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-03'), '/products/gafas/miami/cafes-claras-1.webp', 'Gafas Miami Cafes claras, foto 1', 'card', 0);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), 'GAF-MIA-04', 'Cebra', '#e5e7eb', 4290000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-04'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-04');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-04'), '/products/gafas/miami/cebra-1.webp', 'Gafas Miami Cebra, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-04'), '/products/gafas/miami/cebra-foto-1.webp', 'Gafas Miami Cebra, con modelo 1', 'gallery', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), 'GAF-MIA-05', 'Negras', '#111827', 4290000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-05'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-05');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-05'), '/products/gafas/miami/negras-1.webp', 'Gafas Miami Negras, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-05'), '/products/gafas/miami/negras-foto-1.webp', 'Gafas Miami Negras, con modelo 1', 'gallery', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), 'GAF-MIA-06', 'Rosadas', '#f2b4c6', 4290000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-06'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-06');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-06'), '/products/gafas/miami/rosadas-1.webp', 'Gafas Miami Rosadas, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-06'), '/products/gafas/miami/rosadas-foto-1.webp', 'Gafas Miami Rosadas, con modelo 1', 'gallery', 1);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-06'), '/products/gafas/miami/rosadas-foto-2.webp', 'Gafas Miami Rosadas, con modelo 2', 'gallery', 2);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-miami'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIA-06'), '/products/gafas/miami/rosadas-foto-3.webp', 'Gafas Miami Rosadas, con modelo 3', 'gallery', 3);

-- gafas-milan
INSERT INTO brands (id, name, slug, updated_at) VALUES (gen_random_uuid(), 'Nitro Col', 'nitro-col', now()) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, brand_id, seller_id, name, slug, tagline, description, status, featured_rank, theme, specs, tags, highlights, "inBox", faq, video_url, video_poster, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM brands WHERE slug = 'nitro-col'), (SELECT id FROM sellers WHERE slug = 'nitro-col'), 'Gafas Milan', 'gafas-milan', 'Modelo Milan.', 'Gafas de sol modelo Milan, disponibles en 3 colores.', 'published', NULL, 'light', '{"Modelo":"Milan","Colores":"Negras, Negras con lente cafe, Negras dorado"}'::jsonb, ARRAY['Casuales']::text[], '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, clock_timestamp(), now())
ON CONFLICT (slug) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, status = EXCLUDED.status, featured_rank = EXCLUDED.featured_rank, theme = EXCLUDED.theme, specs = EXCLUDED.specs, tags = EXCLUDED.tags, highlights = EXCLUDED.highlights, "inBox" = EXCLUDED."inBox", faq = EXCLUDED.faq, video_url = EXCLUDED.video_url, video_poster = EXCLUDED.video_poster, updated_at = now();
DELETE FROM product_categories WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-milan');
INSERT INTO product_categories (product_id, category_id) VALUES ((SELECT id FROM products WHERE slug = 'gafas-milan'), (SELECT id FROM categories WHERE slug = 'gafas'));
DELETE FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-milan');
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-milan'), 'GAF-MIL-01', 'Negras', '#111827', 4490000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MIL-01'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MIL-01');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-milan'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIL-01'), '/products/gafas/milan/negras-1.webp', 'Gafas Milan Negras, foto 1', 'card', 0);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-milan'), 'GAF-MIL-02', 'Negras con lente cafe', '#111827', 4490000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MIL-02'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MIL-02');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-milan'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIL-02'), '/products/gafas/milan/negras-con-lente-cafe-1.webp', 'Gafas Milan Negras con lente cafe, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-milan'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIL-02'), '/products/gafas/milan/negras-con-lente-cafe-foto-1.webp', 'Gafas Milan Negras con lente cafe, con modelo 1', 'gallery', 1);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-milan'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIL-02'), '/products/gafas/milan/negras-con-lente-cafe-foto-2.webp', 'Gafas Milan Negras con lente cafe, con modelo 2', 'gallery', 2);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-milan'), 'GAF-MIL-03', 'Negras dorado', '#111827', 4490000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MIL-03'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MIL-03');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-milan'), (SELECT id FROM product_variants WHERE sku = 'GAF-MIL-03'), '/products/gafas/milan/negras-dorado-1.webp', 'Gafas Milan Negras dorado, foto 1', 'card', 0);

COMMIT;
