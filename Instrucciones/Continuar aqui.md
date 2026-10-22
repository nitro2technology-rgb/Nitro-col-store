# Continuar aquí — Nitro Col Store

**Última actualización:** 21 de octubre de 2026 (catálogo real cargado)
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
| Catálogo real | Aurafit FW5 (azul/beige), G-tide L42, Smartwatch X8 Pro, con fotos y video |
| Esquema de base de datos (Prisma) | Escrito y validado, **sin migrar** |
| Diseño visual | Blanco y negro con efecto vidrio (ver sección 4) |
| Carrito | Funciona en el navegador (Zustand + localStorage) |

**No existe todavía:** API NestJS (`apps/api`), panel de administración, autenticación, checkout, pagos, envíos, facturación electrónica, emails, búsqueda, cupones en el carrito, reseñas. Nada de esto está empezado.

## 3. Estructura

```
apps/storefront/
  app/                 páginas: / · /c/[slug] · /p/[slug] · /carrito
  components/          header, menú de categorías, hero de producto, tarjeta (product-tile), carrusel (image-carousel), carrito, ilustraciones (art/)
  lib/products.ts      CATÁLOGO + árbol de categorías + helpers (variantImages)
  lib/cart.ts          store del carrito (Zustand)
  lib/faq.ts           preguntas frecuentes comunes
  public/brand/        logo en PNG transparente (logo-mark.png, logo-full.png)
  public/products/<slug>/  fotos y video de cada producto
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
**Hoy ninguno tiene `featuredRank`, así que la portada no muestra destacados** (falta que el dueño elija). Los elige el campo `featuredRank` de cada producto (menor número = primero). Filas de dos: rangos 1 y 2 arriba, 3 y 4 abajo. En la base de datos ya existe `products.featured_rank`; cuando haya panel de administración será un campo editable.

## 4. Decisiones de diseño (no las deshagas sin hablar con el dueño)

- **Fondo blanco y negro, como el logo.** Los grises de la paleta (`#EDEDED #9CA3AF #4B5563 #1F2937 #111827`) son de apoyo. El dueño dijo que más adelante se puede "jugar" con otros colores; los tokens están en `packages/ui/src/theme.css` (`--action` cambia el color de la acción principal sin tocar componentes).
- **Dos temas:** `light` (por defecto) y `dark`, que se aplican con `data-theme` en cualquier contenedor. Cada producto declara su tema (`theme`), y su página y su tarjeta lo usan.
- **Efecto vidrio** en todo: clases `glass`, `glass-nav`, `glass-band`, `stage-dark` en `theme.css`. El fondo blanco lleva manchas grises suaves (en `globals.css`) para que el vidrio tenga qué desenfocar.
- **Barra superior:** vidrio casi negro, **a todo el ancho** y pegada arriba (no flotante). El dueño pidió explícitamente que no fuera una "burbuja" y que fuera negro puro, no gris. El panel de categorías cuelga de ella con esquinas inferiores redondeadas.
- **Logo:** `Instrucciones/logo.png` (negro sobre blanco) se convirtió a PNG transparente y se usa como **máscara CSS**, así toma el color del texto. El nombre "se escribe" al cargar la portada: es el único movimiento ambiental (se desactiva con `prefers-reduced-motion`).
- **Referencias de diseño:** `Instrucciones/Diseños frontend/` (audífonos = claro, smartwatch = oscuro). Se siguió su estructura (radios de 28 px, botones en píldora, tipografía grande) pero **no sus colores**, que el dueño cambió.
- **Botón principal:** invierte el tema (negro sobre claro, blanco sobre oscuro).
- **Tarjeta de producto:** pequeña (máx. 420 px), carrusel cuadrado con la foto completa (`object-contain`), y debajo nombre, eslogan, descripción y precio. Las fotos principales son las de ChatGPT.
- **Landing de producto (orden pedido por el dueño):** arriba, carrusel a la izquierda y a la derecha nombre, descripción y, debajo, color, precio y comprar. Luego especificaciones, "Lo principal", galería general (tarjetas de 560 px, foto completa, sin recorte), video, en la caja y preguntas frecuentes.
- **Fotos por variante:** `variant.images` es el carrusel de tarjeta y cabecera (al elegir un color cambian las fotos); `product.images` es la galería general. Ver `variantImages()` en `lib/products.ts`.

