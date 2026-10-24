# Continuar aquí — Nitro Col Store

**Última actualización:** 23 de octubre de 2026 (**tienda en vivo en Render** en `https://nitrocol.nitro2tech.com`, rama `main`; base de Supabase migrada y sembrada; gafas con diseño editorial, búsqueda, filtros, carrito desplegable)
**Para quién es:** quien retome el proyecto (persona o Claude) sin haber visto la conversación anterior.

Lee primero `especificaciones-tecnicas.md` y `especificaciones-de-uso.md` (en esta misma carpeta). Este archivo solo resume **qué está hecho, cómo correrlo, qué decisiones se tomaron y qué sigue**.

---

## 1. Cómo correr el proyecto

Requisitos: Node 22+ y pnpm (`npm install -g pnpm`).

```bash
pnpm install
pnpm --filter @nitro/storefront dev     # http://localhost:3000
pnpm typecheck                          # tipos de todos los paquetes
pnpm --filter @nitro/storefront build   # build de producción
```

- **Servidor de desarrollo raro** (pantalla "Application error", 404 inesperado o que no responde, sobre todo tras muchos cambios o al tocar `next.config.ts`): cerrar el servidor, **borrar `apps/storefront/.next`** y volver a iniciarlo. Si el puerto 3000 está ocupado, Next usa el siguiente (3001, 3002...): mira la línea "Local:" al arrancar.
- pnpm bloquea los scripts de instalación de Prisma salvo los aprobados en `allowBuilds` de `pnpm-workspace.yaml` (ya están). Si aparece un paquete nuevo bloqueado: `pnpm approve-builds`.
- **Base de datos:** `packages/db/.env` (no está en git) tiene `DATABASE_URL` (pooler, puerto 6543, `?pgbouncer=true`) y `DIRECT_URL` (puerto 5432). Si la contraseña tiene caracteres especiales (`#`, `@`...) va codificada en la URL (`#` → `%23`). Migraciones: `pnpm --filter @nitro/db exec prisma migrate dev`. Seed: `pnpm --filter @nitro/db seed` simula; con `-- --apply` escribe.
- Excel de datos de productos: `Instrucciones/Datos de productos.xlsx` (pendiente de llenar por el dueño).

## 2. Estado actual

Hecho (la base de datos **ya tiene el catálogo** —19 productos, 77 variantes, 249 fotos, sembrado el 23 oct 2026 con las partes SQL—, pero la tienda **todavía lee de `lib/products.ts`** hasta activar `CATALOG_SOURCE=db`, sección 5d):

| Área | Estado |
|---|---|
| Monorepo (pnpm + Turborepo) | Listo: `apps/storefront`, `packages/{ui,shared,db,config}` |
| Tienda (Next.js 15, Tailwind v4) | Portada, categorías con filtros, ficha de producto, carrito, búsqueda, páginas informativas |
| Tecnología | Aurafit FW5 (azul/beige), G-tide L42 (negro/blanco/lila/rosado), Smartwatch X8 Pro, con fotos y video |
| Moda → Gafas | 16 modelos / 70 colores con fotos (`lib/gafas-data.ts`), **precios inventados** |
| Base de datos (Supabase) | **Conectada, migrada (5 migraciones, con RLS) y sembrada** con datos provisionales (precios de gafas inventados) |
| Seed | `prisma/seed.ts` (conexión directa) y `prisma/seed-sql.ts` (genera `prisma/seed-partes/parte-NN.sql` para el SQL Editor). Ambos repetibles |
| Diseño | Blanco y negro con vidrio; **diseño editorial solo para Moda** (sección 5) |
| Carrito | Navegador (Zustand + localStorage); mini ventana al pasar el mouse por el icono |
| Búsqueda | Lupa del menú: por nombre, color o palabra clave (cliente) |
| Páginas | `/ayuda`, `/terminos`, `/privacidad`, `/ingresar`, `/cuenta` con texto provisional |

**No existe todavía:** API NestJS (`apps/api`), panel de administración, autenticación, checkout, pagos, envíos, facturación electrónica, emails, cupones en el carrito, reseñas. Nada de esto está empezado.

## 3. Estructura

