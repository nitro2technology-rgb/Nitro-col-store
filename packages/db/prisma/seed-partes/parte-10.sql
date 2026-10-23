BEGIN;
-- gafas-x-treme
INSERT INTO brands (id, name, slug, updated_at) VALUES (gen_random_uuid(), 'Nitro Col', 'nitro-col', now()) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, brand_id, seller_id, name, slug, tagline, description, status, featured_rank, theme, specs, tags, highlights, "inBox", faq, video_url, video_poster, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM brands WHERE slug = 'nitro-col'), (SELECT id FROM sellers WHERE slug = 'nitro-col'), 'Gafas X-treme', 'gafas-x-treme', 'Modelo X-treme.', 'Gafas de sol modelo X-treme, disponibles en 5 colores.', 'published', NULL, 'light', '{"Modelo":"X-treme","Colores":"Negras lente gris, Verde neón, Rojas, Blancas, Negras lente azul"}'::jsonb, ARRAY['Deportivas']::text[], '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, clock_timestamp(), now())
ON CONFLICT (slug) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, status = EXCLUDED.status, featured_rank = EXCLUDED.featured_rank, theme = EXCLUDED.theme, specs = EXCLUDED.specs, tags = EXCLUDED.tags, highlights = EXCLUDED.highlights, "inBox" = EXCLUDED."inBox", faq = EXCLUDED.faq, video_url = EXCLUDED.video_url, video_poster = EXCLUDED.video_poster, updated_at = now();
DELETE FROM product_categories WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-x-treme');
INSERT INTO product_categories (product_id, category_id) VALUES ((SELECT id FROM products WHERE slug = 'gafas-x-treme'), (SELECT id FROM categories WHERE slug = 'gafas'));
DELETE FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-x-treme');
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), 'GAF-XTR-01', 'Negras lente gris', '#111827', 5490000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-01'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-01');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-01'), '/products/gafas/x-treme/negras-lente-gris-1.webp', 'Gafas X-treme Negras lente gris, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-01'), '/products/gafas/x-treme/negras-lente-gris-2.webp', 'Gafas X-treme Negras lente gris, foto 2', 'card', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), 'GAF-XTR-02', 'Verde neón', '#a3e635', 5490000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-02'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-02');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-02'), '/products/gafas/x-treme/verde-neon-1.webp', 'Gafas X-treme Verde neón, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-02'), '/products/gafas/x-treme/verde-neon-2.webp', 'Gafas X-treme Verde neón, foto 2', 'card', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), 'GAF-XTR-03', 'Rojas', '#c0392b', 5490000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-03'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-03');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-03'), '/products/gafas/x-treme/rojas-1.webp', 'Gafas X-treme Rojas, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-03'), '/products/gafas/x-treme/rojas-2.webp', 'Gafas X-treme Rojas, foto 2', 'card', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), 'GAF-XTR-04', 'Blancas', '#f3f4f6', 5490000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-04'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-04');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-04'), '/products/gafas/x-treme/blancas-1.webp', 'Gafas X-treme Blancas, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-04'), '/products/gafas/x-treme/blancas-2.webp', 'Gafas X-treme Blancas, foto 2', 'card', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), 'GAF-XTR-05', 'Negras lente azul', '#111827', 5490000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-05'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-05');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-05'), '/products/gafas/x-treme/negras-lente-azul-1.webp', 'Gafas X-treme Negras lente azul, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-x-treme'), (SELECT id FROM product_variants WHERE sku = 'GAF-XTR-05'), '/products/gafas/x-treme/negras-lente-azul-2.webp', 'Gafas X-treme Negras lente azul, foto 2', 'card', 1);

COMMIT;
