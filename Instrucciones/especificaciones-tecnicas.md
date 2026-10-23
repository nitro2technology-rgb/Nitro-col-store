# Especificaciones Técnicas — E-commerce (Tecnología y Hogar)

**Versión:** 1.1
**Fecha:** 23 de octubre de 2026 (v1.0: 21 de octubre)
**Estado:** En implementación. Ver sección 18 para lo ya construido y las decisiones tomadas

---

## 1. Resumen y objetivos

Plataforma de comercio electrónico para vender inicialmente dos categorías: **Tecnología** y **Hogar**, con la meta de crecer de forma sostenida (más categorías, más catálogo, más tráfico, posibles vendedores externos y otros países).

### Principios de diseño

1. **Empezar simple, escalar por piezas.** Monolito modular al inicio; separar servicios solo cuando una métrica lo justifique.
2. **Un solo lenguaje (TypeScript)** en frontend y backend para reducir costos de contratación y mantenimiento.
3. **SEO y velocidad primero.** En e-commerce, el rendimiento y el posicionamiento orgánico impactan directamente las ventas.
4. **Seguridad y cumplimiento desde el día 1** (pagos, datos personales, facturación).
5. **Catálogo flexible.** Tecnología y Hogar tienen atributos muy distintos (RAM vs. dimensiones/material); el modelo de datos debe soportarlo sin migraciones por cada categoría nueva.

### Alcance de la versión 1 (MVP)

- Catálogo con categorías, búsqueda y filtros
- Carrito y checkout
- Registro/login de clientes
- Pagos en línea
- Gestión de pedidos y envíos
- Panel de administración
- Emails transaccionales

### Fuera de alcance del MVP (hoja de ruta)

Marketplace multi-vendedor, app móvil nativa, programa de lealtad, recomendaciones con IA, multi-país/multi-moneda.

---

## 2. Stack tecnológico recomendado

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend (tienda) | **Next.js (App Router) + TypeScript** | SSR/ISR para SEO y velocidad, gran ecosistema, fácil de contratar |
| Estilos / UI | **Tailwind CSS + shadcn/ui** | Desarrollo rápido, diseño consistente, sin dependencia pesada |
| Estado cliente | **TanStack Query + Zustand** | Caché de datos del servidor y estado ligero (carrito, UI) |
| Formularios | **React Hook Form + Zod** | Validación tipada, el mismo esquema se reutiliza en backend |
| Backend (API) | **NestJS + TypeScript** | Arquitectura modular, inyección de dependencias, ideal para crecer por dominios |
| Base de datos | **PostgreSQL en Supabase** | Decisión ya tomada; relacional, robusto, con RLS |
| ORM / acceso a datos | **Prisma** (o Drizzle) | Migraciones versionadas, tipado fuerte |
| Autenticación | **Supabase Auth** | Email, OAuth (Google), JWT; evita construir auth propio |
| Almacenamiento de imágenes | **Supabase Storage + CDN** | Imágenes de producto; transformaciones y caché |
| Caché / colas | **Redis (Upstash) + BullMQ** | Caché, rate limiting, trabajos en segundo plano |
| Búsqueda | **Meilisearch** o **Typesense** (fase 2); Postgres full-text en MVP | Búsqueda rápida con tolerancia a errores y filtros por facetas |
| Pagos | **Wompi** y/o **Mercado Pago** (Colombia) | PSE, tarjetas, Nequi, efectivo; ver sección 8 |
| Emails | **Resend** o **Postmark** | Transaccionales con buena entregabilidad |
| Monitoreo de errores | **Sentry** | Frontend y backend |
| Analítica | **GA4 + PostHog** | Embudo de conversión y comportamiento |
| CI/CD | **GitHub Actions** | Tests, lint y despliegue automáticos |

### 2.1 Alternativa a evaluar: motor de e-commerce headless

Antes de construir todo desde cero, considera **Medusa.js** (open source, Node/TypeScript, headless). Ya trae carrito, pedidos, promociones, inventario, devoluciones y extensibilidad por módulos, y se conecta a PostgreSQL.

| | Backend propio (NestJS) | Medusa.js |
|---|---|---|
| Tiempo al MVP | Mayor | Menor |
| Flexibilidad total | Máxima | Alta, dentro de sus módulos |
| Reglas de negocio ya resueltas | Debes construirlas | Vienen incluidas |
| Curva de aprendizaje | Conoces tu código al 100% | Debes aprender su framework |