```
apps/storefront/
  app/                 páginas: / · /c/[slug] · /p/[slug] · /carrito · /ayuda · /terminos · /privacidad · /ingresar · /cuenta
  components/          header, menú de categorías (category-menu), buscador (site-search), carrito del menú (cart-link),
                       botón de volver (back-button), ficha (product-hero, variant-context, variant-gallery),
                       lista con filtros (catalog-grid), tarjeta (product-tile), carrusel (image-carousel),
                       portada y galería de Moda (moda-hero, editorial-gallery), follaje, intro del león, portada de inicio
  lib/products.ts      CATÁLOGO + categorías + helpers (variantImages, galleryImages, colorFamilies, isEditorial, buildSearchIndex)
  lib/gafas-data.ts    fotos de las gafas (generado desde Catálogo/Clothing/Gafas)
  lib/cart.ts          store del carrito (Zustand)
  public/brand/        logo, banner de portada, intro del león
  public/moda/         portadas de Moda (portada-1.webp, portada-2.webp)
  public/products/<slug>/  fotos y video de tecnología; public/products/gafas/<modelo>/ fotos de gafas
packages/ui/           tokens de tema (theme.css), Button, Badge
packages/shared/       tipos y esquemas zod del producto, formatCOP, formatPrice
packages/db/           schema.prisma, migraciones, seed.ts y cliente Prisma
Instrucciones/         especificaciones, diseños de referencia, Excel de datos, logo original
Catálogo/              fotos originales (NO está en git)
```

### Rutas
- `/` portada · `/c/tecnologia`, `/c/audifonos`, `/c/smartwatch` · `/c/moda`, `/c/gafas` · `/p/[slug]` (acepta `?color=SKU`) · `/carrito` y las páginas informativas.

### Categorías
Árbol de dos niveles en `lib/products.ts`: **Tecnología** (Audífonos, Smartwatch) y **Moda** (Gafas; próximamente Beanies). Se quitó **Hogar** al no tener productos. Cada producto guarda el slug de su categoría **hoja**. Una categoría con `byColor: true` (Moda) se lista por color, usa el diseño editorial y hereda su `cover` (portada).

### Productos destacados de la portada
**La portada siempre muestra 3 destacados**, en una sola fila bajo el título "Productos destacados" (pedido del dueño). Hoy son los 3 productos reales (Aurafit 1, G-tide 2, X8 Pro 3). Los elige el campo `featuredRank` de cada producto (menor número = primero); se muestran los 3 primeros. En la base de datos ya existe `products.featured_rank`; cuando haya panel de administración será un campo editable.

## 4. Decisiones de diseño (no las deshagas sin hablar con el dueño)

- **Fondo blanco y negro, como el logo.** Los grises de la paleta (`#EDEDED #9CA3AF #4B5563 #1F2937 #111827`) son de apoyo. El dueño dijo que más adelante se puede "jugar" con otros colores; los tokens están en `packages/ui/src/theme.css` (`--action` cambia el color de la acción principal sin tocar componentes).
- **Dos temas:** `light` (por defecto) y `dark`, que se aplican con `data-theme` en cualquier contenedor. Cada producto declara su tema (`theme`), y su página y su tarjeta lo usan.
- **Efecto vidrio** en todo: clases `glass`, `glass-nav`, `glass-band`, `stage-dark` en `theme.css`. El fondo blanco lleva manchas grises suaves (en `globals.css`) para que el vidrio tenga qué desenfocar.
- **Barra superior:** **negro translúcido y neutro** (`glass-nav`, con `saturate(0)` para que el banner no la tiña de amarillo), **a todo el ancho** y pegada arriba (no flotante). El dueño pidió explícitamente que no fuera una "burbuja". El panel de categorías cuelga de ella con esquinas inferiores redondeadas.
- **Logo:** `Instrucciones/logo.png` (negro sobre blanco) se convirtió a PNG transparente y se usa como **máscara CSS**, así toma el color del texto. El nombre "se escribe" al cargar la portada: es el único movimiento ambiental (se desactiva con `prefers-reduced-motion`).
- **Referencias de diseño:** `Instrucciones/Diseños frontend/` (audífonos = claro, smartwatch = oscuro). Se siguió su estructura (radios de 28 px, botones en píldora, tipografía grande) pero **no sus colores**, que el dueño cambió.
- **Botón principal:** invierte el tema (negro sobre claro, blanco sobre oscuro).
- **Tarjeta de producto:** pequeña (máx. 420 px), carrusel cuadrado con la foto completa (`object-contain`), y debajo nombre, eslogan, descripción y precio. Las fotos principales son las de ChatGPT.
- **Landing de producto (orden pedido por el dueño):** arriba, carrusel a la izquierda y a la derecha nombre, descripción y, debajo, color, precio y comprar. Luego especificaciones, "Lo principal", galería general (tarjetas de 560 px, foto completa, sin recorte), video, en la caja y preguntas frecuentes.
- **Fotos por variante:** `variant.images` es el carrusel de tarjeta y cabecera (al elegir un color cambian las fotos); `product.images` es la galería general. Ver `variantImages()` en `lib/products.ts`.

