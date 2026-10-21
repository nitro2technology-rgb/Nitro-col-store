# Especificaciones de Uso — E-commerce (Tecnología y Hogar)

**Versión:** 1.0
**Fecha:** 21 de octubre de 2026
**Documento complementario de:** `especificaciones-tecnicas.md`

---

## 1. Propósito y audiencia

Este documento describe **cómo se usa la plataforma** y **qué reglas de negocio aplican**, desde dos perspectivas:

| Parte | Audiencia | Contenido |
|---|---|---|
| **A. Tienda** | Clientes y visitantes | Navegar, comprar, pagar, hacer seguimiento, devolver |
| **B. Panel de administración** | Equipo interno (catálogo, operaciones, soporte, marketing, administración) | Gestionar productos, inventario, pedidos, promociones, landings y campañas |

Las secciones 10 en adelante son comunes: reglas de negocio, mensajes del sistema, preguntas frecuentes y criterios de aceptación.

> Los valores marcados como **[DEFINIR]** son decisiones de negocio pendientes (plazos, costos, políticas). Deben completarse antes del lanzamiento.

---

## 2. Roles y permisos

| Rol | Quién es | Puede |
|---|---|---|
| **Visitante** | Persona sin sesión | Navegar, buscar, usar carrito, comprar como invitado |
| **Cliente** | Usuario registrado | Todo lo anterior + historial de pedidos, direcciones guardadas, reseñas, favoritos |
| **Soporte** | Atención al cliente | Ver pedidos y clientes, cambiar estados permitidos, gestionar devoluciones. No edita catálogo ni precios |
| **Gestor de catálogo** | Equipo de producto | Crear/editar productos, categorías, atributos, imágenes e inventario |
| **Marketing** | Equipo de publicidad | Gestionar cupones, promociones, landings y enlaces de campaña, ver analítica |
| **Administrador** | Responsable de operación | Todo lo anterior + usuarios, configuración, reportes financieros |
| **Super administrador** | Propietario / tecnología | Acceso total, ajustes críticos (pagos, integraciones, seguridad) |

Reglas:
- Las cuentas administrativas **requieren verificación en dos pasos (MFA)**.
- Cada persona usa su propia cuenta; no se comparten credenciales.
- Toda acción administrativa relevante queda en el **registro de auditoría** (quién, qué, cuándo).

---

# PARTE A — TIENDA (CLIENTES)

## 3. Navegación y descubrimiento

### 3.1 Estructura de la tienda

- **Encabezado:** logo, buscador, cuenta, carrito, menú de categorías (Tecnología, Hogar y sus subcategorías).
- **Página de inicio:** banners de campaña, categorías destacadas, productos más vendidos, ofertas vigentes, nuevos ingresos.
- **Pie de página:** ayuda, envíos, devoluciones, garantías, términos y condiciones, política de privacidad, contacto.

### 3.2 Listado de productos (categoría o resultados de búsqueda)

- Cada tarjeta muestra: imagen, nombre, marca, precio, precio anterior y % de descuento (si aplica), calificación y estado de stock.
- **Filtros** (cambian según la categoría):
  - Tecnología: marca, rango de precio, memoria, almacenamiento, pantalla, conectividad, etc.
  - Hogar: marca, material, color, dimensiones, rango de precio, etc.
  - Comunes: disponibilidad, calificación, envío gratis, en oferta.
- **Orden:** relevancia, menor precio, mayor precio, más vendidos, más recientes, mejor calificados.
- **Paginación** o carga progresiva; los filtros y el orden se conservan en la URL para poder compartirla.

### 3.3 Búsqueda

- Búsqueda por nombre, marca, categoría o referencia (SKU).
- Sugerencias mientras se escribe (a partir de 2–3 caracteres).
- Tolerancia a errores de digitación (ej. "audifonos" / "audífonos" / "audifnos").
- Si no hay resultados: mensaje claro, sugerencias alternativas y enlace a las categorías.

### 3.4 Página de producto

Contenido, en este orden de prioridad:
1. Galería de imágenes (zoom) y video.
2. Nombre, marca, calificación y número de reseñas.
3. **Precio**, descuento, y precio por cuotas si aplica.
4. **Selector de variante** (color, capacidad, tamaño) que actualiza precio, imágenes, SKU y stock.
5. Disponibilidad (en stock / pocas unidades / agotado) y **cotizador de envío** por ciudad.
6. Botones **Agregar al carrito** y **Comprar ahora**.
7. Descripción, especificaciones técnicas, qué incluye la caja.
8. Garantía, envíos y devoluciones.
9. Reseñas y preguntas frecuentes.
10. Productos relacionados.

