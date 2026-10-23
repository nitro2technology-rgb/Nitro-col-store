BEGIN;
-- smartwatch-x8-pro
INSERT INTO brands (id, name, slug, updated_at) VALUES (gen_random_uuid(), 'X8 Pro', 'x8-pro', now()) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, brand_id, seller_id, name, slug, tagline, description, status, featured_rank, theme, specs, tags, highlights, "inBox", faq, video_url, video_poster, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM brands WHERE slug = 'x8-pro'), (SELECT id FROM sellers WHERE slug = 'nitro-col'), 'Smartwatch X8 Pro 7+1', 'smartwatch-x8-pro', 'Un reloj, ocho correas.', 'Smartwatch con pantalla HD de 2,19", llamadas por Bluetooth, notificaciones y 7 correas más la del reloj.', 'published', 3, 'dark', '{"Pantalla":"2,19\" HD","Llamadas":"Bluetooth","Notificaciones":"Sí","Correas":"7 + 1"}'::jsonb, ARRAY[]::text[], '[{"title":"Llamadas desde la muñeca","body":"Contesta por Bluetooth sin sacar el celular."},{"title":"Siete correas extra","body":"Cambia de estilo cuando quieras."}]'::jsonb, '[]'::jsonb, '[]'::jsonb, '/products/smartwatch-x8-pro/video.mp4', '/products/smartwatch-x8-pro/principal-1.webp', clock_timestamp(), now())
ON CONFLICT (slug) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, status = EXCLUDED.status, featured_rank = EXCLUDED.featured_rank, theme = EXCLUDED.theme, specs = EXCLUDED.specs, tags = EXCLUDED.tags, highlights = EXCLUDED.highlights, "inBox" = EXCLUDED."inBox", faq = EXCLUDED.faq, video_url = EXCLUDED.video_url, video_poster = EXCLUDED.video_poster, updated_at = now();
DELETE FROM product_categories WHERE product_id = (SELECT id FROM products WHERE slug = 'smartwatch-x8-pro');
INSERT INTO product_categories (product_id, category_id) VALUES ((SELECT id FROM products WHERE slug = 'smartwatch-x8-pro'), (SELECT id FROM categories WHERE slug = 'smartwatch'));
DELETE FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'smartwatch-x8-pro');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'smartwatch-x8-pro'), NULL, '/products/smartwatch-x8-pro/1.avif', 'Smartwatch X8 Pro, foto 1', 'gallery', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'smartwatch-x8-pro'), NULL, '/products/smartwatch-x8-pro/2.avif', 'Smartwatch X8 Pro, foto 2', 'gallery', 1);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'smartwatch-x8-pro'), NULL, '/products/smartwatch-x8-pro/3.avif', 'Smartwatch X8 Pro, foto 3', 'gallery', 2);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'smartwatch-x8-pro'), NULL, '/products/smartwatch-x8-pro/4.avif', 'Smartwatch X8 Pro, foto 4', 'gallery', 3);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'smartwatch-x8-pro'), 'SW-X8PRO', 'Único', NULL, 9500000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'SW-X8PRO'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'SW-X8PRO');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'smartwatch-x8-pro'), (SELECT id FROM product_variants WHERE sku = 'SW-X8PRO'), '/products/smartwatch-x8-pro/principal-1.webp', 'Smartwatch X8 Pro, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'smartwatch-x8-pro'), (SELECT id FROM product_variants WHERE sku = 'SW-X8PRO'), '/products/smartwatch-x8-pro/principal-2.webp', 'Smartwatch X8 Pro, foto 2', 'card', 1);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'smartwatch-x8-pro'), (SELECT id FROM product_variants WHERE sku = 'SW-X8PRO'), '/products/smartwatch-x8-pro/principal-3.webp', 'Smartwatch X8 Pro, foto 3', 'card', 2);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'smartwatch-x8-pro'), (SELECT id FROM product_variants WHERE sku = 'SW-X8PRO'), '/products/smartwatch-x8-pro/principal-4.webp', 'Smartwatch X8 Pro, foto 4', 'card', 3);