### Naturaleza + tecnología (pedido del dueño: "entrar a la naturaleza viendo productos", sin perder elegancia)
- **Follaje inmersivo** (`components/foliage.tsx`, estilos `fol-*` en `globals.css`): ramas dibujadas por código en tres planos (fondo desenfocado, medio nítido, primer plano muy desenfocado), sombras de hojas, rayos de luz y hojas que caen. Va fijo detrás del contenido en todas las páginas (`layout.tsx`); en páginas de producto oscuras se usa la variante `tone="night"`.
- **Legibilidad:** un velo claro en la franja central ("claro del bosque") y un halo del color del lienzo en los textos de `main`. Si se agrega texto sobre el follaje, revisar que se lea.
- **Rendimiento:** cada plano es su propio `<svg>` con el desenfoque como filtro CSS del elemento (no en `<g>`), y las capas animadas llevan `will-change`. En celular se ocultan rayos y la mitad de las hojas que caen. Todo se apaga con `prefers-reduced-motion`.

### Intro de primera visita (`components/intro.tsx`, estilos `intro-*` en `globals.css`)
- ~3,6 s, solo la primera vez (`localStorage`, clave `nitro-intro-v7`; subir la versión para que todos la vuelvan a ver). Se salta con clic o Escape; no sale con `prefers-reduced-motion`.
- Secuencia: logo sobre vidrio empañado → detrás, un león real (video) camina hacia el logo → zoom hasta centrar **sus dos ojos**, siempre empañado → la tienda se abre desde las dos pupilas con bordes difuminados → el logo viaja y **se acopla sobre el logo de la portada** (`data-intro-dock` en `home-hero.tsx`). En otras páginas el logo se disuelve.
- El dueño pidió explícitamente: el logo **no desaparece** hasta la transición final; nada de zarpazo; zoom a los dos ojos (no a uno); el empañado se mantiene todo el tiempo.
- Video: `public/brand/intro-leon.mp4` (296 KB, sin audio, recortado y acelerado 1,3×) a partir de `imagenes/intro/intro.mp4` (generado con Hailuo AI, plan gratuito). Las pupilas están medidas en `EYES` dentro del componente: si cambia el video, hay que volver a medirlas.
- Revisión: `?intro` la repite; en desarrollo `?intro=1700` la congela en ese milisegundo.

### Portada de inicio (`components/home-hero.tsx`)
- Tarjeta de vidrio translúcida con el banner sin fondo; detrás se ven ramas desenfocadas (`Branches` de `foliage.tsx`).
- Logo, "SINCE 2020" y lema son HTML (medidas en `cqw` para escalar con el banner). Entran encadenados: el logo se escribe y a su mitad entra "SINCE 2020"; a la mitad de este, el lema. El fondo "respira" (zoom lento) y un brillo cruza una vez. En la primera visita los textos esperan a que termine la intro.

## 5. Contenido provisional que hay que reemplazar

