---
name: contactanos-movil-alquilame
created_by: claude
created_at: 2026-10-22T23:00:00Z
brand: alquilame
supersedes_mobile_of: docs/specs/2026-10-22-barra-contacto-alquilame/design.md
---

# alquilame móvil: botón «Contáctanos» en vez de la barra de contacto

Solo alquilame.co y solo móvil (< 768 px). Escritorio, alquilatucarro y
alquicarros no cambian.

Diseño aprobado por el dueño el 2026-10-22 en el lienzo
https://claude.ai/artifact/8aEm1rJe8M8gbrGfqRQ3UW, artboards
«C2 · «Contáctanos» · cerrado» y «C2 · «Contáctanos» · abierto».

## Por qué

La barra de PR #525 (64 px a todo lo ancho, tres bloques de color + dos burbujas
de saludo) satura la pantalla del celular. El dueño eligió un solo botón que
despliega los canales.

## Qué ve el cliente en el celular

- **Cerrado:** píldora verde (`#14843F`, texto e icono blancos, 50 px de alto)
  abajo a la derecha, a 16 px de los bordes (+ safe area inferior). Icono de chat
  + texto «Contáctanos». La insignia roja de no leídos / contador sintético va en
  su esquina superior derecha.
- **Saludo:** UNA burbuja blanca encima del botón, alineada a la derecha, con
  cola hacia el botón y la «×»: «¡Hola! ¿Dudas? Estamos en línea 24 horas.»
  Sale con el mismo temporizador del teaser (5 s). La segunda burbuja no existe
  en móvil. Tocar la burbuja abre el chat (`source: 'teaser'`); la «×» la cierra
  hasta la próxima visita (regla de SCEN-BC-10, sin cambio).
- **Abierto (tras tocar «Contáctanos»):** el botón pasa a «× Cerrar» (mismo
  verde). Encima, alineadas a la derecha y apiladas con 10 px de separación,
  salen las opciones: píldoras blancas de 44 px, borde `#E5E7EB`, texto
  `#111827`, y a la izquierda un círculo de 30 px con el icono blanco sobre el
  color del canal: Chat IA `#6D28D9`, Llamar `#1D4ED8`, WhatsApp `#14843F`.
  Orden de arriba abajo: Chat IA, Llamar, WhatsApp.
- **Cierre del menú:** «× Cerrar», toque fuera del menú, Escape, o elegir una
  opción. Sin fondo oscuro. Abrir el menú oculta el saludo para la sesión
  mientras está abierto (ver SCEN-CM-08).
- **Opciones:** misma lógica de hoy. Chat IA → `/chat` (`source: 'fab'` o
  `'unread_badge'`); Llamar → `tel:` de `useCallPhone`; WhatsApp → wa.me en
  pestaña nueva. Llamar y WhatsApp llaman `teaser.engage(...)` (supresión 15 d).
- **Visibilidad por canal (sin cambio):** Chat IA con `chatEnabled`; WhatsApp con
  `whatsappVisible`; Llamar siempre. El botón «Contáctanos» existe siempre que
  la superficie es visible (Llamar nunca falta).

## Lo que se conserva de PR #525

- Escritorio (≥ 768 px): tres píldoras de color en fila, saludo de dos burbujas,
  panel inline, inert, foco. Sin cambios.
- Ocultar toda la superficie con el resumen de reserva abierto y mientras hay
  una capa modal de reka real (SCEN-BC-14, guardia de lock pegado).
- Primera pintura única tras `chatStatusResolved` o 1,5 s (SCEN-BC-16).
- `data-analytics-placement="fab"` sobre el contenedor de las opciones
  (SCEN-BC-15).
- El chat vacío (`/chat`, `ChatConversation`) sigue con sus dos líneas, la
  segunda «…Estamos en línea 24 horas.» (SCEN-BC-07).

## Escenarios (holdout)

- **SCEN-CM-01** Dado un móvil de 390 px en la portada con chat y WhatsApp
  encendidos, cuando la superficie aparece, entonces se ve UN botón verde
  «Contáctanos» abajo a la derecha (alto ≤ 52 px, ancho ≤ 160 px, borde derecho a
  16 px), no hay barra a lo ancho y Chat IA, Llamar y WhatsApp no están visibles.
  **Evidencia:** DOM/medidas en el navegador y mount test.
- **SCEN-CM-02** Dado el botón cerrado, cuando el cliente lo toca, entonces
  `aria-expanded="true"`, el texto pasa a «Cerrar» y aparecen encima tres
  opciones blancas en orden Chat IA, Llamar, WhatsApp, cada una ≥ 44 px de alto,
  con su círculo de color. **Evidencia:** mount test + captura.
- **SCEN-CM-03** Dado WhatsApp fuera de horario, cuando se abre el menú, entonces
  solo salen Chat IA y Llamar; con el chat apagado salen Llamar (y WhatsApp si
  está en horario); con ambos apagados, solo Llamar. **Evidencia:** mount tests.
- **SCEN-CM-04** Dado el menú abierto, cuando el cliente toca Llamar, entonces el
  enlace es `tel:+573002436677`, se registra la supresión de 15 días y el menú se
  cierra. Igual con WhatsApp (`https://wa.me/573002436677`, pestaña nueva).
  **Evidencia:** mount test con el `teaser` real.