-- gafas-barcelona
INSERT INTO brands (id, name, slug, updated_at) VALUES (gen_random_uuid(), 'Nitro Col', 'nitro-col', now()) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, brand_id, seller_id, name, slug, tagline, description, status, featured_rank, theme, specs, tags, highlights, "inBox", faq, video_url, video_poster, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM brands WHERE slug = 'nitro-col'), (SELECT id FROM sellers WHERE slug = 'nitro-col'), 'Gafas Barcelona', 'gafas-barcelona', 'Modelo Barcelona.', 'Gafas de sol modelo Barcelona, disponibles en 4 colores.', 'published', NULL, 'light', '{"Modelo":"Barcelona","Colores":"Animal print, Beige, Blancas, Negras"}'::jsonb, ARRAY['Casuales']::text[], '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, clock_timestamp(), now())
ON CONFLICT (slug) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, status = EXCLUDED.status, featured_rank = EXCLUDED.featured_rank, theme = EXCLUDED.theme, specs = EXCLUDED.specs, tags = EXCLUDED.tags, highlights = EXCLUDED.highlights, "inBox" = EXCLUDED."inBox", faq = EXCLUDED.faq, video_url = EXCLUDED.video_url, video_poster = EXCLUDED.video_poster, updated_at = now();
DELETE FROM product_categories WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-barcelona');
INSERT INTO product_categories (product_id, category_id) VALUES ((SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM categories WHERE slug = 'gafas'));
DELETE FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-barcelona');
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), 'GAF-BAR-01', 'Animal print', '#a0652d', 4990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-01'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-01');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-01'), '/products/gafas/barcelona/animal-print-1.webp', 'Gafas Barcelona Animal print, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-01'), '/products/gafas/barcelona/animal-print-foto-1.webp', 'Gafas Barcelona Animal print, con modelo 1', 'gallery', 1);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-01'), '/products/gafas/barcelona/animal-print-foto-2.webp', 'Gafas Barcelona Animal print, con modelo 2', 'gallery', 2);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), 'GAF-BAR-02', 'Beige', '#d9c7a8', 4990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-02'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-02');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-02'), '/products/gafas/barcelona/beige-1.webp', 'Gafas Barcelona Beige, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-02'), '/products/gafas/barcelona/beige-foto-1.webp', 'Gafas Barcelona Beige, con modelo 1', 'gallery', 1);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-02'), '/products/gafas/barcelona/beige-foto-2.webp', 'Gafas Barcelona Beige, con modelo 2', 'gallery', 2);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-02'), '/products/gafas/barcelona/beige-foto-3.webp', 'Gafas Barcelona Beige, con modelo 3', 'gallery', 3);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-02'), '/products/gafas/barcelona/beige-foto-4.webp', 'Gafas Barcelona Beige, con modelo 4', 'gallery', 4);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-02'), '/products/gafas/barcelona/beige-foto-5.webp', 'Gafas Barcelona Beige, con modelo 5', 'gallery', 5);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), 'GAF-BAR-03', 'Blancas', '#f3f4f6', 4990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-03'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-03');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-03'), '/products/gafas/barcelona/blancas-1.webp', 'Gafas Barcelona Blancas, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-03'), '/products/gafas/barcelona/blancas-foto-1.webp', 'Gafas Barcelona Blancas, con modelo 1', 'gallery', 1);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-03'), '/products/gafas/barcelona/blancas-foto-2.webp', 'Gafas Barcelona Blancas, con modelo 2', 'gallery', 2);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-03'), '/products/gafas/barcelona/blancas-foto-3.webp', 'Gafas Barcelona Blancas, con modelo 3', 'gallery', 3);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-03'), '/products/gafas/barcelona/blancas-foto-4.webp', 'Gafas Barcelona Blancas, con modelo 4', 'gallery', 4);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), 'GAF-BAR-04', 'Negras', '#111827', 4990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-04'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-04');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-barcelona'), (SELECT id FROM product_variants WHERE sku = 'GAF-BAR-04'), '/products/gafas/barcelona/negras-1.webp', 'Gafas Barcelona Negras, foto 1', 'card', 0);