Comportamientos:
- Si una variante está agotada, se muestra deshabilitada con la opción **"Avísame cuando llegue"** (solicita email).
- "Pocas unidades" aparece cuando el stock es menor o igual a **[DEFINIR, ej. 5]**.
- La cantidad máxima por compra está limitada al stock disponible y a un tope por pedido **[DEFINIR]**.

### 3.5 Landings de campaña

Cuando se llega desde un anuncio, el cliente puede ver una página dedicada a un producto (`/promo/...`) con beneficios, reseñas, oferta y un botón de compra directa. El precio y el stock siempre son los reales del producto. Si la oferta tiene fecha de vencimiento, al terminar la página sigue disponible pero muestra el precio regular.

---

## 4. Carrito y checkout

### 4.1 Carrito

- Se puede **agregar, quitar y cambiar cantidades** sin iniciar sesión.
- Si el visitante inicia sesión, su carrito se **fusiona** con el que tenía guardado en su cuenta.
- El carrito **no reserva stock**; el stock se reserva al iniciar el pago.
- Se advierte si un producto cambió de precio o se agotó desde que fue agregado.
- Permite ingresar un **cupón** y muestra el desglose: subtotal, descuento, envío, impuestos y total.
- Un carrito de invitado se conserva **[DEFINIR, ej. 30 días]** en el mismo dispositivo.

### 4.2 Pasos del checkout

```
1. Contacto  →  2. Dirección  →  3. Envío  →  4. Pago  →  5. Confirmación
```

| Paso | Datos solicitados | Validaciones |
|---|---|---|
| **1. Contacto** | Email, teléfono/WhatsApp; opción de iniciar sesión | Formato válido; teléfono colombiano (10 dígitos) |
| **2. Dirección** | Nombre, documento de identidad, departamento, ciudad, dirección, barrio/complemento, indicaciones | Ciudad con cobertura de envío; documento requerido para facturación |
| **3. Envío** | Selección entre las opciones disponibles | Muestra costo y tiempo estimado por transportadora |
| **4. Pago** | Medio de pago, aceptación de términos y política de datos | Aceptación obligatoria |
| **5. Confirmación** | Resumen del pedido | Número de pedido y correo de confirmación |

- Se permite comprar **como invitado**; al final se ofrece crear cuenta con un solo clic.
- Los clientes registrados ven sus direcciones guardadas y pueden elegir una.
- Si el usuario solicita factura a nombre de empresa, ingresa NIT y razón social.
- El botón **Pagar** se deshabilita tras el primer clic para evitar pedidos duplicados.

### 4.3 Medios de pago

| Medio | Comportamiento |
|---|---|
| Tarjeta de crédito/débito | Formulario seguro de la pasarela; opción de cuotas (si el emisor lo permite) |
| PSE | Redirección al banco y retorno automático |
| Nequi / Daviplata | Notificación en la app del cliente |
| Efectivo (Efecty, Baloto u otros) | Se genera un código; el pedido queda a la espera del pago y vence a las **[DEFINIR, ej. 48 h]** |
| Contra entrega | **[DEFINIR si se ofrecerá y en qué ciudades]** |

Reglas:
- Los datos de tarjeta **nunca** se almacenan en la plataforma.
- Un pedido se considera **pagado únicamente cuando la pasarela confirma el pago**, no cuando el cliente regresa a la página.
- Si el pago es rechazado, el cliente puede reintentar con otro medio sin perder su carrito.
- Si el pago queda **pendiente** (PSE, efectivo), el cliente ve el estado y recibe un correo cuando se resuelva.
- Al iniciar el pago, el stock se **reserva por [DEFINIR, ej. 15 minutos]**. Si el pago no se completa, la reserva se libera.

### 4.4 Cupones y promociones

- Un cupón se aplica en el carrito o mediante un enlace (`?coupon=CODIGO`).
- Tipos: porcentaje, valor fijo, envío gratis.
- Pueden tener: fecha de vigencia, monto mínimo, categorías o productos específicos, límite total de usos y límite por cliente.
- Por defecto **no se combinan** dos cupones **[DEFINIR]**.
- Mensajes claros cuando un cupón no aplica (vencido, monto mínimo no alcanzado, producto excluido).