**Recomendación:** si el objetivo es salir al mercado rápido y tu lógica de negocio es la estándar de un retail, Medusa reduce meses de trabajo. Si tu negocio tendrá reglas muy particulares (marketplace, precios dinámicos, integraciones complejas), NestJS da más control. Este documento asume **NestJS**, pero la arquitectura de datos y la separación frontend/API aplican igual a ambos caminos.

### 2.2 Por qué no usar solo Supabase como backend

Supabase puede exponer la base de datos directamente al cliente (con RLS), pero para un e-commerce conviene tener una **API propia** para: cálculo de precios e impuestos, validación de inventario, webhooks de pasarelas de pago, integraciones logísticas y facturación. **Regla:** el navegador nunca escribe directamente en tablas de pedidos, pagos o inventario.

---

## 3. Arquitectura general

```
                    ┌──────────────────────┐
   Cliente web ───▶ │  CDN (Vercel/Cloudflare) │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  Next.js (Storefront) │  SSR / ISR / Server Actions
                    └──────────┬───────────┘
                               │ HTTPS (REST/JSON)
                    ┌──────────▼───────────┐        ┌─────────────┐
                    │   API NestJS          │◀──────▶│   Redis      │
                    │  (monolito modular)   │        │ caché/colas  │
                    └───┬──────┬──────┬────┘        └─────────────┘
                        │      │      │
        ┌───────────────▼┐  ┌──▼────┐ └──▶ Servicios externos:
        │ Supabase        │  │Worker │      pagos, envíos, email,
        │ Postgres/Auth/  │  │BullMQ │      facturación electrónica
        │ Storage         │  └───────┘
        └─────────────────┘
                    ┌──────────────────────┐
                    │ Panel Admin (Next.js) │──▶ misma API NestJS
                    └──────────────────────┘
```

### 3.1 Estructura del repositorio (monorepo)

```
/apps
  /storefront     → Tienda pública (Next.js)
  /admin          → Panel de administración (Next.js)
  /api            → API (NestJS)
  /worker         → Procesos en segundo plano (puede vivir dentro de /api al inicio)
/packages
  /shared         → Tipos, esquemas Zod, constantes compartidas
  /ui             → Componentes reutilizables
  /config         → ESLint, TSConfig, Tailwind
```

Herramienta sugerida: **pnpm workspaces + Turborepo**.

### 3.2 Módulos del backend (monolito modular)

Cada módulo tiene sus propios controladores, servicios y acceso a datos, y **no accede directamente a las tablas de otro módulo**; se comunican por servicios o eventos. Esto permite extraer un módulo a microservicio más adelante.

| Módulo | Responsabilidad |
|---|---|
| `auth` | Validación de JWT de Supabase, roles y permisos |
| `users` | Perfiles, direcciones |
| `catalog` | Productos, variantes, categorías, marcas, atributos |
| `inventory` | Stock por variante/bodega, reservas |
| `pricing` | Precios, descuentos, impuestos (IVA) |
| `cart` | Carrito de compras (usuarios e invitados) |
| `checkout` | Flujo de compra, validaciones |
| `orders` | Ciclo de vida del pedido |
| `payments` | Integración con pasarelas, webhooks |
| `shipping` | Cotización, guías, seguimiento |
| `promotions` | Cupones, ofertas, reglas |
| `reviews` | Reseñas y calificaciones |
| `notifications` | Emails, SMS/WhatsApp |
| `search` | Indexación y consulta |
| `invoicing` | Facturación electrónica |
| `admin` | Endpoints de back-office |
| `analytics` | Eventos y reportes |

---

## 4. Modelo de datos (PostgreSQL)

### 4.1 Entidades principales

```
users / profiles ──< addresses
categories (árbol: parent_id)
brands
products ──< product_variants ──< inventory_items
products ──< product_images
products >──< categories           (product_categories)
products ──< product_attribute_values >── attributes
carts ──< cart_items >── product_variants
orders ──< order_items
orders ──< payments
orders ──< shipments
orders ──< order_status_history
coupons ──< coupon_redemptions
landing_pages >──< products        (landing_page_products)
campaign_links >── landing_pages
reviews >── products, users
```

### 4.2 Decisiones clave para soportar "Tecnología" y "Hogar" (y más)

