---
name: blog-breadcrumb-overflow
created_by: diego
created_at: 2026-08-24T00:00:00Z
---

# La miga de pan del artículo arrastra la página en alquilatucarro

Tercer desbordamiento del blog. En `/blog/alquilar-carro-bogota-guia` de
alquilatucarro el documento mide 459px en un viewport de 412.

## Lo que NO es: las tablas

La primera lectura culpó a las tablas de precios porque sus celdas pintan hasta
447px. Es una lectura falsa: las celdas viven dentro del envoltorio de Nuxt UI
(`div.relative.my-5.overflow-x-auto`), que ya las desplaza, y el rect de una
celda dentro de un contenedor con scroll siempre reporta su posición de
maquetación, no un desbordamiento de página.

Medido, ocultando cada sospechoso por separado:

| Estado | Ancho del documento |
|---|---|
| Página tal cual | 459px |
| Sin las tablas | 459px |
| Sin la miga de pan | **412px** |

Y con la tabla de 4 columnas: el envoltorio ya desplazaba (`clientW 380`,
`scrollW 420`) y la última columna («Mensual») ya se alcanzaba. Las tablas no
tienen nada que arreglar.

## Lo que sí es

La miga de pan es un `<ol class="flex items-center gap-2">` con tres tramos:
Inicio, Blog y el título del artículo en
`<span class="truncate max-w-xs">`. El recorte es de 320px fijos, no «lo que
sobre»: sumado a los dos primeros tramos y sus separadores, la fila pide 459px.
Los `<li>` tampoco pueden encogerse porque un elemento flex nace con
`min-width: auto`.

Las otras dos marcas no tienen miga de pan en el detalle del blog.

## SCEN-001: el artículo de alquilatucarro no arrastra la página
**Given**: un lector en móvil (412px) en `/blog/alquilar-carro-bogota-guia` de
alquilatucarro
**When**: la página termina de cargar
**Then**: el documento no es más ancho que el viewport
**Evidence**: `document.documentElement.scrollWidth === clientWidth`

## SCEN-002: la miga sigue diciendo dónde está el lector
**Given**: la misma pantalla
**When**: el lector mira la miga de pan
**Then**: ve «Inicio › Blog › » y el título recortado con puntos suspensivos —
los tres tramos presentes, en una sola línea, sin salirse
**Evidence**: los tres `li` visibles dentro del ancho del `nav`; el `span` del
título con `text-overflow: ellipsis` y ancho menor al que pide su texto

## SCEN-003: el recorte se adapta al ancho disponible
**Given**: un título largo y otro corto
**When**: se pintan en la misma miga
**Then**: el corto se lee completo y el largo se recorta justo donde termina el
espacio, no en un tope fijo de 320px
**Evidence**: el `span` mide menos de 320px en un viewport de 412 y crece con el
viewport

## SCEN-004: en escritorio se lee el título completo
**Given**: un lector en 1440px
**When**: abre el mismo artículo
**Then**: la miga muestra el título sin recortar y sin desbordar
**Evidence**: `scrollWidth === clientWidth` del documento a 1440px y el `span`
sin recorte

## SCEN-005: los enlaces de la miga siguen funcionando
**Given**: la miga en móvil
**When**: el lector toca «Inicio» o «Blog»
**Then**: navega a `/` y a `/blog`
**Evidence**: los `href` intactos y navegación real en el navegador