- **Productos reales, textos provisionales:** nombres, precios y fotos son reales (Aurafit $65.000, G-tide $69.900, X8 Pro $95.000, stock 10 cada uno; el dueño escribió "95.0000" para el reloj y se asumió $95.000). Las **descripciones, eslóganes, especificaciones y destacados los redactó Claude** con muy pocos datos; el dueño debe darlos o revisarlos. G-tide no tiene fotos de ChatGPT (usa sus fotos normales) y el color beige de Aurafit usa fotos del catálogo.
- **Fuentes de las fotos:** carpeta `Catálogo/` en la raíz (no está en git: 21 MB con PNG originales). Las fotos de ChatGPT se convirtieron a WebP (1600 px) como `principal-N.webp`. Si hay fotos nuevas, copiarlas a `apps/storefront/public/products/<slug>/` y referenciarlas en `lib/products.ts`.
- **Ilustraciones SVG** (`components/art/`): ya no se usan en los productos actuales; solo son el respaldo si un producto no tiene fotos.
- **Imagen de la portada:** La imagen `public/brand/portada-tarjeta.webp` es el banner de `imagenes/portada/portada.png` con el centro (logo y textos) borrado, el fondo blanco vuelto transparente y la ramita dibujada eliminada, para que se vea el follaje detrás. El logo, "SINCE 2020" y el lema son HTML encima, animados. Si cambia el banner, hay que repetir ese proceso. Muestra laptop, hogar, moda, etc., que hoy no vendemos.
- El logo en PNG mide ~640 px de ancho. Con un **SVG** se vería más nítido en pantallas de alta densidad.

## 5b. Moda → Gafas y diseño editorial

- **Datos:** cada carpeta de modelo es un producto (`gafas-<modelo>`) y cada subcarpeta de color una variante. Códigos: modelo `GAF-MIA`, color `GAF-MIA-01`. Fotos cuadradas de producto = `variant.images` (la primera es la portada de la tarjeta); fotos con modelo = `variant.gallery`. Los WebP (1080 px, calidad 88) están en `public/products/gafas/`. Se regeneran desde `Catálogo/` con `python scripts/generar-gafas.py` (requiere Pillow; convierte, aplica el fondo gris, asigna fotos y reescribe `lib/gafas-data.ts`).
- **Impact y X-treme** no tenían carpetas de color: se agruparon por parejas de fotos y los nombres de color son provisionales. En Vintage, `55.jpg` (Negras) y `57.jpg` (Blancas) estaban sueltas y se asignaron a su color.
- **Precios inventados** (39.900 a 59.900 COP según el modelo, tabla `gafasPesos`). `priceCents: 0` = "Precio por definir" y "Comprar" pasa a "Próximamente". Faltan stock, peso, medidas y textos reales (descripciones y eslóganes son genéricos).
- **Lista `/c/gafas`:** cada color de cada modelo es una tarjeta (70). Filtros: buscador por nombre/color, **Color** (familias; una gafa puede estar en varias: "Negras lente amarillo" = Negro + Amarillo; Beige = Habano), **Modelo** y **Tipo** (Deportivas = Impact y X-treme, Casuales = el resto; campo `tags`, columna `products.tags`). Cada tarjeta muestra la foto de producto y una foto con modelo (estable por SKU); al pasar el mouse salta de inmediato a la segunda foto y al salir vuelve a la primera.
- **Fondo de las fotos de producto:** gris de Impact (248,248,246), aplicado al generar los WebP; las fotos con modelo no se tocan.
- **Diseño editorial SOLO para Moda** (referencia `Diseños frontend/Para MOda`, estilo Acne Studios): fotos a ras, esquinas rectas, cuadrícula de 2/3/4 columnas sin separación y a todo el ancho, rótulos pequeños en mayúsculas. Las tarjetas siguen siendo de vidrio translúcido y el resto de la estética no cambia. Se activa con `isEditorial(product)` y la prop `editorial` de `ImageCarousel`.
- **Portada de Moda** (`components/moda-hero.tsx`, en `/c/moda` y `/c/gafas`): dos fotos a todo el ancho y sin separación, **completas** (proporción 4:5, la portada es más alta que la pantalla), **sin texto encima**; flecha ↓ al pie. Fotos: `public/moda/portada-1.webp` (Barcelona Animal print 67.jpg) y `portada-2.webp` (Vintage Negras 34.jpg). Las originales miden solo 1080 px de ancho: se ampliaron 2x (Lanczos + afilado) y se sirven sin recomprimir. **Si el dueño tiene versiones de mayor resolución, reemplazarlas.** Se define en `cover` de la categoría; Beanies traerá la suya.
- **Galería de la ficha (Moda)** (`components/editorial-gallery.tsx`): fotos grandes y completas (4:5, sin recortar), 2 a la vez con flechas ‹ ›; solo las del color elegido y sin repetir la foto de portada de la tarjeta; sin fotos extra no se muestra. El color elegido se comparte entre cabecera y galería con `variant-context.tsx`.