---

## 5. Cuenta del cliente

| Sección | Funciones |
|---|---|
| **Perfil** | Editar nombre, teléfono, documento; cambiar contraseña; eliminar cuenta |
| **Direcciones** | Agregar, editar, eliminar y marcar una predeterminada |
| **Mis pedidos** | Lista con estado, detalle, factura descargable, seguimiento y botón de ayuda |
| **Favoritos** | Guardar productos y recibir aviso si bajan de precio **[opcional]** |
| **Reseñas** | Calificar productos comprados |
| **Privacidad** | Gestionar consentimiento de cookies y comunicaciones, descargar o eliminar datos |

- Registro con email y contraseña o con Google.
- Recuperación de contraseña mediante enlace por correo con vigencia limitada.
- La contraseña debe tener un mínimo de 8 caracteres.

---

## 6. Seguimiento de pedidos

### 6.1 Estados del pedido (vista del cliente)

| Estado interno | Texto para el cliente | Significado |
|---|---|---|
| `pending_payment` | Pendiente de pago | A la espera de confirmación del pago |
| `paid` | Pago confirmado | Pago recibido |
| `processing` | Preparando tu pedido | Alistamiento en bodega |
| `shipped` | Enviado | Entregado a la transportadora; incluye guía y enlace de rastreo |
| `delivered` | Entregado | Recibido por el cliente |
| `cancelled` | Cancelado | Cancelado antes del envío |
| `return_requested` | Devolución en trámite | Solicitud aprobada o en revisión |
| `returned` / `refunded` | Devuelto / Reembolsado | Proceso finalizado |

### 6.2 Notificaciones al cliente

| Evento | Canal |
|---|---|
| Pedido recibido | Email |
| Pago confirmado | Email (+ WhatsApp opcional) |
| Pedido enviado, con guía | Email y WhatsApp/SMS |
| Pedido entregado | Email |
| Pago pendiente por vencer | Email |
| Solicitud de reseña (**[DEFINIR]** días después de la entrega) | Email |
| Recuperación de carrito abandonado (si hay consentimiento) | Email |

---

## 7. Envíos, devoluciones y garantías (políticas)

> Esta sección fija las reglas que la plataforma debe aplicar. Los valores deben validarse con asesoría legal.

### 7.1 Envíos

- Cobertura: **[DEFINIR: nacional / ciudades principales]**.
- Costo calculado según peso, dimensiones y destino. Envío gratis a partir de **[DEFINIR monto]**.
- Tiempo de despacho: **[DEFINIR, ej. 1–2 días hábiles]**; tiempo de entrega según ciudad y transportadora.
- Productos voluminosos de Hogar (muebles, electrodomésticos grandes) pueden tener condiciones distintas de envío y entrega.

### 7.2 Retracto y devoluciones

- El cliente puede ejercer el **derecho de retracto** en las compras a distancia dentro de los **5 días hábiles** siguientes a la entrega, conforme al Estatuto del Consumidor (Ley 1480 de 2011).
- El producto debe devolverse en buen estado, con accesorios y empaque, salvo las excepciones legales.
- Flujo: el cliente solicita la devolución desde **Mis pedidos** → soporte revisa → se genera la guía de retorno → se recibe e inspecciona → se reembolsa por el **mismo medio de pago** dentro de **[DEFINIR plazo]**.
- Quién asume el costo del envío de retorno: **[DEFINIR]**.

### 7.3 Garantía

- Los productos de Tecnología y Hogar tienen garantía legal y/o del fabricante, indicada en cada página de producto.
- Para hacerla efectiva, el cliente abre una solicitud desde **Mis pedidos** adjuntando fotos o video y la descripción del problema.
- Soporte coordina revisión, reparación, cambio o reembolso según corresponda.

---

# PARTE B — PANEL DE ADMINISTRACIÓN

## 8. Acceso y organización del panel

- **Acceso:** `admin.tudominio.co`, con email, contraseña y MFA.
- **Menú principal:** Dashboard · Pedidos · Productos · Categorías y atributos · Inventario · Clientes · Promociones · Landings y campañas · Reportes · Configuración · Usuarios y roles · Auditoría.
- El menú muestra solo los módulos permitidos para el rol.
- La sesión expira por inactividad **[DEFINIR, ej. 30 min]**.

