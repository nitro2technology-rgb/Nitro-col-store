# Imágenes de las fichas de Tecnología — cómo usar estos prompts

Cada ficha de Tecnología (smartwatch y audífonos) tiene secciones que necesitan una foto **acorde a lo que dicen**:

| Sección de la ficha | Qué muestra | Formato |
|---|---|---|
| **Portada** (arriba, con el titular grande) | El producto solo, protagonista. Una por color. | Cuadrada 1:1 |
| **Lo principal** (foto grande con texto encima) | Escena que resume el producto. El texto va abajo a la izquierda. | Horizontal 16:10 |
| **Míralo de cerca** (una foto por píldora) | Lo que dice la píldora: si dice "Pantalla 2,19"", se ve la pantalla. | Cuadrada 1:1 |

Archivos por producto:
- [smartwatch-x8-pro.md](smartwatch-x8-pro.md) — Smartwatch X8 Pro 7+1 (ficha **oscura**, fondo negro)
- [audifonos-aurafit-fw5.md](audifonos-aurafit-fw5.md) — Aurafit Aurabuds FW5 (ficha **clara**, fondo gris niebla)
- [audifonos-gtide-l42.md](audifonos-gtide-l42.md) — G-tide L42 (ficha **clara**, fondo gris niebla)

## Cómo generar cada imagen (ChatGPT u otra IA de imágenes)

1. **Adjunta siempre una foto real del producto** (la que indica cada prompt, en `apps/storefront/public/products/...` o en `Catálogo/Tecnologia/...`). Sin referencia, la IA inventa un producto parecido pero distinto, y mostrar algo distinto a lo que se vende es publicidad engañosa (Estatuto del Consumidor, Ley 1480).
2. Pega el prompt tal cual. Si sale mal, pide cambios en la misma conversación ("el reloj debe ser idéntico al de la foto", "quita el texto").
3. Revisa antes de guardar:
   - El producto es **idéntico** al real: forma, color, botones, logo.
   - **No hay texto inventado** en la imagen (ni letreros, ni palabras en la pantalla, ni marcas de agua). La página pone los textos.
   - No aparecen funciones que el producto no tiene, ni accesorios que no vienen en la caja.
   - No hay logos de otras marcas (WhatsApp, Apple, Spotify...).
4. Descarga en la mayor resolución posible (ideal 2048 px o más) y guárdala en `imagenes/productos/<producto>/` con **el nombre exacto** que indica cada prompt (por ejemplo `imagenes/productos/smartwatch-x8-pro/cerca-pantalla.png`).
5. Avísale a Claude: las convierte a WebP, crea las miniaturas (`scripts/miniaturas.py`) y las conecta a cada sección.

## Reglas de estilo (ya van dentro de cada prompt)

- **Smartwatch (oscuro):** fondo negro puro (#000000), luz de estudio fría y lateral, bordes que se pierden en la oscuridad, nada de degradados de colores detrás del producto. Estilo de foto de producto de alta gama.
- **Audífonos (claro):** fondo gris niebla liso (#F5F5F7) o blanco, luz suave y difusa, el producto flotando sin marco ni base. Las fotos con personas, en tonos casi monocromáticos (desaturados), con encuadre cerrado; el color del producto sí se respeta.
- Sin texto, sin marcas de agua, sin bordes ni marcos.
- Las fotos de "Míralo de cerca" son **cuadradas** y el producto ocupa el centro (la página puede recortar un poco los bordes).
- La foto de "Lo principal" es **horizontal 16:10**. En celular se recorta a vertical (4:5) por el centro, así que lo importante va **al centro**, y **abajo a la izquierda debe quedar oscuro y despejado**, porque ahí va el texto blanco.

## Datos por confirmar

Algunos prompts marcados **(Opcional — confirmar dato)** corresponden a funciones que aparecen en la caja o en las fotos del fabricante, pero que todavía no están en la ficha (batería, modos deportivos, control táctil...). Antes de generarlas, el dueño debe confirmar que el producto realmente las tiene. Si se confirman, Claude las agrega como especificaciones y cada una tendrá su píldora con su foto.