- **`products`** guarda lo común: nombre, slug, descripción, marca, estado.
- **`product_variants`** guarda lo vendible: SKU, precio, stock, peso, dimensiones (ej. "Negro / 256 GB").
- **Atributos flexibles:** tabla `attributes` (nombre, tipo, unidad, categoría) + `product_attribute_values`. Para filtros por facetas. Complementar con una columna **`jsonb`** (`specs`) para especificaciones de solo lectura que no se filtran.
- **Categorías en árbol** (`parent_id`) con `path` materializado o `ltree` para consultas rápidas de descendientes.
- Nueva categoría = nuevos registros, **no cambios de esquema**.

### 4.3 Convenciones

- Claves primarias `uuid` (v7 si es posible, ordenables por tiempo).
- Columnas `created_at`, `updated_at` en todas las tablas; `deleted_at` para borrado lógico en catálogo.
- **Dinero:** guardar en **enteros en la unidad mínima** (centavos) con columna `currency` (`COP`). Nunca `float`.
- Nombres de tablas y columnas en `snake_case`, en inglés; documentación en español.
- Todo cambio de esquema vía **migraciones versionadas** (Prisma Migrate). Prohibido editar producción manualmente.
- Índices: slug único, SKU único, `(category_id, status)`, claves foráneas, índice GIN sobre `jsonb` y sobre `tsvector` de búsqueda.

### 4.4 Seguridad a nivel de base de datos (Supabase)

- **Row Level Security (RLS) activado en todas las tablas** del esquema público.
- Políticas: el cliente solo lee su propio perfil, direcciones y pedidos; el catálogo público es de solo lectura.
- La API usa la `service_role key` **únicamente en el servidor**; jamás se expone al navegador.
- Esquemas separados: `public` (expuesto), `private` (interno, sin acceso desde la API de Supabase).

### 4.5 Ciclo de vida del pedido

```
pending_payment → paid → processing → shipped → delivered
        │           │         │
        ▼           ▼         ▼
    cancelled    refunded   cancelled
                              └─▶ return_requested → returned
```

Cada transición se registra en `order_status_history` con usuario, fecha y motivo.

### 4.6 Inventario

- Reserva de stock al iniciar el pago (con expiración, ej. 15 min) para evitar sobreventa.
- Descuento definitivo al confirmar el pago.
- Operaciones de stock con **transacciones y bloqueo optimista/`SELECT … FOR UPDATE`** para evitar condiciones de carrera.

---

## 5. API

- **Estilo:** REST + JSON, versionada (`/api/v1/...`).
- **Documentación:** OpenAPI/Swagger generado automáticamente por NestJS.
- **Validación:** Zod (o class-validator) en cada entrada; respuestas tipadas.
- **Paginación:** por cursor en listados grandes (catálogo, pedidos).
- **Errores:** formato uniforme `{ code, message, details }` con códigos HTTP correctos.
- **Idempotencia:** claves de idempotencia en creación de pedidos y pagos.
- **Rate limiting:** por IP y por usuario (Redis), más estricto en login, checkout y cupones.
- **Webhooks:** endpoints dedicados con verificación de firma, procesamiento idempotente y reintentos.

### Endpoints de referencia (resumen)

| Recurso | Ejemplos |
|---|---|
| Catálogo | `GET /products`, `GET /products/:slug`, `GET /categories` |
| Búsqueda | `GET /search?q=&filters=` |
| Carrito | `GET/POST/PATCH/DELETE /cart/items` |
| Checkout | `POST /checkout`, `POST /checkout/shipping-quote` |
| Pedidos | `GET /orders`, `GET /orders/:id` |
| Pagos | `POST /payments/intent`, `POST /webhooks/payments/:provider` |
| Admin | `/admin/products`, `/admin/orders`, `/admin/inventory`, `/admin/coupons` |

---

## 6. Frontend

### 6.1 Estrategia de renderizado (Next.js)

| Página | Estrategia | Motivo |
|---|---|---|
| Home, categorías | **ISR** (revalidación periódica) | Rápidas y cacheables |
| Detalle de producto | **ISR + revalidación on-demand** al cambiar precio/stock | SEO + datos frescos |
| Búsqueda | SSR o cliente con TanStack Query | Resultados dinámicos |
| Carrito, checkout, cuenta | **Dinámico / cliente** | Datos personalizados |

### 6.2 Requisitos de calidad