## 5c. Navegación

- **Menú superior:** Inicio · Categorías (se abre al pasar el mouse) · lupa · carrito. Todos tienen animación al pasar el mouse (`nav-fx` / `nav-link` en `globals.css`; se apaga con `prefers-reduced-motion`).
- **Carrito del menú** (`components/cart-link.tsx`): al pasar el mouse se despliega un resumen (foto, nombre, color, cantidad, precio, total); el clic abre `/carrito`.
- **Buscador** (`components/site-search.tsx`): compara raíces de palabras (plural/singular) contra nombre, marca, categoría, etiquetas, especificaciones y colores.
- **Botón de volver** (`components/back-button.tsx`, en `layout.tsx`): flotante arriba a la izquierda, solo en fichas de producto, Carrito y páginas informativas; **no** en Inicio ni en categorías.
- **Imágenes:** `next/image` con **loader propio** (`lib/image-loader.ts`) que sirve miniaturas `-480`/`-960` pregeneradas con `scripts/miniaturas.py` (ver 5d: el optimizador de Next tumbaba Render gratis). Las portadas de Moda van sin recomprimir. La velocidad real se ve con `pnpm --filter @nitro/storefront build` y `start`; en `dev` compila cada página al abrirla.

## 5d. Catálogo desde la base de datos (23 oct 2026, en progreso)

- **`lib/catalog.ts`** (servidor): `getProducts()`, `getSearchIndex()`, `getCartCatalog()`. Con `CATALOG_SOURCE=db` lee de Supabase (Prisma); sin esa variable usa el catálogo estático de `lib/products.ts` (hoy es el modo por defecto). En modo `db` un fallo **no** cae al estático: rompe el build o conserva la última página buena (ISR).
- **`lib/catalog-client.tsx`**: proveedor en `layout.tsx` que da al navegador un catálogo mínimo (una foto por color) y el índice del buscador. Carrito, mini carrito y buscador ya lo usan en vez de importar `products`.
- Los helpers de `lib/products.ts` aceptan una lista opcional (`productsIn(slug, list)`, `getProduct(slug, list)`, `featuredOf(list)`, `findVariant(sku, list)`, `buildSearchIndex(list)`). Las **categorías siguen estáticas** (traen `cover`, `byColor` y descripción que no están en la base).
- **Sembrar sin puertos de base de datos** (red de biblioteca o colegio que bloquea 5432/6543): `pnpm --filter @nitro/db seed:sql` genera 10 archivos `packages/db/prisma/seed-partes/parte-01.sql … parte-10.sql` (≤25 KB cada uno); se pegan **en orden** en el *SQL Editor* de Supabase. Un solo script de 180 KB falla con "connection termination". Es repetible. Ya se ejecutó y se verificó: 19 productos, 77 variantes, 249 fotos. Si cambia el catálogo estático, se regeneran y se vuelven a ejecutar (actualiza por slug/SKU, pero no borra productos retirados).
- **Falta verificar (requiere salir de la red que bloquea el puerto, p. ej. internet del celular):** arrancar con `CATALOG_SOURCE=db` y comparar la tienda con el modo estático (precios, fotos por color, orden de variantes, destacados). El mapeo de `loadFromDb` aún no se ha corrido con datos reales.
- **Hosting recomendado: Vercel** (plan Hobby gratis; es para uso no comercial, al cobrar hay que pasar a Pro). Render gratis duerme el servicio a los 15 min. Para Vercel: ejecutar `prisma generate` antes del build y definir `DATABASE_URL`, `DIRECT_URL` y `CATALOG_SOURCE=db`. Pagos futuros: Wompi o Mercado Pago (webhooks como rutas de Next).

### Despliegue en Render (EN VIVO desde el 23 oct 2026)

