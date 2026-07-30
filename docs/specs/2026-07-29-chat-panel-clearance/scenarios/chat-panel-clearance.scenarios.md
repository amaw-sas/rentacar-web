---
name: chat-panel-clearance
created_by: orchestrator
created_at: 2026-07-29T18:10:00Z
---

# Panel de chat en escritorio: liberar el input y agrandar el área

Contexto medido en producción (viewport 1487×889, root font 16px, navegador embebido de Orca):
`.chat-panel { bottom: 9rem }` está calibrado para una pila de 2 filas. Con 3 filas (`Llámanos`)
la tercera fila cae dentro del panel: solapamiento de 185×48 px y `elementFromPoint` sobre el
borde derecho del input devuelve `fab-label`, no el input. El número de filas cambia en caliente
porque `whatsappVisible` sigue el horario del dashboard.

## SCEN-001: con tres canales el FAB deja de tapar el panel

**Given**: alquilatucarro en escritorio (≥768 px) con chat y WhatsApp activos, tres filas visibles (`Chat 24 horas`, `WhatsApp`, `Llámanos`)
**When**: el visitante abre el panel pulsando `Chat 24 horas`
**Then**: ningún `.fab-item` intersecta `.chat-panel` — área de intersección exactamente 0 px²
**Evidence**: `getBoundingClientRect` de `.chat-panel` y de cada `.fab-item` vía `orca eval`; la lista `overlaps` queda vacía

## SCEN-002: se puede escribir en todo el ancho del input

**Given**: el mismo panel abierto en alquilatucarro con tres filas
**When**: se consulta qué elemento recibe el clic en el borde izquierdo, el centro y el borde derecho del campo de texto
**Then**: los tres puntos devuelven el propio input (o un descendiente de `.chat-panel`); ninguno devuelve `.fab-label`
**Evidence**: `document.elementFromPoint` en los 3 puntos; antes del arreglo el punto derecho devolvía `fab-label|SPAN` y el clic cerraba el chat

## SCEN-003: alquilame no se mueve de sitio

**Given**: alquilame en escritorio con dos filas visibles (`Chat 24 horas`, `WhatsApp`)
**When**: el visitante abre el panel
**Then**: el borde inferior del panel sigue a 144 px del fondo del viewport, igual que antes del cambio (9rem exactos)
**Evidence**: `getBoundingClientRect().bottom` comparado contra `innerHeight`; diferencia = 144

## SCEN-004: el panel usa el área que el dueño aprobó

Revisado el 2026-07-29 tras ver el panel con una cotización real: el dueño pidió
más área. Medido, 448 px partía en dos líneas 3 de las 4 filas de precios. El
tamaño sube a 544 × 704. Pasado 544 la columna de conversación se planta en
413 px (las burbujas topan al 85% y se ajustan a su contenido), así que más
ancho solo añade margen vacío — ese es el techo, no una preferencia.

**Given**: cualquiera de las marcas en escritorio con ventana de 1067 px de alto
**When**: el panel está abierto
**Then**: mide 544 px de ancho y 704 px de alto, y su borde superior queda a más de 24 px del tope del viewport
**Evidence**: `getBoundingClientRect` del panel: `width: 544`, `height: 704`, `top > 24`

## SCEN-008: la tabla de precios no parte ninguna fila

Es el observable que justifica el ancho. A 448 px se partían 3 de 4 filas y la
tabla medía 295 px en vez de 234.

**Given**: una cotización de 4 gamas, con la etiqueta más larga (`Camioneta Automática de Lujo (Gama LE)`) y su precio al lado
**When**: se rinde dentro de una burbuja del panel en escritorio
**Then**: las 4 filas ocupan una sola línea — todas la misma altura, ninguna por encima de 45 px
**Evidence**: altura de cada `.cc-quote-row` con `getBoundingClientRect`; no se puede comprobar en jsdom (no hay motor de maquetación), se verifica en navegador

## SCEN-005: en pantalla corta el panel se encoge, no desborda

**Given**: una ventana de 768 px de alto con tres filas visibles (el panel arranca a 204 px del fondo)
**When**: el panel está abierto
**Then**: el alto baja a 540 px en vez de mantener 640 y salirse por arriba; el borde superior nunca queda por encima de 24 px
**Evidence**: `getBoundingClientRect().top >= 24` tras redimensionar la ventana a 768 px de alto

## SCEN-006: la separación sigue al horario de WhatsApp

**Given**: el panel abierto en alquilatucarro con tres filas
**When**: WhatsApp sale de horario y su fila desaparece mientras el panel sigue abierto
**Then**: el panel baja exactamente una fila (60 px): de 204 px a 144 px del fondo
**Evidence**: valor de `--panel-lift` en el `style` inline del panel antes y después de quitar la fila

## SCEN-007: las tres copias del widget siguen en paridad

**Given**: los guardias de paridad existentes (`ChatWidget.shift.test.ts` SCEN-5/5a, `ChatWidget.burbuja-mission.test.ts` E10)
**When**: se aplica el cambio a los tres `ChatWidget.vue`
**Then**: siguen verdes sin añadir entradas a `DELTA_ALQUILAME` y sin tocar el literal `.contact-fab-stack { bottom: 1.5rem; }`
**Evidence**: salida de vitest de las suites de los tres paquetes