- **Core Web Vitals:** LCP < 2.5 s, INP < 200 ms, CLS < 0.1 (en móvil, conexión 4G).
- **Mobile-first:** la mayoría del tráfico en Colombia es móvil.
- **Imágenes:** `next/image`, formatos AVIF/WebP, *lazy loading*, tamaños responsivos.
- **SEO:** metadatos por página, datos estructurados **schema.org** (`Product`, `Offer`, `BreadcrumbList`, `AggregateRating`), `sitemap.xml` dinámico, `robots.txt`, URLs limpias y canónicas.
- **Accesibilidad:** WCAG 2.1 nivel AA (contraste, teclado, etiquetas).
- **Internacionalización preparada:** textos en archivos de traducción (`next-intl`), aunque inicie solo en español (es-CO).

### 6.3 Pantallas del MVP

**Tienda:** Home · Listado por categoría (filtros, orden) · Búsqueda · Detalle de producto · Carrito · Checkout (dirección → envío → pago) · Confirmación · Cuenta (pedidos, direcciones, perfil) · Páginas legales y de ayuda.

**Admin:** Dashboard · Productos y variantes · Categorías y atributos · Inventario · Pedidos · Clientes · Cupones · Reportes básicos · Usuarios y roles.

### 6.4 Landing pages por producto y campañas publicitarias

**Objetivo:** poder dirigir cada anuncio (Meta, Google, TikTok, email, WhatsApp, influencers) a una página pensada para convertir ese producto, y medir qué campaña generó cada venta.

#### 6.4.1 Dos niveles de página (enfoque híbrido)

| Nivel | Ruta | Descripción | Cuándo usarla |
|---|---|---|---|
| **Página de producto optimizada** | `/p/[slug]` | La página de detalle normal, preparada para recibir tráfico pago (carga rápida, CTA visible, prueba social) | Por defecto, para **todos** los productos, sin trabajo extra |
| **Landing de campaña** | `/promo/[campaign-slug]` | Página dedicada con contenido propio (historia, beneficios, comparativas, FAQ, oferta con tiempo limitado) | Productos estrella o campañas con inversión relevante |

Cada producto siempre tiene su página optimizada; la landing de campaña es opcional y se crea desde el panel admin. Una landing puede estar asociada a uno o varios productos, y puede haber **varias landings para el mismo producto** (distintos públicos o mensajes, útil para pruebas A/B).

#### 6.4.2 Constructor de landings por bloques (panel admin)

Las landings se arman con **bloques reutilizables**, sin necesidad de programar cada una:

- Hero (imagen/video, titular, subtítulo, CTA)
- Galería de imágenes y video
- Beneficios / características con íconos
- Especificaciones técnicas (desde los atributos del producto)
- Comparativa con otras variantes
- Reseñas y calificaciones reales
- Preguntas frecuentes (con datos estructurados `FAQPage`)
- Oferta con cuenta regresiva y stock limitado (solo si es real)
- Garantía, envíos y devoluciones
- Barra fija inferior con precio + botón "Comprar" (móvil)
- Productos relacionados / *cross-sell*

El contenido se guarda como JSON (`blocks`) en la tabla `landing_pages`, y el frontend lo renderiza con componentes tipados. Soporta estados `borrador → publicada → archivada` y vista previa antes de publicar.

#### 6.4.3 Reglas de la landing

- **Precio y stock siempre en vivo:** la landing nunca duplica el precio; lo lee del producto. Si cambia el precio, cambia en la landing.
- **Compra directa:** botón que agrega al carrito y lleva al checkout en un paso (opción de "comprar ahora" que omite el carrito).
- **Sin distracciones:** menú reducido, sin enlaces que saquen al usuario del embudo.
- **Rendimiento:** renderizado ISR, JavaScript mínimo, imágenes optimizadas; objetivo LCP < 2.0 s en móvil, porque cada segundo extra encarece la publicidad.
- **SEO:** las landings de campaña usan `canonical` hacia la página del producto (o `noindex`) para evitar contenido duplicado, salvo que se decida posicionarlas a propósito.
- **Cupones por URL:** `?coupon=VERANO10` aplica el cupón automáticamente al llegar.

#### 6.4.4 Enlaces de campaña y atribución

- Cada landing/producto acepta parámetros **UTM** (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) y los identificadores de clic de las plataformas (`gclid`, `fbclid`, `ttclid`).
- Estos datos se guardan en una **cookie de primera parte** (con consentimiento) durante 30 días y se **asocian al pedido** (`orders.attribution` en `jsonb`), de modo que se sabe qué campaña vendió qué.
- **Generador de enlaces cortos** en el admin: `tutienda.co/r/abc123` → redirige a la landing o producto con los UTM ya configurados. Permite cambiar el destino sin editar el anuncio.
- Plantillas de UTM por plataforma para evitar errores de nomenclatura.

