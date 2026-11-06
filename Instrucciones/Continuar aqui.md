# Continuar aquí — Nitro Col Store

**Última actualización:** 6 de noviembre de 2026 (tienda en vivo en Render en `https://nitrocol.nitro2tech.com`, rama `main`; catálogo desde la base, inicio de sesión con Google activo, fichas estilo Apple de smartwatch y audífonos, **panel de administración v2** en `/admin` con resumen de ganancias, edición de productos, costos y devoluciones)
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

## 5e. Fichas y listas por color (23 oct 2026)

- **Moda y Tecnología** se listan **por color** (`byColor: true` en `lib/products.ts`; cada color es una tarjeta, con buscador y filtros). Tecnología no tiene portada de fotos (solo título); Moda sí (`cover`). `isEditorial(p)` ahora significa "categoría por color + ficha corta" y es verdadero para todos los productos actuales.
- **Tarjeta** (`product-tile.tsx`): foto con **esquinas redondeadas** en todo (se quitó el diseño de esquinas rectas), rótulos pequeños en mayúsculas; gafas con foto "cover", tecnología con foto completa.
- **Ficha de producto** (`app/p/[slug]/page.tsx`), igual para todos: cabecera → **reseñas** → **cuadrícula 2×2** (`product-story.tsx`, foto/texto/texto/foto a ras, paneles gris claro y negro) → video (solo si existe) → **recomendados** (`recommended.tsx`, Moda y Tecnología). Ya **no se muestran** especificaciones, "Lo principal", galería, "En la caja" ni preguntas frecuentes (los datos siguen en el código y `lib/faq.ts` alimenta `/ayuda`); se quitó el FAQ del JSON-LD.
- **Cabecera** (`product-hero.tsx` + `product-photos.tsx`): foto principal con **miniaturas verticales a la izquierda** (en celular, en fila debajo); gafas 4 fotos (2 de producto + 2 con modelo), tecnología hasta 6. Colores como **miniaturas de foto** ("Color: X"). Gafas: título = modelo ("Barcelona"), lista fija de 5 características (`GAFAS_BULLETS`) y bloque **"Lleva más y ahorra dinero"** (`gafas-upsell.tsx`, 3 gafas recomendadas).
- **Descuento por cantidad (solo gafas, de cualquier modelo/color):** 2 → 10 %, 3 → 15 %, 4 o más → 20 % (`lib/gafas-promo.ts`, **porcentajes provisionales**). Se calcula en el navegador (carrito y mini carrito); **hay que validarlo también en el servidor** al hacer el checkout.
- **Reseñas** (`lib/reviews.ts`): si el producto no tiene, se muestra **una de ejemplo inventada** con 5 estrellas (textos distintos para gafas y tecnología). Son provisionales y **deben quitarse cuando haya reseñas reales**: mostrar opiniones falsas como reales puede ser publicidad engañosa (Estatuto del Consumidor, SIC).
- **Textos provisionales:** los de la cuadrícula de gafas ("Sofisticación & estilo", "UV400") están en `product-story.tsx`; los de tecnología salen de `highlights`/`specs`. Confirmar con el proveedor que las gafas realmente tienen protección UV400 antes de afirmarlo.
- Cada color usa **solo sus fotos** (G-tide lila y rosado tienen 1; la cuadrícula la repite). Si hay más fotos, agregarlas y correr `python scripts/miniaturas.py`.
- Sin probar en celular real (el tamaño de ventana no se pudo reducir en la prueba automática).

## 5g. Fichas de Tecnología estilo Apple (6 nov 2026)