### 8.1 Dashboard

Indicadores del día/semana/mes: ventas, número de pedidos, ticket promedio, conversión, pedidos pendientes de despacho, productos con stock bajo, devoluciones abiertas y campañas con mejor rendimiento.

---

## 9. Procedimientos del panel

### 9.1 Gestión de productos

**Crear un producto**

1. Ir a **Productos → Nuevo producto**.
2. Completar datos generales: nombre, marca, categoría(s), descripción y estado (`borrador` / `publicado`).
3. Cargar **imágenes** (la primera es la principal; se pueden reordenar). Recomendado: fondo limpio, mínimo 1000 × 1000 px, formatos JPG/PNG/WebP, con texto alternativo.
4. Completar los **atributos** propios de la categoría (ej. RAM, pantalla, material, dimensiones).
5. Crear las **variantes**: para cada combinación vendible definir SKU único, precio, precio anterior (opcional), peso, dimensiones y stock.
6. Completar **SEO**: título, descripción corta y URL amigable (se genera automáticamente y puede editarse).
7. **Guardar como borrador**, revisar con **Vista previa** y **Publicar**.

Reglas:
- El **SKU** es único y no se reutiliza.
- Un producto no puede publicarse sin imagen, precio, categoría y al menos una variante.
- El **peso y las dimensiones** son obligatorios, pues de ellos depende el costo de envío.
- Los precios se ingresan en pesos colombianos (COP) y **con** o **sin** IVA según la configuración global **[DEFINIR]**; la tienda siempre muestra al cliente el precio final.
- Eliminar un producto lo **archiva** (borrado lógico). No se elimina si tiene pedidos asociados.

**Editar, duplicar y archivar**
- Cambios de precio, stock o descripción se reflejan en la tienda en pocos minutos.
- **Duplicar** facilita crear productos similares (se debe cambiar nombre y SKU).
- **Edición masiva** (precios, estado, categoría) y **importación por CSV/Excel** disponibles para catálogos grandes, con vista previa de errores antes de aplicar.

### 9.2 Categorías y atributos

- Las categorías forman un árbol (ej. Tecnología → Computadores → Portátiles).
- Cada categoría define qué **atributos** aplican y cuáles se usan como **filtros** en la tienda.
- Para agregar una categoría nueva (ej. Deportes) no se requiere intervención técnica: se crea la categoría, se asignan sus atributos y se cargan productos.
- No se puede eliminar una categoría que tenga productos activos; deben reasignarse primero.

### 9.3 Inventario

- Vista por SKU con: stock disponible, reservado y total.
- **Ajustes manuales** requieren un motivo (ingreso de mercancía, merma, conteo físico, devolución) y quedan registrados.
- **Alertas de stock bajo** por producto, con umbral configurable.
- Si el stock llega a 0, la variante se muestra como agotada automáticamente.
- Opción de **permitir o no vender sin stock (preventa)** **[DEFINIR por producto]**.
- Importación masiva de existencias por archivo.

### 9.4 Gestión de pedidos

**Lista de pedidos:** filtros por estado, fecha, medio de pago, ciudad, cliente, campaña de origen; búsqueda por número de pedido, email o documento; exportación a Excel.

**Detalle de un pedido:** productos, cliente, direcciones, pagos, envío, facturas, historial de estados, notas internas y línea de tiempo de notificaciones.

**Procedimiento estándar de despacho**

1. Revisar pedidos en estado **Pago confirmado**.
2. Pasar a **Preparando** cuando comience el alistamiento (opcional: imprimir lista de picking).
3. Generar la **guía** con la transportadora desde el pedido (o registrar manualmente número de guía y transportadora).
4. Marcar como **Enviado**: el sistema notifica al cliente con el enlace de rastreo.
5. El estado **Entregado** se actualiza por la transportadora o de forma manual.

**Cancelaciones y reembolsos**
- Un pedido puede cancelarse mientras **no esté enviado**. Se devuelve el stock automáticamente.
- Los **reembolsos** se ejecutan desde el pedido (total o parcial), por el mismo medio de pago, y exigen un motivo. Requieren rol Soporte con aprobación del Administrador por encima de **[DEFINIR monto]**.
- Cada cambio de estado queda en el historial con usuario, fecha y motivo.

