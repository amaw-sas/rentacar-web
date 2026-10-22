---
name: barra-contacto-alquilame
created_by: claude
created_at: 2026-10-22T00:00:00Z
brand: alquilame
---

# Barra de contacto de alquilame: Chat IA, Llamar y WhatsApp a la vista

Solo alquilame.co. alquilatucarro y alquicarros no cambian.

Diseño visual aprobado por el dueño en el lienzo
https://claude.ai/artifact/8NAkeKvc1MjLcVwfEnyUhs (artboards **F** y **G** para
móvil, **«Computador · 3 botones flotantes con saludo»** para escritorio).

## Qué cambia para el cliente

Hoy alquilame muestra un solo círculo rojo abajo a la derecha. Al tocarlo se
despliega un menú con «Chat 24 horas» y «WhatsApp». No hay forma de llamar.

Después:

- **Móvil (< 768 px):** barra fija pegada al borde inferior, a lo ancho, con
  tres bloques iguales sin separación: **Chat IA** (violeta), **Llamar** (azul)
  y **WhatsApp** (verde). Icono arriba, texto abajo, ambos blancos.
- **Escritorio (≥ 768 px):** sin barra. Los tres botones flotan abajo a la
  derecha como píldoras en fila, mismos colores y mismo orden.
- **Saludo:** las dos burbujas blancas del teaser actual salen ENCIMA del
  botón Chat IA, con cola apuntando hacia él, la «×» en la primera y el contador
  sintético/real como insignia sobre el icono de Chat IA.
- **Texto 2 del saludo (solo alquilame):** «¿Dudas de requisitos o precios?
  Estamos en línea 24 horas.» El mismo texto se usa en el saludo del chat vacío
  (`ChatConversation`), que hoy repite las dos líneas del teaser.

No hay menú desplegable ni lanzador: los tres canales están siempre a un toque.

## Colores (contraste blanco ≥ 4,5:1 medido)

| Botón | Fondo | Texto/icono | Contraste |
|---|---|---|---|
| Chat IA | `#6D28D9` | blanco | 7,10 |
| Llamar | `#1D4ED8` | blanco | 6,70 |
| WhatsApp | `#14843F` | blanco | 4,77 |

`#14843F` mantiene el tono del verde de WhatsApp (`#25D366`, que con blanco da
1,98:1). El token existente `--color-whatsapp` NO cambia: lo usan otros CTA
con texto negro. Se agregan tokens nuevos en `theme.css` de alquilame.

## Reglas de visibilidad

| Canal | Se ve cuando | Fuente |
|---|---|---|
| Chat IA | `chatEnabled` (switch por marca del dashboard) | `useChatStatus` |
| WhatsApp | `whatsappVisible` (switch maestro + horario del dashboard) | `useChatStatus` |
| Llamar | **siempre** | igual que alquilatucarro, donde «Llámanos» no tiene `v-if` |

- Los bloques visibles se reparten el ancho en partes iguales (1, 2 o 3).
- Toda la superficie se oculta con el overlay de reserva abierto
  (`hideContactButtons`, sin cambio).
- `/chat` usa `layout: false`: la barra no aparece ahí (sin cambio).
- El teaser conserva todas sus reglas: 5 s / 20 s, supresión 15 días al
  cerrar o al usar cualquier canal, excluido en rutas del embudo de reserva,
  apagado si hay no leídos reales.

## Llamar

`tel:` con `useCallPhone()` (como alquilatucarro). alquilame no tiene plugin de
desvío de Google, así que resuelve a `franchise.phone` = `+57 300 243 6677`,
el mismo número del WhatsApp. `aria-label="Llamar al +57 300 243 6677"`. Al
tocarlo: `teaser.engage('llamada')` (el tipo ya existe).

## Arquitectura

Enfoque elegido: **rehacer la plantilla y el CSS de
`packages/ui-alquilame/app/components/ChatWidget.vue`, conservando su script.**

Se conserva sin tocar: `useChatStatus`, `useChatUnreadBadge`,
`useContactTeaser`, el panel inline de escritorio con su backdrop e `inert`,
Escape, `hideContactButtons`, la atribución de apertura
(`'unread_badge' | 'teaser' | 'fab'`; la etiqueta `'fab'` se mantiene para no
romper el KPI del tablero).

Se elimina: lanzador, `menuOpen`, `<ul id="contact-fab-menu">`,
`restoreFocusToLauncher`, `toggle`, el pulso de atención, el chip verde 24/7,
y el desplazamiento a la izquierda (`shiftLeft`, `isWideViewport`,
`data-shift-left` y su CSS), que el propio código marca inalcanzable
(`ChatWidget.vue:239-247`).

Cambia:

- **Ancla del panel de escritorio:** `chatPanelLiftPx` hoy mide el lanzador.
  Pasa a medir la fila de píldoras (`ref` sobre el `<nav>`), mismo
  `ResizeObserver`.
