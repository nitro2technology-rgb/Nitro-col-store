BEGIN;
-- gafas-moon
INSERT INTO brands (id, name, slug, updated_at) VALUES (gen_random_uuid(), 'Nitro Col', 'nitro-col', now()) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, brand_id, seller_id, name, slug, tagline, description, status, featured_rank, theme, specs, tags, highlights, "inBox", faq, video_url, video_poster, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM brands WHERE slug = 'nitro-col'), (SELECT id FROM sellers WHERE slug = 'nitro-col'), 'Gafas Moon', 'gafas-moon', 'Modelo Moon.', 'Gafas de sol modelo Moon, disponibles en 4 colores.', 'published', NULL, 'light', '{"Modelo":"Moon","Colores":"Blancas lente azul, Negras, Negras lente amarillo, Negras lente gris"}'::jsonb, ARRAY['Casuales']::text[], '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, clock_timestamp(), now())
ON CONFLICT (slug) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, status = EXCLUDED.status, featured_rank = EXCLUDED.featured_rank, theme = EXCLUDED.theme, specs = EXCLUDED.specs, tags = EXCLUDED.tags, highlights = EXCLUDED.highlights, "inBox" = EXCLUDED."inBox", faq = EXCLUDED.faq, video_url = EXCLUDED.video_url, video_poster = EXCLUDED.video_poster, updated_at = now();
DELETE FROM product_categories WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-moon');
INSERT INTO product_categories (product_id, category_id) VALUES ((SELECT id FROM products WHERE slug = 'gafas-moon'), (SELECT id FROM categories WHERE slug = 'gafas'));
DELETE FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-moon');
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), 'GAF-MOO-01', 'Blancas lente azul', '#f3f4f6', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-01'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-01');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-01'), '/products/gafas/moon/blancas-lente-azul-1.webp', 'Gafas Moon Blancas lente azul, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-01'), '/products/gafas/moon/blancas-lente-azul-foto-1.webp', 'Gafas Moon Blancas lente azul, con modelo 1', 'gallery', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), 'GAF-MOO-02', 'Negras', '#111827', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-02'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-02');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-02'), '/products/gafas/moon/negras-1.webp', 'Gafas Moon Negras, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-02'), '/products/gafas/moon/negras-foto-1.webp', 'Gafas Moon Negras, con modelo 1', 'gallery', 1);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-02'), '/products/gafas/moon/negras-foto-2.webp', 'Gafas Moon Negras, con modelo 2', 'gallery', 2);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-02'), '/products/gafas/moon/negras-foto-3.webp', 'Gafas Moon Negras, con modelo 3', 'gallery', 3);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-02'), '/products/gafas/moon/negras-foto-4.webp', 'Gafas Moon Negras, con modelo 4', 'gallery', 4);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), 'GAF-MOO-03', 'Negras lente amarillo', '#111827', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-03'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-03');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-03'), '/products/gafas/moon/negras-lente-amarillo-1.webp', 'Gafas Moon Negras lente amarillo, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-03'), '/products/gafas/moon/negras-lente-amarillo-foto-1.webp', 'Gafas Moon Negras lente amarillo, con modelo 1', 'gallery', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), 'GAF-MOO-04', 'Negras lente gris', '#111827', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-04'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-04');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-04'), '/products/gafas/moon/negras-lente-gris-1.webp', 'Gafas Moon Negras lente gris, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-04'), '/products/gafas/moon/negras-lente-gris-foto-1.webp', 'Gafas Moon Negras lente gris, con modelo 1', 'gallery', 1);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-04'), '/products/gafas/moon/negras-lente-gris-foto-2.webp', 'Gafas Moon Negras lente gris, con modelo 2', 'gallery', 2);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-moon'), (SELECT id FROM product_variants WHERE sku = 'GAF-MOO-04'), '/products/gafas/moon/negras-lente-gris-foto-3.webp', 'Gafas Moon Negras lente gris, con modelo 3', 'gallery', 3);

