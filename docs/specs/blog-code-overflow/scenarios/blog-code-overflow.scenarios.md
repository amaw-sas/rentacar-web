---
name: blog-code-overflow
created_by: diego
created_at: 2026-08-24T00:00:00Z
---

# Una URL larga dentro de `code` ensancha el artículo entero

En `/blog/exenciones-pico-y-placa-bogota` de alquilame, el documento mide 570px
en un viewport de 412px. La página se arrastra de lado y el encabezado, el hero
y el texto quedan recortados por la izquierda.

Lo medido: dos `code` en línea del cuerpo del artículo —
`movilidadbogota.gov.co/web/SIMUR/excepciones/consulta` (524px) y
`alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=…` (414px)— dentro de una
columna de 380px. El chip se pinta `inline-block` con `overflow-wrap: normal`,
`word-break: normal` y `max-width: none`: una URL sin espacios es un solo token
y, si el navegador no puede partirlo, ensancha el documento hasta que quepa.

No viene del bloque de compartir: el build anterior (preview del PR #468, sin
ese bloque) mide los mismos 570px con los mismos dos `code`.

Se corrige en el CSS y no en el texto del artículo: el próximo redactor que
pegue una URL larga rompería la página otra vez.

## SCEN-001: el artículo no se arrastra de lado
**Given**: un lector en móvil (412px) en un artículo cuyo cuerpo trae una URL
larga dentro de `code`
**When**: la página termina de cargar
**Then**: el documento no es más ancho que el viewport — no hay desplazamiento
horizontal y ningún borde queda recortado
**Evidence**: `document.documentElement.scrollWidth === clientWidth` medido en
móvil real sobre `/blog/exenciones-pico-y-placa-bogota`

## SCEN-002: la URL sigue leyéndose, partida en varias líneas
**Given**: el mismo artículo
**When**: el lector llega al párrafo del enlace
**Then**: el chip de código cabe dentro de su párrafo y la URL se lee completa
repartida en varias líneas, no cortada ni tapada
**Evidence**: el rect del `code` no excede el rect de su `<p>`; captura móvil

## SCEN-003: cualquier token largo se parte, en las tres marcas
**Given**: alquilame, alquilatucarro y alquicarros
**When**: un artículo mete un token de 400px o más dentro de un `code` en línea
**Then**: el token se parte dentro del ancho disponible y el documento sigue
midiendo lo que el viewport
**Evidence**: inyección de un `code` sintético con una URL larga en el prose de
cada marca + `scrollWidth` antes y después

## SCEN-004: los bloques de código no cambian
**Given**: un artículo con un bloque `<pre><code>`
**When**: se pinta
**Then**: conserva su propio desplazamiento horizontal y sus líneas sin partir —
el arreglo no toca la lectura de código en bloque
**Evidence**: `overflow-x: auto` en `pre` y `overflow-wrap: normal` en
`pre code` según el estilo calculado

## SCEN-005: el texto corto dentro de `code` no se parte a mitad
**Given**: un `code` en línea que sí cabe en la columna (`bogota.gov.co`)
**When**: se pinta
**Then**: se lee en una sola línea, sin partirse
**Evidence**: el `code` corto ocupa una línea; su rect no supera al del párrafo