#### 6.4.5 Medición y píxeles

| Herramienta | Uso |
|---|---|
| **GA4** | Embudo: `view_item`, `add_to_cart`, `begin_checkout`, `purchase` |
| **Meta Pixel + Conversions API (CAPI)** | Eventos desde el navegador **y** desde el servidor, deduplicados con un `event_id` |
| **Google Ads** | Conversiones y remarketing |
| **TikTok Pixel / Events API** | Si se pauta en TikTok |
| **PostHog** | Mapas de calor, grabaciones y pruebas A/B |

- El evento `purchase` se envía **desde el servidor al confirmarse el pago** (webhook), no solo desde el navegador: es más fiable ante bloqueadores de anuncios y cambios de privacidad en iOS.
- Los scripts se cargan solo tras el **consentimiento de cookies**.
- Métricas por landing: visitas, tasa de clic al CTA, *add to cart*, conversión, ingresos y ROAS por campaña.

#### 6.4.6 Catálogos para anuncios dinámicos

Para anuncios de catálogo y Google Shopping, el backend expone **feeds de productos** generados automáticamente desde la base de datos:

- Feed para **Google Merchant Center** (XML/CSV)
- Feed para **Meta Catalog** (Facebook/Instagram/WhatsApp)
- Actualización programada (cada hora) con precio, stock, imágenes y enlace a la página del producto

Esto exige que cada variante tenga: SKU, GTIN/código de barras (cuando aplique), marca, imágenes de calidad y descripción completa.

#### 6.4.7 Datos adicionales en el modelo

```
landing_pages
  id, slug, title, status, blocks (jsonb), seo (jsonb),
  starts_at, ends_at, created_by, created_at, updated_at
landing_page_products   (landing_page_id, product_id)
campaign_links
  id, short_code, destination_url, utm (jsonb), landing_page_id,
  clicks_count, created_at
orders.attribution (jsonb)   → utm, click ids, landing_page_id, campaign_link_id
```

#### 6.4.8 Endpoints adicionales

| Recurso | Ejemplos |
|---|---|
| Landings (público) | `GET /landings/:slug` |
| Landings (admin) | `POST/PATCH /admin/landings`, `POST /admin/landings/:id/publish` |
| Enlaces cortos | `GET /r/:code` (redirección), `POST /admin/campaign-links` |
| Feeds | `GET /feeds/google-merchant.xml`, `GET /feeds/meta-catalog.csv` |
| Eventos | `POST /events/track` (envío a CAPI y analítica del lado servidor) |

---

## 7. Autenticación y autorización

- **Supabase Auth** para clientes y administradores (email + contraseña, Google OAuth, enlace mágico opcional).
- La API valida el **JWT de Supabase** en cada solicitud.
- **Roles:** `customer`, `support`, `catalog_manager`, `admin`, `super_admin` (RBAC), guardados en una tabla propia y no editables por el usuario.
- **Carrito de invitado:** identificado por cookie firmada; se fusiona con el carrito del usuario al iniciar sesión.
- **MFA obligatorio** para cuentas administrativas.
- Sesiones con cookies `HttpOnly`, `Secure`, `SameSite=Lax`.

---

## 8. Integraciones externas (enfoque Colombia)

| Función | Opciones | Notas |
|---|---|---|
| **Pagos** | Wompi, Mercado Pago, PayU, ePayco | PSE, tarjetas crédito/débito, Nequi, Daviplata, efectivo (Efecty/Baloto). Abstraer detrás de una interfaz `PaymentProvider` para poder cambiar o sumar pasarelas |
| **Envíos** | Servientrega, Coordinadora, Interrapidísimo, Envía, o agregadores (Mipaquete, Enviame) | Cotización en checkout, generación de guía y tracking |
| **Facturación electrónica** | Proveedor tecnológico habilitado por la DIAN (Siigo, Alegra, Factus, etc.) | Obligatoria; emisión automática al confirmar pago |
| **Email** | Resend, Postmark | Confirmación, envío, recuperación de carrito |
| **WhatsApp / SMS** | WhatsApp Business API, Twilio | Notificaciones de estado del pedido |
| **Analítica** | GA4, Meta Pixel, PostHog | Con consentimiento de cookies |

**Patrón:** cada integración se encapsula como un *adapter* con interfaz propia. Los fallos externos nunca deben romper el checkout: se usan reintentos con *backoff* y colas.

---

## 9. Seguridad

