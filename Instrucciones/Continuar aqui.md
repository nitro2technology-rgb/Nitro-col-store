# Continuar aquí — Nitro Col Store

**Última actualización:** 22 de octubre de 2026 (vendedores externos en el esquema, páginas informativas, G-tide en 4 colores)
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

- Si el servidor de desarrollo muestra algo raro justo después de editar archivos, recarga la página (F5). Una vez dio un error transitorio "Unexpected end of JSON input" que se resolvió solo.
- pnpm bloquea los scripts de instalación de Prisma. Si una migración falla por eso: `pnpm approve-builds`.

## 2. Estado actual

Hecho (catálogo real de 3 productos en `lib/products.ts`, sin base de datos conectada):

| Área | Estado |
|---|---|
| Monorepo (pnpm + Turborepo) | Listo: `apps/storefront`, `packages/{ui,shared,db,config}` |
| Tienda (Next.js 15, Tailwind v4) | Portada, categorías, landing de producto, carrito |
| Gafas (Moda) | 16 modelos / 70 colores con fotos (`lib/gafas-data.ts`, generado desde `Catálogo/Clothing/Gafas`), con **precios inventados** (provisionales) |
| Catálogo real | Aurafit FW5 (azul/beige), G-tide L42 (negro/blanco/lila/rosado), Smartwatch X8 Pro, con fotos y video |
| Esquema de base de datos (Prisma) | Escrito y validado, **sin migrar** |
| Diseño visual | Blanco y negro con efecto vidrio (ver sección 4) |
| Carrito | Funciona en el navegador (Zustand + localStorage) |

**No existe todavía:** API NestJS (`apps/api`), panel de administración, autenticación, checkout, pagos, envíos, facturación electrónica, emails, búsqueda, cupones en el carrito, reseñas. Nada de esto está empezado.

## 3. Estructura

```
apps/storefront/
  app/                 páginas: / · /c/[slug] · /p/[slug] · /carrito
  components/          header, menú de categorías, hero de producto, tarjeta (product-tile), carrusel (image-carousel), carrito, follaje (foliage), intro del león (intro), portada (home-hero), ilustraciones (art/)
  lib/products.ts      CATÁLOGO + árbol de categorías + helpers (variantImages)
  lib/cart.ts          store del carrito (Zustand)
  lib/faq.ts           preguntas frecuentes comunes
  public/brand/        logo en PNG transparente (logo-mark.png, logo-full.png)
  public/products/<slug>/  fotos y video de cada producto
  public/brand/        también: portada-tarjeta.webp (banner transparente), intro-leon.mp4/.webp (intro)
packages/ui/           tokens de tema (theme.css), Button, Badge
packages/shared/       tipos y esquemas zod del producto, formatCOP
packages/db/           schema.prisma y cliente Prisma
Instrucciones/         especificaciones, diseños de referencia, logo original
```

### Rutas
- `/` portada · `/c/tecnologia` (categoría padre) · `/c/audifonos`, `/c/smartwatch` (hojas) · `/p/[slug]` producto · `/carrito`.

### Categorías
Árbol de dos niveles en `lib/products.ts`: **Tecnología** (Audífonos, Smartwatch). Se quitó **Hogar** al no tener productos; si vuelve, agregarla al árbol y a `sampleSlugs` de `app/page.tsx`. Cada producto guarda el slug de su categoría **hoja**.

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

### Gafas (categoría Moda → Gafas)
- Cada carpeta de modelo es un producto (`gafas-<modelo>`) y cada subcarpeta de color es una variante. Fotos cuadradas (de producto) = carrusel de la tarjeta; fotos verticales con modelo = galería. Los WebP están en `public/products/gafas/`.
- **Impact y X-treme** no tenían carpetas de color: se agruparon por parejas de fotos y los nombres de color son provisionales. En Vintage, `55.jpg` y `57.jpg` estaban sueltas y fueron a la galería.
- **Precios inventados** (39.900 a 59.900 COP según el modelo, tabla `gafasPesos` en `lib/products.ts`). `priceCents: 0` = "Precio por definir" y "Comprar" pasa a "Próximamente". Códigos: modelo `GAF-MIA`, color `GAF-MIA-01`.
- **Excel `Instrucciones/Datos de productos.xlsx`:** hojas Productos y Variantes con códigos, precios, stock, peso y medidas. El dueño lo llena; después se carga a `lib/products.ts` y a la base con el seed. Faltan: precios reales, stock, peso, medidas, textos.

## 6. Qué sigue (en este orden)

1. **Conectar la base de datos (Supabase).**
   - Crear el proyecto (o usar la CLI local con Docker). Copiar `packages/db/.env.example` a `.env` con `DATABASE_URL` (pooler, puerto 6543) y `DIRECT_URL` (conexión directa).
   - Correr la primera migración con Prisma: `pnpm --filter @nitro/db migrate:dev`.
   - Escribir las **políticas RLS** en SQL aparte (Prisma no las maneja): RLS activo en todas las tablas, catálogo público solo lectura, el cliente solo ve lo suyo.
   - **Marketplace decidido (22 oct):** habrá vendedores externos. El esquema ya tiene `Seller` (la tienda propia es un vendedor con `isHouse`), `products.seller_id`, `order_items.seller_id` y el rol `seller`. Falta: RLS por vendedor y que el seed cree el vendedor de la casa.
2. **Sembrar el catálogo** (seed) con las categorías y los 3 productos reales (incluyendo las imágenes por variante), y reemplazar `lib/products.ts` por lecturas a la base de datos.
3. **Capa de API** (NestJS según las especificaciones, o consultas desde el servidor de Next para empezar) con precios y stock validados en el servidor. El navegador nunca escribe pedidos, pagos ni inventario.
4. **Carrito en el servidor** (hoy solo vive en `localStorage`): carrito de invitado con cookie firmada que se fusiona al iniciar sesión.
5. **Autenticación** con Supabase Auth (email y Google).
6. **Checkout y pagos** (Wompi y/o Mercado Pago). Hoy el botón "Ir a pagar" está **desactivado a propósito**.
7. **Panel de administración** (incluye elegir los productos destacados).
8. Envíos, facturación electrónica, emails transaccionales, cupones, "Avísame cuando llegue", búsqueda.

## 7. Pendiente que no depende del código

- **Video del león (Hailuo AI, plan gratuito):** trae marca de agua "MINIMAX | Hailuo AI" (abajo a la derecha; detrás del vidrio casi no se ve, pero está). **Confirmar que el plan gratuito permite uso comercial** antes de publicar; si no, regenerar el video con un plan o herramienta que lo permita.

Decisiones de negocio marcadas `[DEFINIR]` en `especificaciones-de-uso.md` (envíos, devoluciones, garantías, contra entrega, preventa, plazos de reserva de stock, etc.) y la decisión **NestJS propio vs. Medusa.js**: el dueño eligió **NestJS propio**.

## 8. Qué NO funciona aún (para no perder tiempo)

- Los botones **Comprar ahora** y **Agregar al carrito** sí funcionan (carrito local). **"Ir a pagar"** y **"Avísame cuando llegue"** no hacen nada todavía, y existen `/ayuda`, `/terminos`, `/privacidad`, `/ingresar` y `/cuenta`, pero con **texto provisional** (legal por revisar) y el formulario de ingreso está desactivado hasta tener Supabase Auth.
- No se probó en celular real ni con lectores de pantalla; sí se verificó en Chrome de escritorio. El efecto vidrio (`backdrop-filter`) puede rendir más lento en celulares viejos.