- **Ancla del panel, números:** la fila de píldoras queda en `bottom: 1.5rem`,
  así `FAB_STACK_BOTTOM_PX = 24` de `chatPanelLift.ts` sigue siendo cierto. El
  fallback CSS de `.chat-panel` pasa de `5.75rem` (lanzador de 56 px) a `5rem`
  (píldora 44 + 24 + 12 = 80 px).
- **Hueco inferior en móvil:** ya existe. El pie de `layouts/default.vue:250`
  (clase `pt-10 pb-40 md:py-10`) reserva `pb-40` en móvil para los canales
  flotantes. Se reemplaza por
  `pb-[calc(2.5rem+64px+env(safe-area-inset-bottom))]` (aire de 40 px + alto
  de la barra) con `md:pb-10` explícito, así en ≥ 768 px el pie no cambia; sin variable JS ni padding en `body`. El contenido intermedio
  pasa por debajo de la barra al hacer scroll, como cualquier barra inferior;
  lo que no puede quedar tapado es el final de la página.
- **Safe area:** la barra mide `calc(64px + env(safe-area-inset-bottom))`, en
  CSS puro (sin medir con JS, sin CLS).
- **CSS crítico:** `nuxt.config.ts:626-650` incrusta reglas de
  `.contact-fab-layer`, `.contact-fab-stack`, `> ul` y `> ul > li` para evitar
  CLS. Se conserva `.contact-fab-layer` y se reemplazan las demás por las de la
  barra móvil y la fila de píldoras.
- **Foco:** al cerrar el panel de escritorio (Escape, backdrop o «×» del
  panel) el foco vuelve al botón Chat IA. Reemplaza a
  `restoreFocusToLauncher`.
- **Analítica:** `plugins/contact-analytics.client.ts` ya registra cualquier
  clic en `a[href^="tel:"]` y en enlaces de WhatsApp. Llamar no agrega
  seguimiento propio; solo llama `teaser.engage('llamada')`.
- **Teléfono:** el `href` sale de `useCallPhone().telHref`, nunca de
  `franchise.phone` crudo (guardia SCEN-LINK-08 en `city-index-links.test.ts`).
- **Texto 2 del saludo por marca:** `chatGreeting.ts` sigue exportando
  `TEASER_LINE_2` (alquilatucarro y alquicarros sin cambio). Se agrega un
  override por marca en `app.config.ts` de alquilame
  (`chatGreeting.line2`). `ContactTeaserConfig` gana `line2?: string`
  (default `TEASER_LINE_2`) y `createContactTeaser` lo usa en el `aria-live`
  del paso 2. `useContactTeaser` lo lee con acceso opcional
  (`useAppConfig().chatGreeting?.line2`, tipado local
  `{ chatGreeting?: { line2?: string } }`), así las marcas sin la clave caen al
  default. `ChatWidget`/`ChatConversation` de alquilame lo leen igual para
  pintar. Sin `if (brand === 'alquilame')` en código compartido.

## Accesibilidad

- `<nav aria-label="Contacto">` con `<button>` (Chat IA) y `<a>` (Llamar,
  WhatsApp). Objetivos ≥ 44 px (bloques móviles 64 px; píldoras 44 px).
- Insignia `aria-hidden`; el conteo va en el `aria-label` de Chat IA
  («Chat IA, 2 mensajes nuevos»).
- Las regiones `aria-live` existentes se conservan.
- Con el panel abierto el fondo sigue `inert` (SCEN-322-X05).

## Radio de impacto

| Archivo | Cambio |
|---|---|
| `packages/ui-alquilame/app/components/ChatWidget.vue` | plantilla + CSS nuevos; script recortado |
| `packages/ui-alquilame/app/components/ChatConversation.vue` | línea 2 del saludo desde config |
| `packages/ui-alquilame/app/app.config.ts` | `chatGreeting.line2` |
| `packages/ui-alquilame/app/assets/css/theme.css` | tokens de los 3 colores |
| `packages/ui-alquilame/app/layouts/default.vue` | `pb-40` móvil del pie → alto de la barra |
| `packages/ui-alquilame/nuxt.config.ts` | CSS crítico de la barra y las píldoras |
| `packages/logic/src/composables/useContactTeaser.ts` | `line2` opcional en config (default = `TEASER_LINE_2`) |

Consumidores: `layouts/default.vue` monta `<LazyChatWidget />` (sin cambio en
el montaje). En runtime, alquilatucarro y alquicarros solo ven
`useContactTeaser.ts`, con un parámetro opcional cuyo default reproduce el
comportamiento actual.

## Tests y guardias afectados