- **HTTPS** obligatorio (HSTS); cabeceras de seguridad (CSP, X-Frame-Options, etc.).
- **PCI-DSS:** los datos de tarjeta **nunca pasan por nuestros servidores**; se usa tokenización/checkout alojado de la pasarela.
- **Protección de datos personales:** cumplimiento de la **Ley 1581 de 2012** (Habeas Data): política de privacidad, autorización expresa, derecho de acceso/eliminación, registro de bases de datos ante la SIC cuando aplique.
- **Derechos del consumidor:** Estatuto del Consumidor (Ley 1480 de 2011): retracto, garantías, información clara de precios y envío.
- **OWASP Top 10:** validación de entradas, consultas parametrizadas (ORM), protección CSRF/XSS, control de acceso en cada endpoint.
- **Secretos:** variables de entorno gestionadas por el proveedor de despliegue; nunca en el repositorio. Rotación periódica.
- **Webhooks:** verificación de firma y protección contra *replay*.
- **Auditoría:** registro de acciones administrativas (quién cambió qué y cuándo).
- **Copias de seguridad:** backups diarios de Supabase con *Point-in-Time Recovery* en el plan de producción; prueba de restauración trimestral.
- **Antifraude:** límites de intentos, verificación de pagos por webhook (no confiar en la redirección del cliente).

> Nota: los puntos legales deben ser validados con un abogado antes del lanzamiento.

---

## 10. Infraestructura y despliegue

### 10.1 Entornos

| Entorno | Propósito | Base de datos |
|---|---|---|
| `local` | Desarrollo | Supabase CLI (Docker) |
| `staging` | Pruebas e integración, pagos en sandbox | Proyecto Supabase separado |
| `production` | Clientes reales | Proyecto Supabase de producción |

### 10.2 Hosting sugerido

| Componente | Opción inicial | Opción a escala |
|---|---|---|
| Storefront y Admin | **Vercel** | Vercel Enterprise / AWS (ECS o Amplify) |
| API NestJS + Worker | **Railway / Render / Fly.io** | AWS ECS Fargate o Kubernetes |
| Base de datos | **Supabase Pro** | Supabase con compute dedicado + réplicas de lectura |
| Redis | **Upstash** | ElastiCache |
| CDN y WAF | Vercel + **Cloudflare** | Cloudflare |

> Latencia: el tráfico principal es de Colombia. Elegir regiones cercanas (por ejemplo `us-east` / São Paulo) para Supabase y la API, y mantenerlas **en la misma región** para evitar latencia entre servicios.

### 10.3 CI/CD

1. *Pull request* → lint, typecheck, tests unitarios y de integración.
2. *Merge* a `main` → despliegue automático a **staging**.
3. Etiqueta de versión / aprobación manual → despliegue a **producción**.
4. Migraciones de base de datos aplicadas automáticamente y de forma controlada en el pipeline.
5. Estrategia de *rollback* documentada para cada despliegue.

---

## 11. Rendimiento y escalabilidad

### 11.1 Objetivos iniciales

| Métrica | Objetivo |
|---|---|
| Disponibilidad | ≥ 99.9 % |
| Respuesta API (p95) | < 300 ms en lecturas, < 800 ms en checkout |
| Carga de página de producto (LCP) | < 2.5 s en móvil |
| Capacidad inicial | ~100 usuarios concurrentes, picos de 10× en campañas |

### 11.2 Plan de escalado por etapas

| Etapa | Señal | Acción |
|---|---|---|
| 1. MVP | Tráfico bajo | Monolito, Postgres en Supabase, caché con ISR |
| 2. Crecimiento | Consultas lentas, búsqueda pobre | Redis para caché, **Meilisearch/Typesense**, índices y *pooler* de conexiones (Supavisor) |
| 3. Alto tráfico | Base de datos saturada | **Réplicas de lectura**, particionado de tablas grandes (pedidos, eventos), CDN agresivo |
| 4. Complejidad organizacional | Equipos grandes o módulos con carga muy distinta | Extraer módulos (búsqueda, pagos, notificaciones) a servicios independientes con mensajería de eventos |
| 5. Expansión | Nuevos países | Multi-moneda, multi-idioma, impuestos por país, CDN regional |

### 11.3 Buenas prácticas desde el inicio