## 5. Contenido provisional que hay que reemplazar

- **Productos reales, textos provisionales:** nombres, precios y fotos son reales (Aurafit $65.000, G-tide $69.900, X8 Pro $95.000, stock 10 cada uno; el dueño escribió "95.0000" para el reloj y se asumió $95.000). Las **descripciones, eslóganes, especificaciones y destacados los redactó Claude** con muy pocos datos; el dueño debe darlos o revisarlos. G-tide no tiene fotos de ChatGPT (usa sus fotos normales) y el color beige de Aurafit usa fotos del catálogo.
- **Fuentes de las fotos:** carpeta `Catálogo/` en la raíz (no está en git: 21 MB con PNG originales). Las fotos de ChatGPT se convirtieron a WebP (1600 px) como `principal-N.webp`. Si hay fotos nuevas, copiarlas a `apps/storefront/public/products/<slug>/` y referenciarlas en `lib/products.ts`.
- **Ilustraciones SVG** (`components/art/`): ya no se usan en los productos actuales; solo son el respaldo si un producto no tiene fotos.
- **Textos de la portada** (titular "Tecnología elegida con cuidado.", presentación, "Compra con calma") los redactó Claude; el único dato real es "Desde 2020", tomado del logo.
- El logo en PNG mide ~640 px de ancho. Con un **SVG** se vería más nítido en pantallas de alta densidad.

## 6. Qué sigue (en este orden)

1. **Conectar la base de datos (Supabase).**
   - Crear el proyecto (o usar la CLI local con Docker). Copiar `packages/db/.env.example` a `.env` con `DATABASE_URL` (pooler, puerto 6543) y `DIRECT_URL` (conexión directa).
   - Correr la primera migración con Prisma: `pnpm --filter @nitro/db migrate:dev`.
   - Escribir las **políticas RLS** en SQL aparte (Prisma no las maneja): RLS activo en todas las tablas, catálogo público solo lectura, el cliente solo ve lo suyo.
   - **Decidir antes de migrar:** si habrá marketplace con vendedores externos, agregar `seller_id` a productos y pedidos ahora (ver riesgo #5 de las especificaciones técnicas).
2. **Sembrar el catálogo** (seed) con las categorías y los 3 productos reales (incluyendo las imágenes por variante), y reemplazar `lib/products.ts` por lecturas a la base de datos.
3. **Capa de API** (NestJS según las especificaciones, o consultas desde el servidor de Next para empezar) con precios y stock validados en el servidor. El navegador nunca escribe pedidos, pagos ni inventario.
4. **Carrito en el servidor** (hoy solo vive en `localStorage`): carrito de invitado con cookie firmada que se fusiona al iniciar sesión.
5. **Autenticación** con Supabase Auth (email y Google).
6. **Checkout y pagos** (Wompi y/o Mercado Pago). Hoy el botón "Ir a pagar" está **desactivado a propósito**.
7. **Panel de administración** (incluye elegir los productos destacados).
8. Envíos, facturación electrónica, emails transaccionales, cupones, "Avísame cuando llegue", búsqueda.

## 7. Pendiente que no depende del código

Decisiones de negocio marcadas `[DEFINIR]` en `especificaciones-de-uso.md` (envíos, devoluciones, garantías, contra entrega, preventa, plazos de reserva de stock, etc.) y la decisión **NestJS propio vs. Medusa.js**: el dueño eligió **NestJS propio**.

## 8. Qué NO funciona aún (para no perder tiempo)

- Los botones **Comprar ahora** y **Agregar al carrito** sí funcionan (carrito local). **"Ir a pagar"** y **"Avísame cuando llegue"** no hacen nada todavía, y **no existen** las páginas de ayuda, términos, privacidad, cuenta ni inicio de sesión.
- No se probó en celular real ni con lectores de pantalla; sí se verificó en Chrome de escritorio. El efecto vidrio (`backdrop-filter`) puede rendir más lento en celulares viejos.