- **Smartwatch y audífonos** tienen ficha propia (`components/showcase.tsx` + `showcase-info.tsx`), elegida en `app/p/[slug]/page.tsx` con el mapa `SHOWCASE` (categoría → tono). Tono **oscuro** para smartwatch (referencia `Diseños frontend/Para los smartwathc`) y **claro** para audífonos (`Para los audifonos`). Colores de cada tono: variables `--sc-*` en `globals.css` (`.showcase-dark` / `.showcase-light`).
- Secciones: barra del producto fija bajo el menú (con Comprar) → portada (titular grande, foto, colores, compra) → "Lo principal." (foto 16:10 con texto + cifras; verde #00d959 solo en el reloj) → "Míralo de cerca." (una píldora por especificación; cambia la foto) → video → reseñas → tarjeta blanca (envío, garantía, WhatsApp) → recomendados. Sin follaje en estas fichas. Botones de la tienda (no el azul de Apple), por la regla de blanco y negro.
- **Fotos:** solo las principales del color (`variant.images`); las de catálogo (`gallery`) traen textos del fabricante con errores y un Aurafit negro que no vendemos, así que solo se usan si el color no tiene principales.
- **Textos de las píldoras** (`DETAILS` en `showcase.tsx`): provisionales, redactados a partir de la caja del producto.
- **Imágenes nuevas por sección:** prompts para generarlas en `Instrucciones/productos/` (uno por producto + README). El dueño las guarda en `imagenes/productos/<producto>/` con los nombres indicados; falta conectarlas (portada por color, `principal`, `cerca-<especificación>`): hoy cada sección toma fotos de `variant.images` por posición.
- Sin probar en celular.

## 5h. Panel de administración `/admin` (6 nov 2026, versión básica)

- **Acceso** (`lib/admin.ts`): sesión con correo confirmado y correo en `ADMIN_EMAILS` (variable de entorno, separada por comas; hoy `nitro.2technology@gmail.com`) o perfil con rol `admin`/`super_admin`. Sin sesión → `/ingresar?next=/admin`; con sesión sin permiso → 404. Cada página y cada acción llama a `requireAdmin()`. El rol del perfil no lo puede cambiar el usuario (RLS solo permite actualizar nombre, teléfono y documento). "Mi cuenta" muestra el botón "Panel de administración" a los administradores.
- **Resumen** (`/admin`): pedidos por enviar, ventas y pedidos pagados del mes, variantes con 3 o menos unidades.
- **Pedidos** (`/admin/pedidos`, filtros por estado y búsqueda por NC-n o correo; detalle en `/admin/pedidos/[n]`): productos, totales, dirección, contacto (con enlace a WhatsApp), pago e historial. Acciones (`app/admin/actions.ts`): pagado → preparando → **enviado** (transportadora + guía + enlace opcional; crea `Shipment` y envía correo al cliente con `sendShippedEmail`) → entregado; cancelar solo si el pago sigue pendiente. Cada cambio usa `updateMany` con el estado esperado (no pisa cambios simultáneos), deja `OrderStatusHistory` con autor y `AuditLog`.
- **Productos** (`/admin/productos`): precio, precio anterior (tachado) y stock por color, y orden de destacado en portada. Ajustes de stock quedan en `StockMovement`; todo en `AuditLog`. Tras guardar, `revalidatePath("/", "layout")` regenera la tienda. **Solo se ve en la tienda con `CATALOG_SOURCE=db`** (la página lo advierte si no está).
- **Probado:** build de producción, redirección sin sesión y las consultas del panel contra la base real. **Sin probar con sesión de administrador** (lo prueba el dueño): ver el panel, guardar un precio y el flujo de envío con correo.
- **Falta en Render:** `ADMIN_EMAILS=nitro.2technology@gmail.com`.
- **Pendiente para versiones siguientes:** crear productos nuevos y subir fotos (Supabase Storage), cupones, roles por vendedor (marketplace), exportar pedidos. El dueño iba a subir un archivo con sus instrucciones para el panel.

### 5i. Panel v2 (6 nov 2026, según `Instrucciones/Diseños frontend/Panel admin/Sin título.png`)

- **Diseño:** menú lateral con iconos (`app/admin/sidebar.tsx`, contadores de por enviar y devoluciones abiertas), barra superior, tarjetas blancas con borde fino y acento violeta `#5b4fe0`. El panel cubre el encabezado y pie de la tienda (capa fija en `app/admin/layout.tsx`). Piezas comunes en `app/admin/ui.tsx`.
- **Resumen** (`/admin`, cálculo en `app/admin/stats.ts`): periodo este mes / 30 días / año / todo. Vendido (con envío), ganancia = (subtotal − descuento) − costo de lo vendido − reembolsos + costo de lo devuelto al stock (no resta comisión de Wompi ni envío), costo de lo vendido, pedidos y unidades, envíos cobrados, reembolsado; barras de ventas por día/mes con cifra al pasar el mouse y vista de tabla; inventario de hoy (invertido, valor a precio de venta, ganancia si se vende todo); por enviar (los más antiguos primero); más vendidos; poco stock (según el aviso de cada color).
- **Productos:** `/admin/productos` en cuadrícula con foto, filtros (en la tienda, ocultos, poco stock, sin costo). `/admin/productos/[slug]`: por color → nombre, precio normal, precio de oferta (si hay, se cobra la oferta y el normal sale tachado: `priceCents` = cobrado, `compareAtCents` = normal), costo, stock, aviso de poco stock; ganancia por unidad, margen, invertido y ganancia si vende todo, calculados mientras se escribe (`variant-form.tsx`). Información: título, frase, descripción, disponibilidad (visible/oculto), destacado, especificaciones («Nombre: valor»), lo principal («Título | texto»), en la caja, etiquetas, video. El slug no cambia. Fotos: aún desde el código.
- **Costos:** `inventory_items.unit_cost_cents` (no en `product_variants`, que es de lectura pública por la API de Supabase). El checkout congela el costo en `order_items.unit_cost_cents`; el comprador lee sus `order_items` por la API, así que su permiso pasa a ser por columnas sin el costo. Pedidos anteriores a esto no tienen costo (el resumen lo avisa).
- **Devoluciones** (`OrderReturn`, `/admin/devoluciones`): se registran desde el pedido enviado/entregado (tipo retracto/garantía/otro, motivo, unidades) → pedido «Devolución solicitada». Recibir (opción de devolver al stock, con `StockMovement`) → «Devuelto». Cerrar con valor reembolsado → «Reembolsado» (el dinero se devuelve a mano en Wompi/transferencia); con 0 (cambio o reparación) → vuelve a «Entregado». Rechazar (con motivo) → «Entregado». Todo con historial y auditoría.
- **Migración `20261106010000_costos_devoluciones`:** **ya aplicada a la base real** (6 nov 2026, por el dueño).
- **Estado (6 nov 2026):** commit `79513ff`; el dueño hace el push. Probado en local con sesión de administrador y datos reales: resumen (este mes / 30 días), cuadrícula de productos, ficha de edición con cálculo de ganancia en vivo (sin guardar), pedidos, detalle con formulario de devolución, devoluciones (vacía). Consultas del resumen verificadas contra la base: ventas, cubetas por día/mes, más vendidos, inventario (762 unidades, 77 colores con stock **sin costo**).
- **Sin probar todavía:** guardar un producto o un color (y verlo en la tienda), y el flujo completo de una devolución (registrar → recibir → cerrar). Hacerlo con un pedido de prueba, no con uno real.
- **Falta en Render:** `ADMIN_EMAILS=nitro.2technology@gmail.com` y confirmar `CATALOG_SOURCE=db`.

### 5j. Fotos desde el panel (6 nov 2026, código listo, sin probar la subida)

- En `/admin/productos/[slug]` hay una sección **Fotos** por color (principales = carrusel de tarjeta/cabecera, la primera es la portada; galería) y generales. Se pueden **subir** (hasta 3 por vez, 8 MB c/u; JPG/PNG/WebP), **reordenar** (← →) y **eliminar** (✕). Acciones `uploadPhotos`, `movePhoto`, `deletePhotoAction` en `app/admin/actions.ts`; interfaz en `app/admin/productos/[slug]/photos.tsx`.
- `lib/storage.ts`: convierte con **sharp** a WebP en 3 tamaños (1600, `-960`, `-480`) y los sube al bucket público **`productos`** de Supabase Storage (se crea solo la primera vez). `lib/image-loader.ts` y `thumb()` entienden esas direcciones y sirven la miniatura adecuada. Cada foto lleva nombre único (caché de un año).
- **Necesita la variable `SUPABASE_SERVICE_ROLE_KEY`** (llave `service_role`/secret de Supabase → Project Settings → API Keys). Es SECRETA: solo en Render y `apps/storefront/.env.local`, nunca con `NEXT_PUBLIC_`. Sin ella el panel avisa y deja solo ordenar/eliminar. Next permite 26 MB por envío (`serverActions.bodySizeLimit`).
- Las fotos antiguas (`/products/...` del código) también se pueden ordenar/eliminar (solo se borra la fila; el archivo queda en el repo). Requiere `CATALOG_SOURCE=db` para verse en la tienda.
- **Sin probar:** la subida real (falta la llave). Probar con un producto de prueba y revisar memoria en Render (sharp con fotos grandes).

### 5k. Productos y colores nuevos desde el panel (6 nov 2026, código listo, sin probar con sesión)

- **`/admin/productos/nuevo`** (botón «+ Producto nuevo»): nombre, categoría (solo categorías hoja de la base), marca opcional (se crea si no existe), frase, descripción y el **primer color** (nombre, precio, oferta, costo, stock, aviso, peso). Se crea **oculto** (`draft`) con el vendedor de la casa, tema claro y slug derivado del nombre (sin tildes, único); luego redirige a la ficha para subir fotos y publicarlo. Acción `createProduct`.
- **Colores:** en la ficha, «Agregar un color o versión» (`addVariant`; SKU automático `PREFIJO-NN` único, posición al final, inventario y movimiento de «Stock inicial») y «Quitar un color» (`removeVariant`; borrado lógico con `deletedAt`, no deja quitar el último). Campos compartidos en `app/admin/productos/color-fields.tsx`. Dimensiones fijas 100 mm (el envío es fijo; no se piden).
- Las **categorías** no se crean desde el panel (siguen estáticas en `lib/products.ts` para portada/diseño): una categoría nueva requiere código. Un producto en una categoría de la base que no exista en `lib/products.ts` puede no mostrarse bien en la tienda.
- **Sin probar:** crear un producto real, agregar y quitar un color. Hacerlo y luego ocultar el de prueba.

### 5m. Todo en la ficha del producto + color del círculo (6 nov 2026)

- **Fotos dentro de cada color:** en `/admin/productos/[slug]`, cada tarjeta de color tiene arriba sus datos (nombre, círculo, precio, oferta, costo, stock) y debajo **sus fotos** (principales y galería: subir, ← →, ✕). Las fotos generales (sin color) van en su propia sección al final. Subir/ordenar/borrar una foto recarga la página: guarda antes lo escrito del color.
- **Color del círculo:** cada color (existente o nuevo) tiene un selector de color (`swatch-input.tsx`, guarda hex `#rrggbb` en `product_variants.swatch`; «Quitar» = sin círculo). Se ve en la tienda donde ya se usaba `swatch`: botón de color de la cabecera (fichas normales) y círculos de la ficha Apple (smartwatch/audífonos). La ficha de Moda (gafas, beanies) elige color con miniaturas de foto y no muestra el círculo.

### 5n. Paleta de colores y precio con oferta en todas partes (6 nov 2026)

- **Paleta** (`app/admin/palette.ts`, sin tabla nueva): «Más usados en la tienda» sale de los círculos ya guardados en `product_variants.swatch` (agrupados por color, con el nombre más usado, hasta 14) y «Básicos» son 16 colores predeterminados. Al elegir uno se rellena el círculo y, si está vacío, el nombre. El selector grande crea un color nuevo, que al guardarse pasa solo a «Más usados».
- **Oferta visible en todos los productos:** componente único `components/price-tag.tsx` (precio + precio original tachado + «-X%»), usado en cabecera y barra móvil de la ficha, tarjetas de lista/recomendados, fichas Apple y carrito. Solo aparece lo tachado si el color tiene **precio de oferta** (`compareAtCents` > `priceCents`, se pone en el panel). No se inventa un «precio original» donde no hay oferta (sería publicidad engañosa). El mini carrito sigue mostrando solo el total.

### 5l. Categorías desde el panel (6 nov 2026, código listo, sin probar con sesión)

- **`/admin/categorias`:** crear una **subcategoría dentro de Moda o Tecnología** (ej. Beanies en Moda) y borrar las creadas en el panel (solo sin productos; las del código —Gafas, Audífonos, Smartwatch— no se borran). Acciones `createCategory` / `deleteCategory`. Sin migración: usa la tabla `categories` (nombre, slug, `parent_id`, `path`).
- **Diseño:** la subcategoría **hereda el del padre** (no se elige): en Moda, la misma portada, lista por color, tarjetas con foto «cover» (ahora para todo Moda, antes solo gafas) y ficha corta. Lo específico de gafas (5 características, «Lleva más y ahorra», descuento por cantidad, textos UV400) sigue **solo** para `category === "gafas"`. Tecnología nueva usa la ficha corta normal (las fichas Apple son solo de smartwatch y audífonos, mapa `SHOWCASE`).
- **Cómo se cablea:** `lib/products.ts` tiene `registerCategories()`, que suma al árbol estático (`categories`) las subcategorías de la base, **en el sitio** (así menú, footer, portada, `findCategory`, `productsIn` e `isEditorial` las ven sin cambiar). El servidor la llama desde `getExtraCategories()` (`lib/catalog.ts`, que también corre dentro de `getProducts()`) y el navegador desde `CatalogProvider` con las que le pasa el layout. Solo con `CATALOG_SOURCE=db`.
- **Límite:** una categoría de **primer nivel** nueva (otra «Moda») necesita su portada y diseño en código; no se crea desde el panel. Beanies usa la portada de Moda; si se quiere una propia, hay que agregarla en código.
- Tras crearla: «Producto nuevo» ya la ofrece. La página `/c/<slug>` se genera al primer visitante (no estaba en `generateStaticParams`).

## 5f. Pagos con Wompi (23 oct 2026, en pruebas)

- **Flujo:** carrito → `/checkout` (datos de envío) → `POST /api/checkout` (el servidor recalcula precios, descuento, envío y stock desde la base, crea `Order` + `OrderItem` + `Payment` y devuelve la URL de Wompi con la firma de integridad) → pago en Wompi → webhook `POST /api/webhooks/wompi` (verifica la firma del evento, marca el pedido `paid` una sola vez y descuenta el inventario) → `/pedido/NC-<número>` (resultado; también consulta la transacción a Wompi y aplica el mismo resultado, de respaldo). Código en `lib/wompi.ts`, `lib/pricing.ts`, `app/api/checkout`, `app/api/webhooks/wompi`, `app/checkout`, `app/pedido/[ref]`, `components/checkout-form.tsx`.
- **Referencia del pedido:** `NC-<Order.number>`. **El pago solo se confirma por el webhook (o por la consulta directa a Wompi), nunca por lo que diga el navegador.** El monto de Wompi debe coincidir con el del pedido.
- **Variables de entorno** (Render → Environment; en local `apps/storefront/.env.local`, ignorado por git): `WOMPI_ENV` (`sandbox` o `production`), `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET`, y `SITE_URL=https://nitrocol.nitro2tech.com`. En el panel de Wompi hay que configurar la **URL de eventos** `https://nitrocol.nitro2tech.com/api/webhooks/wompi` (una para el modo pruebas y otra para producción). Las llaves de producción **nunca** van en el repo ni en el chat; **no dejarlas en `packages/db/.env`** (Prisma lo carga siempre).
- **Envío:** gratis desde $150.000 COP (después del descuento por cantidad); por debajo, **$12.000 fijo PROVISIONAL** (`lib/pricing.ts`). Pendiente: tarifas reales por peso/destino.
- **Inventario:** no se reserva al crear el pedido; se descuenta al aprobarse el pago. Si dos clientes pagan lo último que queda, un log de error avisa para revisarlo a mano. Pendiente: reservas con vencimiento (la columna `reserved` existe) y una tarea que cancele pedidos pendientes viejos.
- **Wompi bloquea (403) un `redirect-url` hacia `localhost`:** en local no se envía; Wompi muestra su página final y el pedido se consulta en `/pedido/NC-<n>`.
- **Probado (sandbox):** pedido real en la base, totales correctos, webhook con firma falsa (401) y válida (200), repetición sin doble descuento, Wompi abre en "MODO DE PRUEBAS" con el monto correcto. **Sin probar:** un pago aprobado completo en Wompi. Tarjetas de prueba de Wompi: `4242 4242 4242 4242` aprobada, `4111 1111 1111 1111` rechazada.
- **Limpieza de pruebas:** los pedidos de prueba quedan en la base real; borrar los de `prueba@example.com` y las pruebas propias, y devolver el inventario que descontaron.
- **Correos de pedido (Resend):** `lib/mail.ts`, llamado desde `applyTransaction` una sola vez, cuando el pedido pasa a pagado. Envía aviso al dueño (`ORDER_NOTIFY_EMAIL`, con `reply_to` al cliente) y confirmación al cliente. Un fallo se registra con prefijo `[mail]` y no afecta el pago. Variables en Render: `RESEND_API_KEY`, `MAIL_FROM` (`Nitro Col Store <pedidos@nitro2tech.com>`, dominio verificado en Resend), `ORDER_NOTIFY_EMAIL`. Sin llave no envía nada. Resend solo envía: para recibir respuestas en `pedidos@` hace falta reenvío (Namecheap Email Forwarding).
- **Envío:** $15.000 fijo, gratis desde $150.000 (`lib/pricing.ts`). El dueño confirmó el valor.
- **Reseñas reales (24 oct 2026):** se quitaron las inventadas. Ahora `POST /api/reviews` solo acepta reseña de quien compró: número de pedido (NC-…) + correo del pedido, pedido pagado que incluya el producto, una por producto y pedido; el nombre público sale del pedido ("Camila R."). Se publican de inmediato (`Review.published=false` las oculta). Sin reseñas la ficha dice "Aún no hay reseñas". Migración `20261024000000_resenas_verificadas` (agrega `order_id`, `author_name`, `published`; `profile_id` opcional) **ya aplicada a la base real**. Probado: guardar, bloquear duplicado y borrar la prueba. Sin probar en pantalla: que la reseña aparezca en la ficha con `CATALOG_SOURCE=db` (en local no está activo).
- **Textos legales (24 oct 2026):** términos, privacidad y ayuda reescritos para Colombia (Ley 1480 retracto/garantía, Ley 1581 datos personales). Datos del negocio en `lib/business.ts`: NITRO 2TECH S.A.S, NIT 902096772-1, WhatsApp +57 314 203 0967, entrega 2 a 5 días hábiles. **Dirección: el dueño decidió no publicarla** (vacía; los textos la omiten). Pendiente: revisión de un abogado y recibir correo en `pedidos@nitro2tech.com` (reenvío en Namecheap).
- **Inicio de sesión (25 oct 2026, código listo, sin activar):** Supabase Auth con `@supabase/ssr`. Correo + contraseña (con confirmación y recuperación), Google, botón de Apple oculto (`NEXT_PUBLIC_AUTH_APPLE=1`). Archivos: `lib/supabase/{client,server}.ts`, `middleware.ts` (solo /cuenta, /ingresar, /checkout, /api/checkout), `lib/profile.ts` (crea `Profile` con el id de Supabase y liga pedidos anteriores del mismo correo solo si está confirmado), `app/auth/{callback,salir}`, `app/ingresar`, `app/cuenta` (+ `/clave`), `components/{auth-form,new-password-form,account-link}.tsx`. El checkout liga el pedido a la cuenta si hay sesión y trae correo y nombre. La cabecera resuelve la sesión en el navegador para que las páginas sigan estáticas. **Sin las variables, `/ingresar` dice "estará disponible pronto".** Probado en local sin variables; **el ingreso real no se ha probado**.
  - **Falta para activarlo (lo hace el dueño):** (1) pasar `NEXT_PUBLIC_SUPABASE_URL` (`https://gcwbenjdvbvzywetitzz.supabase.co`) y la llave anon (pública) → ponerlas en `.env.local` y en Render (hay que redesplegar: se incorporan en el build); (2) Supabase → Authentication → URL Configuration: Site URL `https://nitrocol.nitro2tech.com`, Redirect URLs `.../auth/callback` y `http://localhost:3000/auth/callback`; (3) SMTP propio en Supabase con Resend (`smtp.resend.com`, 465, usuario `resend`, contraseña = API Key de Resend, remitente `pedidos@nitro2tech.com`), si no el límite es de pocos correos por hora; (4) Google Cloud: pantalla de consentimiento (External, dominio `nitro2tech.com`, publicada) y cliente OAuth Web con redirect `https://gcwbenjdvbvzywetitzz.supabase.co/auth/v1/callback`; Client ID y Secret en Supabase → Providers → Google; (5) Apple: cuenta Apple Developer (99 USD/año), luego proveedor Apple en Supabase y `NEXT_PUBLIC_AUTH_APPLE=1`.
  - **Activado (5 nov 2026):** variables en `.env.local` y Render (llave `sb_publishable_…`), Site URL y Redirect URLs, SMTP con Resend y Google configurados por el dueño. En producción funciona. **Arreglo:** detrás del proxy de Render `req.url` llega como `localhost:10000`; las rutas `/auth/callback` y `/auth/salir` arman la URL con `requestOrigin()` (`lib/site.ts`, usa `x-forwarded-host`). No volver a usar `req.url` para redirecciones absolutas.
  - **Probado en producción por el dueño (6 nov 2026):** ingreso con Google y cierre de sesión funcionan.
  - **Google con botón propio (5 nov 2026):** `components/google-button.tsx` usa Google Identity Services (ventana emergente en nuestro dominio) y `signInWithIdToken` con nonce, para que Google no muestre "Ir a gcwbenjdvbvzywetitzz.supabase.co". El Client ID (público) está en el código, se puede cambiar con `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Si el script de Google no carga, vuelve al ingreso por redirección de Supabase. Requiere que `https://nitrocol.nitro2tech.com` y `http://localhost:3000` estén en "Authorized JavaScript origins" del cliente de Google. Para que Google muestre "Nitro Col Store" con logo hay que pedir la verificación de marca (Google Auth Platform → Branding).
  - **Para retomar:** con URL + llave anon, probar en local registro, confirmación, ingreso, Google, recuperación, pedido ligado a la cuenta; luego subir, y probar reseña en producción (la tabla de reseñas está vacía; borrar la de prueba después).
- **Pendientes a retomar (acordado 24 oct 2026):** (1) **inicio de sesión y cuentas**: código hecho y commiteado (ver arriba), falta configurarlo y probarlo; (2) panel de administrador: el dueño subirá un archivo con las instrucciones; (3) en espera: estado de envío con guía y aviso al cliente, respaldos de Supabase, reservas de stock, cancelar pedidos pendientes viejos, prueba en celular real, facturación electrónica, limpieza de pedidos de prueba (NC-4 en adelante), precios reales de gafas, llaves de Wompi de producción.
- **Pendiente (anterior):** pago provisional por WhatsApp (faltan el número y los datos de la cuenta), vista simple de pedidos, facturación electrónica, pasar a llaves de producción, y que el descuento por cantidad ya se valida en el servidor (hecho en `priceCart`).

## 5d. Catálogo desde la base de datos (23 oct 2026, en progreso)

- **`lib/catalog.ts`** (servidor): `getProducts()`, `getSearchIndex()`, `getCartCatalog()`. Con `CATALOG_SOURCE=db` lee de Supabase (Prisma); sin esa variable usa el catálogo estático de `lib/products.ts` (hoy es el modo por defecto). En modo `db` un fallo **no** cae al estático: rompe el build o conserva la última página buena (ISR).
- **`lib/catalog-client.tsx`**: proveedor en `layout.tsx` que da al navegador un catálogo mínimo (una foto por color) y el índice del buscador. Carrito, mini carrito y buscador ya lo usan en vez de importar `products`.
- Los helpers de `lib/products.ts` aceptan una lista opcional (`productsIn(slug, list)`, `getProduct(slug, list)`, `featuredOf(list)`, `findVariant(sku, list)`, `buildSearchIndex(list)`). Las **categorías siguen estáticas** (traen `cover`, `byColor` y descripción que no están en la base).
- **Sembrar sin puertos de base de datos** (red de biblioteca o colegio que bloquea 5432/6543): `pnpm --filter @nitro/db seed:sql` genera 10 archivos `packages/db/prisma/seed-partes/parte-01.sql … parte-10.sql` (≤25 KB cada uno); se pegan **en orden** en el *SQL Editor* de Supabase. Un solo script de 180 KB falla con "connection termination". Es repetible. Ya se ejecutó y se verificó: 19 productos, 77 variantes, 249 fotos. Si cambia el catálogo estático, se regeneran y se vuelven a ejecutar (actualiza por slug/SKU, pero no borra productos retirados).
- **Verificado (6 nov 2026):** comparación campo por campo de los 19 productos / 77 colores entre la base y `lib/products.ts`: iguales salvo el stock (la base es la verdad: descontado por pedidos de prueba) y `gallery` vacía vs ausente (se ve igual). Dev y `build` con `CATALOG_SOURCE=db` y 400 MB funcionan; las páginas se regeneran cada 5 min.
- **Migración `20261106000000_orden_variantes_specs` (aplicada):** `product_variants.position` (orden de los colores; `loadFromDb` ordena por él) y `products.specs` pasa a `json` (JSONB reordenaba las claves). `prisma/orden-catalogo.ts` copia ese orden desde el catálogo estático sin tocar stock/precios/fotos.
- **Los seeds ya no pisan el stock existente** (solo lo siembran al crear la variante). Antes, re-sembrar dejaba todo en 10.
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

## 6. Qué sigue (actualizado 6 nov 2026, en este orden)

1. **Verificar el despliegue del panel v2** tras el push: en Render poner `ADMIN_EMAILS` y confirmar `CATALOG_SOURCE=db`; entrar a `https://nitrocol.nitro2tech.com/admin`, guardar un precio de prueba y ver que cambia en la tienda.
2. **Que el dueño registre el costo** de cada producto en el panel (filtro «Sin costo»). Sin eso no hay ganancia en el resumen.
3. **Probar devoluciones** con un pedido de prueba: registrar, recibir con reingreso al stock, cerrar con reembolso y con 0.
4. **Fotos desde el panel:** código listo (5j); falta poner `SUPABASE_SERVICE_ROLE_KEY` en Render y probar la subida. Después, conectar las imágenes nuevas de `imagenes/productos/<slug>/` (prompts en `Instrucciones/productos/`).
5. **Probar** crear producto / agregar y quitar color (5k) y la subida de fotos (5j).
6. **Precios reales de gafas** (Excel `Datos de productos.xlsx`) y limpieza de pedidos de prueba (NC-4 en adelante, devolviendo el inventario).
7. **Operación:** respaldos de Supabase, monitor de `/api/health`, reservas de stock con vencimiento y cancelar pedidos pendientes viejos, llaves de Wompi de producción, prueba en celular real.
8. Más adelante: cupones, exportar pedidos, facturación electrónica, roles por vendedor (marketplace), Beanies.

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

- **"Avísame cuando llegue"** no hace nada todavía. "Ir a pagar" lleva a `/checkout` (Wompi, hoy en modo pruebas). El formulario de `/ingresar` está desactivado hasta tener Supabase Auth. `/ayuda`, `/terminos`, `/privacidad` tienen texto provisional (legal por revisar).
- La base tiene el catálogo, pero la tienda **no la lee por defecto** (hay que definir `CATALOG_SOURCE=db`; el mapeo no se ha probado con datos reales). En producción, comprobar qué tiene el panel de Render.
- Las gafas tienen precios inventados; la tienda se puede navegar y comprar (carrito local) con ellos.
- No se probó en celular real ni con lectores de pantalla; sí en Chrome de escritorio. El efecto vidrio (`backdrop-filter`) puede rendir más lento en celulares viejos. El hover (mini carrito, cambio de foto, menú) no existe en pantallas táctiles: allí el clic abre la página.
- El carrito de prueba de un navegador se guarda en `localStorage` (clave `nitro-cart`).