| Test | Qué fija hoy | Destino |
|---|---|---|
| `ui-alquilame/app/components/__tests__/ChatWidget.launcher.test.ts` | el lanzador | se reemplaza por escenarios de la barra (SCEN-BC-01..05, 09, 10) |
| `ui-alquilame/app/components/__tests__/ChatWidget.inert.a11y.test.ts` | `inert` con panel abierto | se adapta: abre desde Chat IA, foco vuelve a Chat IA |
| `ui-alquilame/app/components/__tests__/ChatConversation.greeting.mount.test.ts` | texto del saludo | espera «…en línea 24 horas.» |
| `ui-alquilatucarro/app/components/__tests__/ChatWidget.shift.test.ts` SCEN-5a | alquilame = alquilatucarro línea a línea salvo el delta sin `tel:` | se elimina y se reemplaza solo por una guardia de bifurcación: alquilame declarado fork (tiene `<nav aria-label="Contacto">` y `tel:`). La paridad alquilatucarro↔alquicarros ya la cubre SCEN-5 (`ChatWidget.shift.test.ts:163-164`). Solo cambia el test, no el runtime de alquilatucarro |
| `ui-alquilatucarro/app/components/__tests__/ChatWidget.panel-clearance.test.ts` | en las 3 marcas: `<button ref="launcherEl"`, fallback `5.75rem` en `bottom` y en el techo de 52rem, `.contact-fab-stack { bottom: 1.5rem; }`; además aritmética compartida, guarda y `disconnect` del `ResizeObserver`, medir antes de abrir, ancho 34rem, panel tras el switch | alquilame sale solo de los 4 casos que fijan literales del lanzador (SCEN-BC-12, fork declarado); sus equivalentes (mide el `<nav>`, `bottom`/techo desde `--panel-lift`) van en `ChatWidget.bar.test.ts`. Los casos que siguen siendo ciertos conservan a alquilame. alquilatucarro y alquicarros sin cambio |
| `ui-alquicarros/app/components/__tests__/ChatWidget.fab-reservation.test.ts` | en las 3 marcas: clase `contact-fab-stack absolute right-6…`, gate `(chatEnabled \|\| whatsappVisible) && !hideContactButtons`, `'Abrir Chat 24 horas'`; además ocultar con el overlay, escritor de la bandera, «Abrir WhatsApp» | alquilame sale del caso de posición del stack y de las aserciones del gate y la etiqueta del lanzador (SCEN-BC-12); conserva overlay, `storeToRefs`, `hideContactButtons`, «Abrir WhatsApp» y el escritor propio. Su gate `v-if="!hideContactButtons"` lo fija `chat-fab-left-green.test.ts` |
| `ui-alquicarros/app/components/__tests__/ChatWidget.burbuja-mission.test.ts` | E10/E4: filas `<li v-if>`, `contact-fab-menu`, `<ul v-show="menuOpen">`, sin `fab-call` en alquilame; P386: pulso del lanzador; E1/E2/E3: teaser y switch | alquilame sale de E10 y P386 y de las aserciones de filas y menú de E4 (SCEN-BC-12); conserva E1, E2/E9, E3 y en E4 «Abrir WhatsApp», sin `role="menu"` y el arranque del teaser. `ChatWidget.bar.test.ts` fija que el pulso, el menú y `role="menu"` no vuelven |
| `ui-alquilame/tests/chat-fab-left-green.test.ts` SCEN-FAB1/2 | `contact-fab-menu`, `fab-label`, sin `fab-call`, `bottom: 1.5rem` | se reescribe para la barra: WhatsApp con `v-if="whatsappVisible"`, Llamar sin `v-if` (prueba de montaje: Llamar visible con chat y WhatsApp apagados), píldoras en `bottom: 1.5rem` |
| `ui-alquilame/app/components/home/__tests__/contact-announcement.test.ts:189-193` | widget sin `tel:` ni «Llámanos» | se invierte: el widget SÍ tiene `tel:` vía `useCallPhone` |
| `ui-alquilame/tests/whatsapp-green-token.test.ts:56-58` | `.fab-whatsapp { color: var(--color-whatsapp` | se cambia al token nuevo de fondo `#14843F` con texto blanco |
| `ui-alquilame/tests/perf-font-geometry.test.ts:87-90`, `chat-force-dark-optout.test.ts:39` | `contact-fab-layer fixed inset-0` y CSS crítico | `contact-fab-layer` se conserva; las reglas `ul` se cambian por las nuevas |
| `logic/tests/payload-bundle-contract.test.ts:60-64` | `v-if="chatEnabled && panelOpen"` + `defineAsyncComponent` | sin cambio: ambos se conservan |
| `ui-alquilame/app/layouts/__tests__/city-index-links.test.ts:106-112` SCEN-LINK-08 | ningún `tel:` con `franchise.phone` crudo | debe seguir verde (usar `useCallPhone`) |
| `logic` tests de `useContactTeaser` | texto del `aria-live` | se agrega caso: `line2` override cambia el anuncio; sin override = texto de hoy |