**Pagos pendientes:** los pedidos en efectivo o PSE sin confirmar se cancelan automáticamente al vencer el plazo y liberan el stock.

**Facturación electrónica:** la factura se genera automáticamente al confirmar el pago y se envía al cliente. Si falla, el pedido aparece con una alerta para reintento manual.

### 9.5 Clientes

- Ver datos, historial de pedidos, direcciones y gasto total.
- Soporte puede editar datos de contacto a solicitud del cliente; no puede ver contraseñas ni datos de tarjeta (no se almacenan).
- **Solicitudes de privacidad** (consulta, corrección, eliminación): se atienden dentro de los plazos legales y quedan registradas.

### 9.6 Promociones y cupones

1. **Promociones → Nuevo cupón**.
2. Definir código, tipo (porcentaje, valor fijo, envío gratis), valor, vigencia, monto mínimo, productos o categorías aplicables y límites de uso.
3. Activar y **probar en la tienda de staging** antes de comunicarlo.
4. Revisar en el reporte el uso y el impacto sobre ventas y margen.

Buenas prácticas: códigos fáciles de recordar, vigencia clara, límite por cliente y no crear descuentos que dejen margen negativo.

### 9.7 Landings de campaña (Marketing)

**Crear una landing**

1. **Landings y campañas → Nueva landing**.
2. Seleccionar el **producto o productos** asociados.
3. Definir el nombre interno y la **URL** (`/promo/nombre-de-la-campana`).
4. Armar la página agregando **bloques** y ordenándolos: hero, beneficios, galería, especificaciones, reseñas, preguntas frecuentes, oferta con cuenta regresiva, garantía y barra de compra fija en móvil.
5. Configurar SEO: por defecto, la landing de campaña apunta al producto como canónica y puede marcarse `noindex`.
6. **Vista previa** en móvil y escritorio.
7. **Publicar**. Opcionalmente programar fecha de inicio y de fin.

Reglas de contenido:
- Solo se muestran ofertas y cuentas regresivas **reales**: si la oferta termina, el contador no se reinicia artificialmente.
- Las afirmaciones del producto (beneficios, especificaciones) deben ser verificables.
- Las reseñas son únicamente las reales de clientes.

**Crear un enlace de campaña**

1. **Landings y campañas → Enlaces → Nuevo enlace**.
2. Elegir el destino (producto o landing).
3. Seleccionar la **plantilla de UTM** de la plataforma (Meta, Google, TikTok, Email, WhatsApp, Influencer) y completar `campaña`, `contenido` y `término`.
4. El sistema genera el enlace corto (`/r/abc123`). Copiarlo y pegarlo en el anuncio.
5. Si luego cambia el producto promocionado, se puede **editar el destino** sin tocar el anuncio.

**Nomenclatura UTM recomendada** (para que los reportes sean legibles)

| Parámetro | Convención | Ejemplo |
|---|---|---|
| `utm_source` | Plataforma, en minúsculas | `meta`, `google`, `tiktok`, `email` |
| `utm_medium` | Tipo de tráfico | `cpc`, `paid_social`, `email`, `influencer` |
| `utm_campaign` | `producto_oferta_mes` | `audifonos-x1_lanzamiento_nov26` |
| `utm_content` | Variante del anuncio | `video-a`, `carrusel-b` |

**Medir resultados:** en **Reportes → Campañas** se ve, por campaña y landing: visitas, clics al botón de compra, productos agregados al carrito, pedidos, ingresos y ROAS (si se cargó el gasto de la campaña).

### 9.8 Feeds de catálogo para anuncios

- **Configuración → Catálogos publicitarios** muestra las direcciones del feed de **Google Merchant Center** y **Meta Catalog**.
- Se actualizan automáticamente cada hora.
- Para que un producto sea aceptado en el feed debe tener: título, descripción, imágenes de calidad, precio, disponibilidad, marca y, cuando aplique, código de barras (GTIN).
- El panel muestra una lista de **productos con datos incompletos** que deben corregirse.

### 9.9 Reportes

| Reporte | Contenido |
|---|---|
| Ventas | Por día, categoría, producto, ciudad, medio de pago |
| Productos | Más vistos, más vendidos, mayor conversión, bajo rendimiento |
| Inventario | Stock actual, rotación, agotados, valor del inventario |
| Clientes | Nuevos vs. recurrentes, valor de vida del cliente |
| Campañas | Atribución, conversión y ROAS por campaña/landing |
| Operación | Tiempo de despacho, entregas tardías, devoluciones y motivos |
| Financiero | Ingresos, descuentos, reembolsos, comisiones de pasarela, impuestos |