- **SCEN-CM-05** Dado el menú abierto en móvil, cuando el cliente toca Chat IA,
  entonces navega a `/chat` con fuente `fab` (o `unread_badge` si hay no leídos)
  y el menú se cierra. **Evidencia:** mount test.
- **SCEN-CM-06** Dado el menú abierto, cuando el cliente toca «Cerrar», pulsa
  Escape o toca fuera del menú, entonces el menú se cierra; con «Cerrar» y Escape
  el foco queda en el botón «Contáctanos». **Evidencia:** mount test + navegador.
- **SCEN-CM-07** Dado un visitante nuevo en móvil fuera del embudo, cuando pasan
  5 s, entonces sale UNA burbuja «¡Hola! ¿Dudas? Estamos en línea 24 horas.»
  encima del botón (sin solaparlo ni salirse de la pantalla a 320 px) y nunca una
  segunda burbuja; tocarla abre el chat con fuente `teaser`; la «×» la cierra
  para la sesión. El texto anunciado al lector de pantalla es el mismo.
  **Evidencia:** mount test con reloj falso + captura.
- **SCEN-CM-08** Dado el saludo visible, cuando el cliente abre el menú, entonces
  el saludo se oculta mientras el menú está abierto. Si elige un canal, cuenta
  como interacción con el saludo (`contact_teaser_engaged`, 15 días); si cierra
  el menú sin elegir, el saludo queda descartado para la sesión, igual que con la
  «×». **Evidencia:** mount test con el `teaser` real y sus eventos.
  *(Enmienda 2026-10-23 tras la revisión: llamar `dismiss()` al abrir registraba
  «descartado» aunque el cliente terminara escribiendo por WhatsApp.)*
- **SCEN-CM-08b** Dado un móvil, cuando pasan 25 s sin tocar nada, entonces no
  hay segundo paso del saludo: ni evento `contact_teaser_shown {step: 2}` ni
  insignia «2». **Evidencia:** mount test con reloj falso.
- **SCEN-CM-09** Dado 2 mensajes sin leer del chat, cuando se ve el botón
  cerrado, entonces lleva la insignia «2» y su nombre accesible es
  «Contáctanos, 2 mensajes nuevos». **Evidencia:** mount test.
- **SCEN-CM-10** Dado un escritorio de 1280 px, cuando carga la portada, entonces
  se ve exactamente lo de PR #525: tres píldoras de color, dos burbujas, panel
  inline al tocar Chat IA; no existe el botón «Contáctanos».
  **Evidencia:** navegador + los tests de escritorio existentes en verde.
- **SCEN-CM-11** Dado el resumen de reserva abierto, o la lista de sedes
  abierta, cuando se muestra, entonces no hay botón ni menú encima; al cerrarla
  el botón vuelve. Con `body{pointer-events:none}` pegado y sin capa, el botón
  sigue visible y usable. **Evidencia:** mount tests + navegador.
- **SCEN-CM-12** Dado un toque en Llamar o WhatsApp dentro del menú, cuando el
  plugin de analítica registra `contact_click`, entonces `placement` es `fab`.
  **Evidencia:** mount test con el handler real.
- **SCEN-CM-13** Dado un móvil de 390 px al final de la página, cuando el botón
  cerrado está visible, entonces no tapa ningún enlace del pie.
  **Evidencia:** medidas en el navegador.
- **SCEN-CM-14** Dado el chat apagado por el dashboard con el foco en Chat IA del
  menú, cuando llega el cambio, entonces Chat IA desaparece y el foco pasa a
  Llamar (no cae a `<body>`). **Evidencia:** mount test.
- **SCEN-CM-15** Dado la versión de prueba, cuando se navega portada, ciudad y
  reservas en móvil y escritorio, entonces 0 errores de consola, sin
  desbordamiento horizontal, CLS de la portada móvil ≤ el de producción.
  **Evidencia:** Playwright/Orca sobre el preview.
- **SCEN-CM-16** Dado alquilatucarro y alquicarros, cuando cargan, entonces su
  lanzador y sus tests no cambian. **Evidencia:** suites de las 3 marcas.

## Archivos afectados (radio de impacto)

| Archivo | Cambio |
|---|---|
| `packages/ui-alquilame/app/components/ChatWidget.vue` | botón «Contáctanos» + menú en móvil; escritorio intacto |
| `packages/logic/src/composables/useContactTeaser.ts` | opción aditiva `maxStep` en `start()` (por defecto 2; las otras marcas no cambian) |
| `packages/ui-alquilame/app/app.config.ts` | `chatGreeting.mobileLine` con el texto corto |
| `packages/ui-alquilame/nuxt.config.ts` | bloque crítico `contact-surface` para el botón móvil |
| `packages/ui-alquilame/app/layouts/default.vue` | relleno inferior del pie en móvil acorde al botón |
| `packages/ui-alquilame/app/components/__tests__/ChatWidget.bar.test.ts` | escenarios móviles de la barra reemplazados por SCEN-CM; los de escritorio siguen |
| guardas de fuente que fijan la barra móvil (`tests/chat-fab-left-green.test.ts`, `contact-announcement.test.ts`, `ChatWidget.inert.a11y.test.ts` y los cruzados de alquilatucarro/alquicarros) | actualizar solo las aserciones de la barra móvil de alquilame |

Fuera de alcance: escritorio, copia del chat vacío, otras marcas, nuevo evento
de analítica de apertura de menú.
