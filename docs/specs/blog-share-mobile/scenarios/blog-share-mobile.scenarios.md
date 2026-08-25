---
name: blog-share-mobile
created_by: diego
created_at: 2026-08-24T00:00:00Z
---

# El compartir del blog deja de esconderse detrás del FAB de contacto

En móvil, el artículo del blog monta una píldora flotante de compartir en
`fixed bottom-4 left-1/2 z-40`. El stack de contacto (chat + WhatsApp) vive en
otra capa fija, `z-[60]`, anclada a `right-6 / bottom: 1.5rem`, y sus etiquetas
("Chat 24 horas", "WhatsApp") se extienden hasta media pantalla. Los dos últimos
botones de la píldora —X y copiar enlace— quedan tapados y sin toque.

Subir la píldora unos píxeles no arregla nada: el FAB de WhatsApp aparece y
desaparece según el horario del dashboard, así que el stack mide una o dos filas
según la hora del día. Cualquier offset fijo acierta media jornada.

La píldora flotante se retira. El compartir de móvil pasa al final del artículo,
donde nada fijo puede caerle encima, y usa la hoja nativa del sistema cuando el
navegador la trae.

## SCEN-001: nada de compartir flota sobre el artículo
**Given**: un lector en móvil (<1024px) en cualquier artículo del blog de las
tres marcas
**When**: recorre el artículo de arriba a abajo
**Then**: ningún control de compartir se superpone al contenido ni a los botones
de contacto — no existe capa fija de compartir en la página
**Evidence**: ausencia de `fixed bottom-4 left-1/2` en los tres
`app/pages/blog/[...slug].vue`; captura de móvil real con el pie del artículo a
la vista

## SCEN-002: el compartir aparece donde se termina de leer
**Given**: el mismo lector en móvil
**When**: llega al final del texto del artículo (después de las preguntas
frecuentes, antes de la bio del autor)
**Then**: encuentra un bloque de compartir en el flujo de la página, con todos
sus botones visibles y tocables
**Evidence**: DOM del artículo + captura móvil + toque real sobre el botón

## SCEN-003: un toque abre la hoja nativa del teléfono
**Given**: un navegador móvil con `navigator.share` (Chrome/Safari en Android e
iOS)
**When**: el lector toca "Compartir"
**Then**: se abre la hoja del sistema con el título del artículo y su enlace, ya
lista para WhatsApp, Telegram o lo que el lector tenga instalado
**Evidence**: `navigator.share` recibe `{ title, text, url }` con el título del
post y la URL canónica (test unitario con doble) + hoja nativa en móvil real

## SCEN-004: cancelar la hoja nativa no ensucia nada
**Given**: la hoja nativa abierta
**When**: el lector la cierra sin compartir (el navegador rechaza con
`AbortError`)
**Then**: la página sigue como estaba y la consola queda limpia
**Evidence**: consola sin errores tras cancelar; test unitario que rechaza con
`AbortError` y comprueba que no se registra error

## SCEN-005: sin hoja nativa, siguen los botones de siempre
**Given**: un navegador sin `navigator.share` (Firefox de escritorio, ventana
angosta) y el HTML servido por ISR antes de hidratar
**When**: se pinta el bloque de compartir
**Then**: aparecen WhatsApp, Facebook y X, y cada uno abre su destino con el
enlace del artículo
**Evidence**: render con `navigator.share` ausente → tres destinos con la URL del
post; `window.open` recibe `wa.me`, `facebook.com/sharer` y `twitter.com/intent`

## SCEN-006: el enlace que se comparte es el canónico, sin rastros de campaña
**Given**: un lector que llegó al artículo desde un anuncio, con `?utm_source=…`
en la barra de direcciones
**When**: comparte el artículo por cualquiera de las vías
**Then**: el destinatario recibe la URL limpia del artículo, no la del anuncio
**Evidence**: la URL compartida es `{franchise.website}/blog/{slug}` sin query

## SCEN-007: copiar el enlace sigue confirmando que copió
**Given**: el bloque de compartir
**When**: el lector toca "Copiar enlace"
**Then**: el portapapeles queda con la URL del artículo y el botón confirma
durante dos segundos
**Evidence**: `navigator.clipboard.writeText` con la URL canónica + estado
`linkCopied` en true y de vuelta a false a los 2000 ms

## SCEN-008: el escritorio no se entera
**Given**: un lector en ≥1024px
**When**: abre el artículo
**Then**: ve el bloque de compartir del sidebar exactamente como antes, y no ve
el bloque de móvil
**Evidence**: el bloque `hidden lg:block` del sidebar intacto; el nuevo bloque
lleva `lg:hidden`; captura de escritorio

## SCEN-009: las tres marcas se comportan igual
**Given**: alquilame, alquilatucarro y alquicarros
**When**: se compara el artículo en móvil
**Then**: las tres tienen el mismo bloque al final y ninguna conserva la píldora
flotante
**Evidence**: guarda de source por paquete + captura por marca