Todos los reportes se pueden **filtrar por fechas y exportar a Excel/CSV**.

### 9.10 Configuración (Administrador / Super administrador)

- Datos de la empresa, impuestos y moneda.
- Zonas y tarifas de envío, transportadoras activas, umbral de envío gratis.
- Pasarelas de pago y medios habilitados.
- Plantillas de correos y mensajes.
- Políticas (términos, privacidad, devoluciones, garantías) editables en el panel.
- Gestión de usuarios, roles y MFA.
- Integraciones (facturación, analítica, píxeles).

---

# SECCIONES COMUNES

## 10. Reglas de negocio generales

| # | Regla |
|---|---|
| 1 | Los precios se muestran en **COP** e incluyen IVA cuando aplica. El desglose de impuestos aparece en el checkout y en la factura |
| 2 | El **precio que cuenta es el del momento de pagar**; el sistema lo recalcula en el servidor y nunca confía en el valor enviado por el navegador |
| 3 | Un pedido solo avanza a **Pago confirmado** por confirmación de la pasarela |
| 4 | El stock se **reserva** al iniciar el pago y se **descuenta** al confirmarse; si el pago falla o vence, se **libera** |
| 5 | No se puede vender más unidades que el stock disponible (salvo preventa habilitada) |
| 6 | Un pedido **enviado** no se cancela; se gestiona como devolución |
| 7 | Los reembolsos van al **medio de pago original** |
| 8 | Toda modificación administrativa de pedidos, precios, stock y usuarios queda auditada |
| 9 | Los cupones no pueden dejar el total del pedido en negativo |
| 10 | Los datos personales se usan solo para los fines autorizados y bajo la política de privacidad |

## 11. Mensajes del sistema (criterios de redacción)

- Claros, breves y en español neutro; indican **qué pasó** y **qué puede hacer el usuario**.
- Ejemplos de referencia:

| Situación | Mensaje |
|---|---|
| Producto agotado al pagar | "Lo sentimos, [producto] se agotó mientras comprabas. Quitamos este artículo de tu carrito para que puedas continuar." |
| Pago rechazado | "Tu pago no pudo procesarse. Puedes intentarlo de nuevo o elegir otro medio de pago." |
| Cupón inválido | "Este cupón no es válido o ya venció." |
| Ciudad sin cobertura | "Por ahora no tenemos envíos a esta ciudad. Escríbenos y te avisamos cuando lleguemos." |
| Pago pendiente | "Estamos esperando la confirmación de tu pago. Te avisaremos por correo en cuanto se confirme." |

- Nunca se muestran errores técnicos ni trazas al usuario final.

## 12. Atención al cliente

- Canales: **[DEFINIR: WhatsApp, email, teléfono, chat]**.
- Horario de atención: **[DEFINIR]**.
- Tiempo objetivo de primera respuesta: **[DEFINIR, ej. menos de 4 horas hábiles]**.
- Cada solicitud tiene número de caso, estado y está asociada al pedido cuando aplique.
- Existe una **página de ayuda** con preguntas frecuentes de envíos, pagos, devoluciones, garantías y seguimiento.

## 13. Preguntas frecuentes (para la página de ayuda)

**¿Necesito crear una cuenta para comprar?**
No. Puedes comprar como invitado. Con una cuenta puedes ver tu historial y guardar direcciones.

**¿Qué medios de pago aceptan?**
Tarjetas de crédito y débito, PSE, Nequi, Daviplata y efectivo. *(Ajustar a lo habilitado.)*

**¿Cuánto tarda mi pedido?**
Depende de la ciudad y la transportadora. En el checkout verás el tiempo estimado antes de pagar.

**¿Cómo sigo mi pedido?**
Desde **Mi cuenta → Mis pedidos**, o con el enlace de rastreo que te enviamos por correo cuando sale tu pedido.

**¿Puedo devolver un producto?**
Sí. Tienes derecho de retracto dentro de los 5 días hábiles posteriores a la entrega. Solicítalo desde **Mis pedidos**.