Regla: un test se reescribe solo cuando fija el lanzador que se elimina por
decisión del dueño. Nada se debilita para que pase; cada reescritura queda
atada a un SCEN-BC.

## Escenarios observables

- **SCEN-BC-01** Dado un móvil de 390 px con chat y WhatsApp encendidos, cuando
  carga la portada, entonces se ve una barra a lo ancho pegada abajo con Chat
  IA, Llamar y WhatsApp de igual ancho, en ese orden y con esos colores.
- **SCEN-BC-02** Dado un escritorio de 1280 px, cuando carga la portada,
  entonces no hay barra: tres píldoras en fila abajo a la derecha, mismos
  colores y orden.
- **SCEN-BC-03** Dado WhatsApp fuera de horario, cuando carga la página,
  entonces WhatsApp no se ve y Chat IA y Llamar se reparten el ancho; Llamar
  sigue visible.
- **SCEN-BC-04** Dado cualquier hora, cuando el cliente toca Llamar, entonces
  el enlace es `tel:+573002436677`.
- **SCEN-BC-05** Dado un móvil, cuando el cliente toca Chat IA, entonces
  navega a `/chat`; en escritorio se abre el panel inline sobre la página con el
  fondo `inert`.
- **SCEN-BC-06** Dado un visitante nuevo fuera del embudo, cuando pasan 5 s,
  entonces aparece la burbuja 1 sobre Chat IA con «×» e insignia; a los 20 s
  aparece la burbuja 2 con «…Estamos en línea 24 horas.».
- **SCEN-BC-07** Dado el chat vacío de alquilame, cuando se abre, entonces el
  segundo mensaje dice «…Estamos en línea 24 horas.»; en alquilatucarro y
  alquicarros sigue diciendo «…Estamos en línea.».
- **SCEN-BC-08** Dado un móvil con la barra visible, cuando el cliente baja al
  final de la página, entonces el borde inferior del último enlace del pie
  queda por encima del borde superior de la barra a 390 px, también con
  `safe-area-inset-bottom` > 0.
- **SCEN-BC-09** Dado el resumen de reserva abierto, cuando se muestra,
  entonces la barra/píldoras y el saludo no se ven; al cerrarlo vuelven.
- **SCEN-BC-10** Dado el saludo visible, cuando el cliente toca cualquiera de
  los tres canales, entonces el saludo se cierra y no vuelve en 15 días; cuando
  toca «×», se cierra y no vuelve en lo que queda de la visita (vuelve en la
  siguiente).
  _Enmienda 2026-10-22, decisión del dueño: la «×» conserva la regla de hoy de
  las 3 marcas (`dismiss()` no sella los 15 días). El texto original pedía 15
  días también para la «×»; describía mal el comportamiento existente._
- **SCEN-BC-11** Dado el sitio en producción, cuando se navega por portada,
  ciudad y resultados en móvil y escritorio, entonces cero errores de consola,
  cero peticiones fallidas y sin desbordamiento horizontal.
- **SCEN-BC-12** Dado alquilatucarro y alquicarros, cuando cargan, entonces su
  botón flotante y su saludo son idénticos a hoy.

- **SCEN-BC-13** Dado el panel de chat abierto en escritorio, cuando el
  cliente pulsa Escape o el fondo, entonces el panel se cierra y el foco queda
  en el botón Chat IA.

### Escenarios añadidos tras la revisión de calidad (2026-10-22)

- **SCEN-BC-14** Dado un móvil en la portada, cuando el cliente abre la lista
  de «Sede de recogida» (o cualquier slideover/modal) y baja a la última
  opción, entonces la lista queda por encima de la barra y del saludo, y
  tocar la última opción la elige; no llama, no abre WhatsApp ni el chat.
- **SCEN-BC-15** Dado un cliente que toca Llamar o WhatsApp en la barra o en
  las píldoras, cuando se registra el `contact_click`, entonces sale con
  `placement: 'fab'` en cualquier página (portada, categoría, reservado).
- **SCEN-BC-16** Dado una carga de página en móvil, cuando todavía no
  responde el estado del chat, entonces la barra no se pinta incompleta para
  luego reordenarse: aparece una sola vez con su composición final; si el
  estado no llega en 1,5 s aparece igual, con Llamar siempre presente.
- **SCEN-BC-17** Dado un escritorio de 1280–1700 px al final de la página,
  entonces las píldoras no tapan los créditos del pie.

## Fuera de alcance

- Botón «Llamar» en las otras marcas o número de desvío de Google en alquilame.
- Cambiar la etiqueta `'fab'` de atribución.
- Rediseñar el panel de chat o la página `/chat`.