-- gafas-office
INSERT INTO brands (id, name, slug, updated_at) VALUES (gen_random_uuid(), 'Nitro Col', 'nitro-col', now()) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, brand_id, seller_id, name, slug, tagline, description, status, featured_rank, theme, specs, tags, highlights, "inBox", faq, video_url, video_poster, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM brands WHERE slug = 'nitro-col'), (SELECT id FROM sellers WHERE slug = 'nitro-col'), 'Gafas Office', 'gafas-office', 'Modelo Office.', 'Gafas de sol modelo Office, disponibles en 5 colores.', 'published', NULL, 'light', '{"Modelo":"Office","Colores":"Animal print, Cafes lente verde, Ghost, Negras, Negras lente amarillo"}'::jsonb, ARRAY['Casuales']::text[], '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, NULL, clock_timestamp(), now())
ON CONFLICT (slug) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description, status = EXCLUDED.status, featured_rank = EXCLUDED.featured_rank, theme = EXCLUDED.theme, specs = EXCLUDED.specs, tags = EXCLUDED.tags, highlights = EXCLUDED.highlights, "inBox" = EXCLUDED."inBox", faq = EXCLUDED.faq, video_url = EXCLUDED.video_url, video_poster = EXCLUDED.video_poster, updated_at = now();
DELETE FROM product_categories WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-office');
INSERT INTO product_categories (product_id, category_id) VALUES ((SELECT id FROM products WHERE slug = 'gafas-office'), (SELECT id FROM categories WHERE slug = 'gafas'));
DELETE FROM product_images WHERE product_id = (SELECT id FROM products WHERE slug = 'gafas-office');
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-office'), 'GAF-OFF-01', 'Animal print', '#a0652d', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-01'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-01');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-office'), (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-01'), '/products/gafas/office/animal-print-1.webp', 'Gafas Office Animal print, foto 1', 'card', 0);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-office'), 'GAF-OFF-02', 'Cafes lente verde', '#6b4423', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-02'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-02');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-office'), (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-02'), '/products/gafas/office/cafes-lente-verde-1.webp', 'Gafas Office Cafes lente verde, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-office'), (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-02'), '/products/gafas/office/cafes-lente-verde-foto-1.webp', 'Gafas Office Cafes lente verde, con modelo 1', 'gallery', 1);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-office'), 'GAF-OFF-03', 'Ghost', '#dbeafe', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-03'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-03');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-office'), (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-03'), '/products/gafas/office/ghost-1.webp', 'Gafas Office Ghost, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-office'), (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-03'), '/products/gafas/office/ghost-foto-1.webp', 'Gafas Office Ghost, con modelo 1', 'gallery', 1);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-office'), (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-03'), '/products/gafas/office/ghost-foto-2.webp', 'Gafas Office Ghost, con modelo 2', 'gallery', 2);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-office'), 'GAF-OFF-04', 'Negras', '#111827', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-04'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-04');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-office'), (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-04'), '/products/gafas/office/negras-1.webp', 'Gafas Office Negras, foto 1', 'card', 0);
INSERT INTO product_variants (id, product_id, sku, label, swatch, price_cents, compare_at_cents, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-office'), 'GAF-OFF-05', 'Negras lente amarillo', '#111827', 3990000, NULL, 150, 100, 100, 60, clock_timestamp(), now())
ON CONFLICT (sku) DO UPDATE SET label = EXCLUDED.label, swatch = EXCLUDED.swatch, price_cents = EXCLUDED.price_cents, compare_at_cents = EXCLUDED.compare_at_cents, updated_at = now();
INSERT INTO inventory_items (id, variant_id, on_hand, updated_at) VALUES (gen_random_uuid(), (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-05'), 10, now())
ON CONFLICT (variant_id) DO UPDATE SET on_hand = EXCLUDED.on_hand, updated_at = now();
DELETE FROM product_images WHERE variant_id = (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-05');
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-office'), (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-05'), '/products/gafas/office/negras-lente-amarillo-1.webp', 'Gafas Office Negras lente amarillo, foto 1', 'card', 0);
INSERT INTO product_images (id, product_id, variant_id, url, alt, kind, position) VALUES (gen_random_uuid(), (SELECT id FROM products WHERE slug = 'gafas-office'), (SELECT id FROM product_variants WHERE sku = 'GAF-OFF-05'), '/products/gafas/office/negras-lente-amarillo-foto-1.webp', 'Gafas Office Negras lente amarillo, con modelo 1', 'gallery', 1);

COMMIT;