- Usar el **connection pooler** de Supabase (modo transacción) para la API.
- Evitar consultas N+1; revisar planes con `EXPLAIN ANALYZE`.
- Tareas pesadas (emails, sincronizar inventario, generar facturas, indexar búsqueda) **siempre en colas**, no en la petición del usuario.
- Caché de catálogo con invalidación por eventos (al editar un producto se revalida su página).
- Pruebas de carga (k6) antes de campañas grandes (Black Friday, Día sin IVA, Cyber Monday).

---

## 12. Observabilidad

- **Logs estructurados** (JSON) con ID de correlación por petición.
- **Errores:** Sentry en frontend, API y worker, con alertas.
- **Métricas:** tiempo de respuesta, tasa de error, profundidad de colas, uso de base de datos.
- **Monitoreo de disponibilidad:** Better Stack / UptimeRobot en el sitio, API y checkout.
- **Alertas críticas:** caída de pagos, fallos de webhooks, errores 5xx > umbral, stock negativo.
- **Métricas de negocio:** conversión, abandono de carrito, ticket promedio, productos más vistos y vendidos.

---

## 13. Calidad y pruebas

| Tipo | Herramienta | Cobertura mínima |
|---|---|---|
| Unitarias | Vitest / Jest | Lógica de precios, impuestos, inventario, estados de pedido |
| Integración | Jest + Supertest + BD de pruebas | Endpoints críticos |
| E2E | **Playwright** | Registro, búsqueda, agregar al carrito, checkout, pago sandbox |
| Carga | k6 | Catálogo y checkout |
| Estáticas | ESLint, Prettier, TypeScript estricto | 100 % del código |

- Flujo **Git:** ramas cortas por funcionalidad, *pull requests* con revisión obligatoria.
- **Commits** con *Conventional Commits*.
- El checkout y los pagos requieren pruebas E2E obligatorias antes de cada despliegue.

---

## 14. Estimación de costos mensuales (referencial, etapa MVP)

| Servicio | Plan | Costo aprox. (USD/mes) |
|---|---|---|
| Supabase | Pro | 25+ |
| Vercel | Pro | 20 |
| API + Worker (Railway/Render) | Starter | 10–30 |
| Redis (Upstash) | Pay-as-you-go | 0–10 |
| Email (Resend) | Free/Pro | 0–20 |
| Sentry | Team | 0–26 |
| Dominio + Cloudflare | — | 1–10 |
| **Total estimado** | | **≈ 60–150** |

Más comisiones de pasarela de pagos (porcentaje + tarifa fija por transacción) y costos de facturación electrónica. Los precios cambian; verificar antes de decidir.

---

## 15. Hoja de ruta sugerida

| Fase | Duración aprox. | Entregables |
|---|---|---|
| **0. Fundamentos** | 2 semanas | Monorepo, CI/CD, esquema de BD, autenticación, entornos |
| **1. Catálogo** | 3 semanas | Productos, variantes, categorías, admin de catálogo, páginas de tienda |
| **2. Compra** | 4 semanas | Carrito, checkout, pagos, pedidos, inventario, emails |
| **3. Operación** | 3 semanas | Envíos, facturación electrónica, panel de pedidos, reportes |
| **4. Pulido y lanzamiento** | 2 semanas | SEO, rendimiento, seguridad, pruebas de carga, legales |
| **5. Publicidad** | 3 semanas | Página de producto optimizada para anuncios, UTM y atribución en pedidos, píxeles + Conversions API, enlaces cortos, feeds de catálogo |
| **6. Crecimiento** | Continuo | Constructor de landings por bloques, pruebas A/B, búsqueda avanzada, reseñas, promociones, optimización |

*(Estimación para un equipo pequeño de 2–3 desarrolladores; puede variar.)*

---

## 16. Riesgos y decisiones pendientes

| # | Tema | Decisión / acción |
|---|---|---|
| 1 | NestJS propio vs. Medusa.js | **Decidido: NestJS propio** |
| 2 | Pasarela de pagos principal | Comparar comisiones y medios de pago (Wompi vs. Mercado Pago vs. PayU) |
| 3 | Modelo logístico | ¿Bodega propia, dropshipping o proveedores? Impacta inventario y envíos |
| 4 | Proveedor de facturación electrónica | Seleccionar y validar integración con la DIAN |
| 5 | Marketplace | **Decidido (22 oct): habrá vendedores externos.** Implementado: tabla `sellers`, `seller_id` en productos y líneas de pedido, rol `seller`. Pendiente: RLS por vendedor, comisiones y liquidación |
| 6 | Región de despliegue | Confirmar región de Supabase y API según latencia hacia Colombia |
| 7 | Asesoría legal | Términos, privacidad, retracto, tratamiento de datos |