**El producto llegó con un defecto, ¿qué hago?**
Abre una solicitud de garantía desde tu pedido con fotos o video, y te contactamos.

**¿Mi pago aparece rechazado pero me descontaron el dinero?**
Es posible que el banco tenga una retención temporal. Si el pedido no aparece como pagado en pocas horas, escríbenos con tu número de pedido.

**¿Mis datos están seguros?**
Los pagos los procesa la pasarela y no almacenamos datos de tarjeta. Tus datos personales se tratan según nuestra política de privacidad.

## 14. Requisitos de usabilidad y accesibilidad

- Diseño **mobile-first**: todo el flujo de compra debe poder completarse cómodamente desde un celular.
- Botones y textos legibles, contraste suficiente y navegación por teclado (WCAG 2.1 AA).
- Formularios con validación en tiempo real y mensajes claros junto a cada campo.
- Checkout con el mínimo de pasos y campos posibles; autocompletado de direcciones cuando sea viable.
- Idioma: español (Colombia). Estructura preparada para sumar otros idiomas.

## 15. Criterios de aceptación del MVP

El MVP está listo para lanzamiento cuando se cumplen todos estos puntos:

**Tienda**
- [ ] Un visitante puede encontrar un producto por categoría, filtros y búsqueda.
- [ ] Puede agregar productos al carrito, aplicar un cupón y completar el pago como invitado y como usuario registrado.
- [ ] El pago con tarjeta, PSE y al menos un medio en efectivo funciona de extremo a extremo en producción.
- [ ] El cliente recibe correo de confirmación y puede ver el estado de su pedido.
- [ ] Un producto agotado no se puede comprar y ofrece aviso de disponibilidad.
- [ ] Las páginas de producto cargan en menos de 2.5 s (LCP) en móvil con conexión 4G.

**Panel**
- [ ] El equipo puede crear un producto con variantes, imágenes y atributos sin ayuda técnica.
- [ ] Puede gestionar un pedido desde "Pago confirmado" hasta "Entregado", incluyendo guía de envío.
- [ ] Puede crear cupones y verificar su uso.
- [ ] Puede procesar una cancelación y un reembolso.
- [ ] Los roles restringen correctamente lo que cada persona ve y hace.
- [ ] Toda acción administrativa relevante queda en el registro de auditoría.

**Publicidad**
- [ ] Cada producto tiene una página optimizada que recibe y guarda UTM.
- [ ] El pedido conserva la campaña de origen.
- [ ] El evento de compra llega a GA4 y a la plataforma publicitaria elegida.

**Operación y cumplimiento**
- [ ] Facturación electrónica emitida automáticamente.
- [ ] Términos, privacidad, retracto y garantías publicados.
- [ ] Copias de seguridad y monitoreo activos.

## 16. Glosario

| Término | Significado |
|---|---|
| **SKU** | Código único de una variante vendible de un producto |
| **Variante** | Combinación específica de un producto (ej. color negro, 256 GB) |
| **Landing page** | Página enfocada en un solo objetivo: convencer y llevar a la compra |
| **UTM** | Parámetros en un enlace que identifican de qué campaña llegó una visita |
| **ROAS** | Ingresos generados por cada peso invertido en publicidad |
| **PSE** | Pagos Seguros en Línea, débito desde cuenta bancaria |
| **Retracto** | Derecho legal del consumidor a devolver una compra a distancia |
| **Carrito abandonado** | Carrito con productos que no llegó a pagarse |
| **MFA** | Verificación en dos pasos para iniciar sesión |

## 17. Decisiones pendientes de negocio

| # | Tema | Responsable sugerido |
|---|---|---|
| 1 | Cobertura geográfica y tarifas de envío; umbral de envío gratis | Operaciones |
| 2 | ¿Habrá pago contra entrega? | Operaciones / Finanzas |
| 3 | Plazos y costos de devolución y reembolso | Operaciones / Legal |
| 4 | Política de garantías por categoría | Legal / Proveedores |
| 5 | Reglas de combinación de cupones | Marketing |
| 6 | Canales y horarios de atención | Soporte |
| 7 | ¿Se permite preventa / vender sin stock? | Operaciones |
| 8 | Precios con o sin IVA en el panel | Finanzas |
| 9 | Umbral de stock bajo por categoría | Operaciones |
| 10 | Tiempos de reserva de stock y vencimiento de pagos en efectivo | Operaciones / Tecnología |