-- gafas-berlin
INSERT INTO brands (id, name, slug, updated_at) VALUES (gen_random_uuid(), 'Nitro Col', 'nitro-col', now()) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, brand_id, seller_id, name, slug, tagline, description, status, featured_rank, theme, specs, tags, highlights, "inBox", faq, video_url, video_poster, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM brands WHERE slug = 'nitro-col'), (SELECT id FROM sellers WHERE slug = 'nitro-col'), 'Gafas Berlin', 'gafas-berlin', 'Modelo Berlin.', 'Gafas de sol modelo Berlin, disponibles en 5 colores.', 'published', NULL, 'light', '{"Modelo":"Berlin","Colores":"Amarillas, Lente verde, Negras, Rojas, Rosada"}'::jsonb, ARRAY['Casuales']::text[], '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, clock_timestamp(), now())
ON CONFLICT (slug) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, status = EXCLUDED.status, featured_rank = EXCLUDED.featured_rank, theme = EXCLUDED.theme, specs = EXCLUDED.specs, tags = EXCLUDED.tags, highlights = EXCLUDED.highlights, "inBox" = EXCLUDED."inBox", faq = EXCLUDED.faq, video_url = EXCLUDED.video_url, video_poster = EXCLUDED.video_poster, updated_at = now();
DELETE FROM product_categories WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-berlin');
INSERT INTO product_categories (product_id, category_id) VALUES ((SELECT id FROM products WHERE slug = 'gafas-berlin'), (SELECT id FROM categories WHERE slug = 'gafas'));
DELETE FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-berlin');
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-berlin'), 'GAF-BER-01', 'Amarillas', '#f5d34a', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-BER-01'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-BER-01');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-berlin'), (SELECT id FROM product_variants WHERE sku = 'GAF-BER-01'), '/products/gafas/berlin/amarillas-1.webp', 'Gafas Berlin Amarillas, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-berlin'), (SELECT id FROM product_variants WHERE sku = 'GAF-BER-01'), '/products/gafas/berlin/amarillas-foto-1.webp', 'Gafas Berlin Amarillas, con modelo 1', 'gallery', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-berlin'), 'GAF-BER-02', 'Lente verde', '#4ade80', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-BER-02'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-BER-02');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-berlin'), (SELECT id FROM product_variants WHERE sku = 'GAF-BER-02'), '/products/gafas/berlin/lente-verde-1.webp', 'Gafas Berlin Lente verde, foto 1', 'card', 0);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-berlin'), 'GAF-BER-03', 'Negras', '#111827', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-BER-03'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-BER-03');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-berlin'), (SELECT id FROM product_variants WHERE sku = 'GAF-BER-03'), '/products/gafas/berlin/negras-1.webp', 'Gafas Berlin Negras, foto 1', 'card', 0);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-berlin'), 'GAF-BER-04', 'Rojas', '#c0392b', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-BER-04'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-BER-04');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-berlin'), (SELECT id FROM product_variants WHERE sku = 'GAF-BER-04'), '/products/gafas/berlin/rojas-1.webp', 'Gafas Berlin Rojas, foto 1', 'card', 0);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-berlin'), 'GAF-BER-05', 'Rosada', '#f2b4c6', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-BER-05'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-BER-05');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-berlin'), (SELECT id FROM product_variants WHERE sku = 'GAF-BER-05'), '/products/gafas/berlin/rosada-1.webp', 'Gafas Berlin Rosada, foto 1', 'card', 0);

COMMIT;