- **URL:** `https://nitrocol.nitro2tech.com` (dominio definitivo). También responde `https://nitro-col-store.onrender.com`.
- **Rama de producción: `main`** (se fusionó `feat/storefront-inicial`). Cada `git push origin main` redespliega solo.
- **El servicio se creó a mano (Web Service), no con el Blueprint**, por eso `render.yaml` **no se aplica**: los comandos y variables viven en el panel de Render (Settings). Si se recrea con New → Blueprint, toma `render.yaml`.
  - Language: **Node** (no Docker). Branch: `main`. Health Check Path: `/api/health`.
  - **Build Command:** `pnpm install --frozen-lockfile && pnpm --filter @nitro/db generate && pnpm --filter @nitro/storefront build`
  - **Start Command:** `pnpm --filter @nitro/storefront start`
  - Cada comando va en su propio campo, y hay que pulsar *Save Changes* antes de *Manual Deploy*.
  - **No usar `corepack enable`**: el sistema de archivos de Render es de solo lectura y falla (`EROFS`). pnpm ya viene instalado. El log dice `yarn@pnpm@12.14.0` al leer `packageManager`; es inofensivo si los comandos usan `pnpm`.
- **Variables de entorno (panel de Render → Environment):** `DATABASE_URL` (pooler 6543) y `DIRECT_URL` (5432), copiadas de `packages/db/.env`; `NODE_OPTIONS=--max-old-space-size=400`; `CATALOG_SOURCE` (`db` lee de Supabase, vacío usa el catálogo estático; **verificar cuál tiene el panel** y que el modo `db` se probó, ver "Falta verificar" arriba). `NODE_VERSION=22` recomendado (Render usa 24 por defecto y funciona).
- **Arreglos hechos al desplegar (no deshacer):**
  - `pnpm-workspace.yaml` tiene `allowBuilds` para `@prisma/client`, `@prisma/engines`, `prisma` y `esbuild`; sin eso `pnpm install` falla con `ERR_PNPM_IGNORED_BUILDS`.
  - `apps/storefront/package.json` tiene `prebuild` que corre `prisma generate`; sin eso Next no encuentra `.prisma/client`.
  - **Memoria (512 MB):** el plan gratis se caía con *"Ran out of memory"* por el optimizador de imágenes de Next (AVIF). Ahora **no se usa el optimizador**: `next.config.ts` tiene un loader propio (`lib/image-loader.ts`) que sirve miniaturas pregeneradas `*-480.webp` y `*-960.webp` junto a cada foto de `public/products/`. **Al agregar fotos nuevas hay que correr `python scripts/miniaturas.py`** (requiere Pillow, es repetible) y subir las miniaturas; si no, esa foto sale en tamaño original (más pesada).
  - `next.config.ts` añade `Cache-Control: public, max-age=31536000, immutable` a `/products`, `/moda` y `/brand`. **Al reemplazar una foto, ponle otro nombre**; si no, los visitantes verán la anterior.
- **Monitor (pendiente de confirmar que existe):** UptimeRobot o cron-job.org cada 5 min a `https://nitrocol.nitro2tech.com/api/health`. Esa ruta hace `select 1` en la base, así mantiene despiertos Render (duerme a los 15 min; la primera visita tras dormir tarda 30–50 s) y Supabase (se pausa a los 7 días). No usar GitHub Actions para el ping.
- **Rendimiento medido (23 oct):** `/c/gafas` ~0,5 s; 40 miniaturas nuevas en paralelo ≤0,5 s; HTML de categoría 138 KB comprimido. Aun así el dueño reporta que las fotos del catálogo y `Categorías → Moda` (~6 s) tardan en la primera carga. Sin diagnosticar: pedir la pestaña Network de Chrome (F12). Candidatas: portada de Moda (`moda/portada-1.webp` 445 KB y `portada-2.webp` 301 KB, sin optimizar y con `priority`; generar versión de ~1000 px), CPU del navegador (follaje animado y efecto vidrio), servicio dormido por falta de monitor.
- **Riesgos:** (1) Supabase gratis **no hace copias de seguridad**: resolver antes de recibir pedidos reales; (2) Render gratis permite uso comercial, Vercel Hobby no; (3) 512 MB es justo: si vuelve a aparecer *Out of memory*, pasar al plan Starter (~7 USD/mes, 2 GB).

## 6. Qué sigue (en este orden)