---

## 17. Glosario

- **ISR:** Regeneración estática incremental; páginas pre-generadas que se actualizan en segundo plano.
- **RLS:** Row Level Security; reglas de acceso por fila en PostgreSQL.
- **SKU:** Código único de una variante vendible.
- **Monolito modular:** Una sola aplicación desplegable, organizada internamente en módulos independientes.
- **Idempotencia:** Repetir una operación no produce efectos duplicados.
- **Webhook:** Llamada automática de un servicio externo para notificar un evento (p. ej. pago aprobado).

---

## 18. Estado de implementación y decisiones (actualizado el 23 de octubre de 2026)

### 18.1 Construido

- **Monorepo** pnpm + Turborepo: `apps/storefront` (Next.js 15, Tailwind v4), `packages/ui`, `shared`, `db`, `config`. Aún no existe `apps/api`.
- **Base de datos en Supabase**, conectada con Prisma y **migrada** (migraciones `init`, `catalogo_completo`, `rls_politicas`, `imagen_tipo`, `etiquetas`). Está **vacía**; el catálogo aún se lee de `lib/products.ts`.
- **Seguridad (RLS):** activa en todas las tablas de `public`. Catálogo (`categories`, `brands`, `products`, `product_variants`, `product_images`) de solo lectura pública y solo lo publicado; el cliente autenticado ve solo su perfil, direcciones y pedidos. Prisma se conecta como dueño y la ignora; pedidos, pagos e inventario solo se escriben desde el servidor. En Supabase se desactivó "exponer tablas nuevas automáticamente" y se activó la RLS automática.
- **Seed** idempotente (`packages/db/prisma/seed.ts`) que lee `lib/products.ts`; simula por defecto y escribe con `--apply`. Peso y medidas son provisionales (150 g, 100×100×60 mm) hasta recibir los reales.

### 18.2 Cambios al modelo de datos (respecto a la sección 4)

- **`sellers`** (nueva): nombre, slug, `is_house` (la tienda propia es un vendedor), dueño (`owner_profile_id`), `commission_bps`, activo. `products.seller_id` (obligatorio) y `order_items.seller_id`; rol `seller` en `Role`.
- **`products`:** `highlights`, `in_box`, `faq` (jsonb), `video_url`, `video_poster`, `tags` (text[], p. ej. "Deportivas").
- **`product_variants`:** `swatch` (color de muestra).
- **`product_images`:** `variant_id` (foto de un color; null = galería general) y `kind` (`card` = carrusel de la tarjeta/cabecera, `gallery` = sección Galería).

### 18.3 Frontend

- **Catálogo y búsqueda:** la búsqueda es del lado del cliente (`buildSearchIndex`) sobre el catálogo en memoria. Con el catálogo en base de datos habrá que pasarla a servidor (índice `tsvector` / Postgres) por tamaño y frescura.
- **Variantes y fotos:** el color elegido se comparte entre la cabecera y la galería (`VariantProvider`); la URL admite `?color=SKU`. Galería de Moda sin repetir la foto de portada de la tarjeta.
- **Diseño por categoría:** una categoría con `byColor` usa lista por color, diseño editorial y su propia portada (`cover`). Otras categorías mantienen el diseño de vidrio con tarjetas por producto.
- **Imágenes:** `next/image` con AVIF/WebP y `qualities: [75, 90]`; los originales de gafas se guardan a 1080 px / calidad 88 y la entrega se optimiza. Solo las portadas de Moda se sirven sin recomprimir (`unoptimized`). Las fotos originales miden como máximo 1080 px de ancho: no hay más resolución disponible.
- **Precios sin definir:** `priceCents = 0` se muestra como "Precio por definir" y bloquea la compra (`formatPrice`).
- **Menú:** Inicio, Categorías y carrito con apertura al pasar el mouse, buscador, botón flotante de volver (solo en páginas de segundo nivel).

### 18.4 Pendiente técnico

- Sembrar el catálogo y leerlo desde la base; decidir dónde viven las fotos (hoy `public/`; candidato: Supabase Storage + CDN).
- API con precios y stock validados en servidor, carrito en servidor, autenticación, checkout y pagos, panel de administración, RLS por vendedor.
- Probar rendimiento con `build` + `start` (Core Web Vitals de la sección 6.2) y en celular real.
- En desarrollo, el servidor de Next puede corromper su caché (`apps/storefront/.next`); borrarla y reiniciar lo soluciona.