0. **Terminar el despliegue en Render:** confirmar el monitor de `/api/health`, diagnosticar la lentitud de Moda/fotos (sección 5d) y confirmar qué valor tiene `CATALOG_SOURCE` en el panel.
1. **Probar la lectura desde la base** (`CATALOG_SOURCE=db`, sección 5d) y dejarla activa en producción (ya no se piensa en Vercel salvo que se necesite uso comercial gratis). Después, retirar `lib/products.ts`/`gafas-data.ts` como fuente (quedan solo para el seed) y decidir dónde viven las categorías (`cover`, `byColor`).
2. **Cargar el Excel** `Datos de productos.xlsx` (precios reales, stock, peso, medidas, textos) a la base.
3. **Capa de API** (NestJS según las especificaciones, o consultas desde el servidor de Next para empezar) con precios y stock validados en el servidor. El navegador nunca escribe pedidos, pagos ni inventario.
4. **Carrito en el servidor** (hoy solo en `localStorage`): carrito de invitado con cookie firmada que se fusiona al iniciar sesión.
5. **Autenticación** con Supabase Auth (activa `/ingresar` y `/cuenta`).
6. **Checkout y pagos** (Wompi y/o Mercado Pago; el dueño debe elegir y crear cuenta de pruebas). Hoy "Ir a pagar" está **desactivado a propósito**.
7. **Panel de administración** (subir productos, editar precios, elegir destacados) y **RLS por vendedor** para el marketplace.
8. Envíos, facturación electrónica, emails transaccionales, cupones, "Avísame cuando llegue".
9. **Beanies** (nueva categoría de Moda con su propia portada `cover`).

## 7. Pendiente que no depende del código

- **Excel de productos** (`Instrucciones/Datos de productos.xlsx`): precio real, stock, peso, medidas, descripción, eslogan y marca real del reloj ("X8 Pro" figura como marca). Naranja = inventado por Claude, amarillo = falta, gris = código (no tocar).
- **Contacto para la página de ayuda:** WhatsApp y correo de atención.
- **Fotos de portada de Moda en mayor resolución** (las actuales miden 1080 px de ancho y se ven suaves en pantallas grandes).
- **Video del león (Hailuo AI, plan gratuito):** trae marca de agua "MINIMAX | Hailuo AI". **Confirmar que el plan gratuito permite uso comercial** antes de publicar.
- **Pasarela de pagos** (Wompi o Mercado Pago) y asesoría legal para términos y privacidad.
- **Cookies:** hoy no hace falta aviso (solo se usa `localStorage` funcional: carrito e intro). Cuando se agregue analítica o publicidad (Google Analytics, Meta Pixel) habrá que añadir banner de consentimiento. En Colombia aplica la Ley 1581 de 2012 (habeas data, SIC): al haber registro y checkout, política de privacidad real y consentimiento explícito para marketing.
- **Dominio:** `nitrocol.nitro2tech.com` ya apunta a Render.

Decisiones de negocio marcadas `[DEFINIR]` en `especificaciones-de-uso.md` (envíos, devoluciones, garantías, contra entrega, preventa, plazos de reserva de stock, etc.). Decididas: **NestJS propio** (no Medusa) y **marketplace con vendedores externos** (esquema listo).

## 8. Qué NO funciona aún (para no perder tiempo)

- **"Ir a pagar"** y **"Avísame cuando llegue"** no hacen nada todavía. El formulario de `/ingresar` está desactivado hasta tener Supabase Auth. `/ayuda`, `/terminos`, `/privacidad` tienen texto provisional (legal por revisar).
- La base tiene el catálogo, pero la tienda **no la lee por defecto** (hay que definir `CATALOG_SOURCE=db`; el mapeo no se ha probado con datos reales). En producción, comprobar qué tiene el panel de Render.
- Las gafas tienen precios inventados; la tienda se puede navegar y comprar (carrito local) con ellos.
- No se probó en celular real ni con lectores de pantalla; sí en Chrome de escritorio. El efecto vidrio (`backdrop-filter`) puede rendir más lento en celulares viejos. El hover (mini carrito, cambio de foto, menú) no existe en pantallas táctiles: allí el clic abre la página.
- El carrito de prueba de un navegador se guarda en `localStorage` (clave `nitro-cart`).
