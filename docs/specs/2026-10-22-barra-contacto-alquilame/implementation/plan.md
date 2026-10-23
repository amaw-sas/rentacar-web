# Plan de implementación — barra de contacto de alquilame

Creado: 2026-10-22 · Spec: `../design.md` (commit `8cc4f95`, aprobada por el dueño).
Rama: `diego-alex-melo/quiero-cambiar-el-boton-de-contacto-solo-en-alquilame.co` (worktree).

Clarificación, investigación y diseño ya están cerrados en `../design.md`, con el
diseño visual aprobado en https://claude.ai/artifact/8NAkeKvc1MjLcVwfEnyUhs. Este
plan solo ordena la construcción.

## Mapa de archivos

| Archivo | Responsabilidad única | Paso |
|---|---|---|
| `packages/logic/src/composables/useContactTeaser.ts` | `line2?` en `ContactTeaserConfig`; lo usa el `aria-live` del paso 2; `useContactTeaser` lo lee de `useAppConfig().chatGreeting?.line2` | 1 |
| `packages/logic/src/composables/__tests__/useContactTeaser.test.ts` | caso override y caso default | 1 |
| `packages/ui-alquilame/app/app.config.ts` | `chatGreeting.line2` = «¿Dudas de requisitos o precios? Estamos en línea 24 horas.» | 2 |
| `packages/ui-alquilame/app/components/ChatConversation.vue` | pinta la línea 2 desde config (fallback `TEASER_LINE_2`) | 2 |
| `packages/ui-alquilame/app/assets/css/theme.css` | tokens `--color-contact-chat` `#6d28d9`, `--color-contact-call` `#1d4ed8`, `--color-contact-whatsapp` `#14843f` | 3 |
| `packages/ui-alquilame/app/components/ChatWidget.vue` | superficie de contacto: barra móvil / píldoras escritorio + teaser + panel | 3, 4, 5 |
| `packages/ui-alquilame/app/layouts/default.vue` | hueco inferior del pie en móvil | 6 |
| `packages/ui-alquilame/nuxt.config.ts` | CSS crítico de la superficie | 6 |
| Tests listados en `../design.md` § «Tests y guardias afectados» | cada uno en el paso que toca lo que fija | 2–6 |

`ChatWidget.vue` se queda como un solo archivo: el script (teaser, no leídos,
panel, inert) es un único estado y partirlo es el enfoque 2 que se descartó.

## Pasos

1. Override de la línea 2 en lógica compartida | S | Depende: —
2. Texto «24 horas» en alquilame (config + chat vacío) | S | Depende: 1
3. Barra móvil con 3 canales (sustituye lanzador y menú) | M | Depende: 2
4. Píldoras de escritorio + ancla del panel + retorno de foco | M | Depende: 3
5. Saludo sobre Chat IA con insignia | M | Depende: 4
6. Hueco del pie + CSS crítico | S | Depende: 3
7. Regresión completa de las 3 marcas | S | Depende: 1–6
8. QA en navegador real (local + preview Vercel) | M | Depende: 7
9. Revisión por agentes de calidad y PR | S | Depende: 8

Cada paso sigue SDD: escenario → test que falla → código → verde → refactor.
Ningún test se debilita; un test se reescribe solo si fija el lanzador eliminado,
y la reescritura queda atada a un SCEN-BC.

## Chunk 1: Texto del saludo

### Paso 1 — `line2` opcional en el teaser (S)

Cliente lector de pantalla en alquilame oye «…Estamos en línea 24 horas.» cuando
sale la burbuja 2; en las otras marcas oye el texto de hoy.

- Test primero en `packages/logic/src/composables/__tests__/useContactTeaser.test.ts`:
  `createContactTeaser({ ..., line2: 'X' })` → tras el
  paso 2, `teaserAnnounce` termina en `X`. Sin `line2` → igual a hoy
  (`${TEASER_LINE_1_PLAIN} ${TEASER_LINE_2}`).
- Código: campo opcional en `ContactTeaserConfig`; `useContactTeaser` lo toma
  con acceso opcional tipado localmente.
- [ ] Test override + test default escritos y rojos antes del código.
- [ ] Código.
- [ ] Aceptación: `pnpm --filter @rentacar-main/logic test` verde, incluido el
  nuevo; `pnpm --filter @rentacar-main/logic exec tsc --noEmit` sin errores
  (logic no tiene script `typecheck`; si el comando no aplica, `pnpm typecheck`
  de la raíz cubre a los consumidores `ui-*`).

### Paso 2 — «24 horas» en alquilame (S) · SCEN-BC-07

Cliente abre el chat vacío en alquilame → el segundo mensaje dice «…Estamos en
línea 24 horas.»; en alquilatucarro y alquicarros sigue «…Estamos en línea.».

- Test primero: `ui-alquilame/.../ChatConversation.greeting.mount.test.ts`
  espera el texto nuevo (rojo antes del cambio). Los greeting tests de las otras
  dos marcas no se tocan y siguen verdes.
- Código: clave en `app.config.ts`; `ChatConversation.vue` la lee con fallback.
- [ ] Test rojo → código → verde.
- [ ] Aceptación: los 3 greeting tests verdes;
  `packages/ui-alquilatucarro/app/components/__tests__/ChatConversation.parity.test.ts`
  verde (su línea 44 ya declara a alquilame como fork).

## Chunk 2: Superficie de contacto

### Paso 3 — barra móvil (M) · SCEN-BC-01, 03, 04, 05 (móvil), 09, 10 (canales)

Cliente en móvil ve abajo Chat IA (violeta), Llamar (azul) y WhatsApp (verde),
iguales y blancos; toca Chat IA → `/chat`; toca Llamar → `tel:+573002436677`;
WhatsApp fuera de horario → desaparece y los otros dos se reparten el ancho;
resumen de reserva abierto → nada se ve.

- Tests primero (mount, viewport < 768): reemplazan
  `ChatWidget.launcher.test.ts`. Casos: orden y colores; con
  `whatsappVisible=false` hay 2 bloques; con chat y WhatsApp apagados Llamar
  sigue visible; `href` de Llamar = `useCallPhone().telHref`; clic en Chat IA →
  `navigateTo('/chat')` y `prepareChatOpen('fab')`; clic en cualquier canal →
  `teaser.engage(<canal>)`; `reservationOverlayOpen=true` → superficie ausente.
- Guardias reescritas en el mismo paso, cada una contra su escenario:
  `chat-fab-left-green.test.ts`, `contact-announcement.test.ts:189-193`
  (ahora exige `tel:` vía `useCallPhone`), `whatsapp-green-token.test.ts`
  (token nuevo con blanco), `ChatWidget.shift.test.ts` SCEN-5a → guardia de
  bifurcación. `city-index-links.test.ts` SCEN-LINK-08 sin cambios y verde.
- Código: tokens en `theme.css`; plantilla nueva con
  `<nav aria-label="Contacto">`; se eliminan lanzador, menú, `menuOpen`,
  `toggle`, `restoreFocusToLauncher`, pulso, chip, `shiftLeft`/`isWideViewport`/
  `data-shift-left` y su CSS. Alto `calc(64px + env(safe-area-inset-bottom))`.
  En este mismo paso, para no dejar roto el panel de escritorio entre pasos:
  `ref="launcherEl"` (y su `ResizeObserver`) pasa al `<nav>`, y el foco de
  `closeAll` vuelve al botón Chat IA (sustituye a `launcherEl.focus()`).
  `nuxt.config.ts` NO se toca aquí: `perf-font-geometry.test.ts:90` sigue
  exigiendo `.contact-fab-stack` hasta el paso 6, así que la clase se conserva.
- [ ] Tests de montaje de la barra rojos → código → verdes.
- [ ] Guardia `chat-fab-left-green.test.ts` reescrita (SCEN-BC-03/04).
- [ ] Guardia `contact-announcement.test.ts:189-193` invertida (SCEN-BC-04).
- [ ] Guardia `whatsapp-green-token.test.ts` al token `#14843F` (SCEN-BC-01).
- [ ] `ChatWidget.shift.test.ts` SCEN-5a → guardia de bifurcación.
- [ ] `ChatWidget.shift.test.ts` SCEN-5 (paridad alquilatucarro↔alquicarros)
  sigue verde en el mismo archivo.
- [ ] Aceptación: todos los tests de `ui-alquilame` verdes; `payload-bundle-contract`
  verde (se conservan `v-if="chatEnabled && panelOpen"` y `defineAsyncComponent`).

### Paso 4 — píldoras de escritorio (M) · SCEN-BC-02, 05 (escritorio), 13

Cliente en escritorio ve tres píldoras abajo a la derecha, sin barra; toca Chat
IA → panel inline con fondo `inert`; Escape o fondo → panel cerrado y foco en
Chat IA.

- Tests primero (viewport ≥ 768): no hay barra a lo ancho; píldoras en orden;
  Chat IA abre el panel; `inert` en `#__nuxt` mientras está abierto; Escape →
  `document.activeElement` es Chat IA. Se adapta `ChatWidget.inert.a11y.test.ts`.
- Código: misma plantilla, estilos por media query (el `ref` y el foco ya
  vienen del paso 3); fila en `bottom: 1.5rem`; fallback de `.chat-panel`
  `5rem`.
- [ ] Tests rojos → código → verdes.
- [ ] Aceptación: tests verdes; `chatPanelLift` tests verdes sin cambios.

### Paso 5 — saludo sobre Chat IA (M) · SCEN-BC-06, 10

Visitante nuevo fuera del embudo → a los 5 s la burbuja 1 sale sobre Chat IA con
«×» e insignia; a los 20 s la burbuja 2 «…24 horas.»; «×» o cualquier canal →
no vuelve en 15 días.

- Tests primero (fake timers): burbuja anclada al bloque/píldora Chat IA;
  insignia dentro de Chat IA y `aria-label` «Chat IA, N mensajes nuevos»;
  «×» → `teaser.dismiss()`; ruta del embudo → sin burbuja; no leído real →
  manda el conteo real.
- Código: `teaser-slot` reubicado sobre Chat IA (izquierda en móvil, sobre la
  primera píldora en escritorio), cola hacia el botón; se conserva el
  `teaser-sizer` para no mover geometría.
- [ ] Tests rojos → código → verdes.
- [ ] Aceptación: tests verdes; sin cambios en `useContactTeaser` aparte del paso 1.

### Paso 6 — hueco del pie y CSS crítico (S) · SCEN-BC-08

Cliente en móvil baja al final → el último enlace legal queda encima de la barra.

- Tests primero: `perf-font-geometry.test.ts` y
  `chat-force-dark-optout.test.ts` actualizados a las reglas nuevas
  (`.contact-fab-layer` se conserva). Guardia de fuente: el pie de
  `default.vue` lleva `pb-[calc(2.5rem+64px+env(safe-area-inset-bottom))]` y
  `md:pb-10`.
- Código: `default.vue:250`; `nuxt.config.ts:626-650`.
- [ ] Tests rojos → código → verdes.
- [ ] Aceptación: tests verdes. La medición real del borde se hace en el paso 8.

## Chunk 3: Verificación y entrega

### Paso 7 — regresión de las 3 marcas (S) · SCEN-BC-12

- [ ] `pnpm exec vitest run` desde la raíz (el `vitest.config.ts` raíz declara
  los proyectos de las 3 apps + logic). Repetir una vez si hay un rojo por carga.
- [ ] `pnpm lint` y `pnpm typecheck` desde la raíz.
- [ ] `pnpm --filter ui-alquilame build`, `pnpm --filter ui-alquilatucarro build`,
  `pnpm --filter ui-alquicarros build` (cada uno usa `--dotenv ../../.env.prod`;
  si el worktree no tiene ese archivo, ver Prerrequisitos).
- [ ] Aceptación: 0 fallos, 0 omitidos nuevos; build exit 0 en las 3; `git diff
  --stat` sin archivos de `ui-alquilatucarro`/`ui-alquicarros` salvo las cuatro
  guardias cruzadas que fijaban el lanzador de alquilame (SCEN-BC-12, ver tabla
  de `../design.md`): `ChatWidget.shift.test.ts`,
  `ChatWidget.panel-clearance.test.ts` (ui-alquilatucarro),
  `ChatWidget.fab-reservation.test.ts` y `ChatWidget.burbuja-mission.test.ts`
  (ui-alquicarros). Solo cambian tests, nunca el runtime de esas marcas.

### Paso 8 — QA en navegador real (M) · SCEN-BC-01..13 en runtime, SCEN-BC-11

- Orca embedded browser (`orca goto/snapshot/console/network/screenshot`),
  primero `pnpm dev` de alquilame, luego preview de Vercel.
- 390 px y 1280 px en portada, ciudad, resultados y una página del blog:
  colores, orden, `tel:`, `/chat`, panel, Escape, saludo 5 s/20 s, overlay de
  reserva abierto → superficie oculta y vuelve al cerrar (SCEN-BC-09), fuera de
  horario (simulado con mock de red de la respuesta de estado).
- SCEN-BC-08 medido: `lastFooterLink.getBoundingClientRect().bottom <
  bar.getBoundingClientRect().top`. Sin desbordamiento:
  `documentElement.scrollWidth === innerWidth`.
- alquilatucarro y alquicarros: el botón flotante y el saludo como en
  producción (SCEN-BC-12 en runtime).
- Pase exploratorio con el playbook `agent-browser skills get dogfood`.
- [ ] Aceptación: 13/13 escenarios observados; 0 errores de consola; 0 peticiones
  fallidas; capturas guardadas.

### Paso 9 — agentes de calidad y PR (S)

- code-reviewer, edge-case-detector, performance-engineer y code-simplifier
  sobre el diff; se corrige lo confirmado y se repite el paso 7.
- `/verification-before-completion`, commits convencionales, PR con
  `/pull-request`. Sin `git push` hasta que el dueño lo autorice.
- [ ] Aceptación: hallazgos resueltos o justificados por escrito; PR abierto con
  evidencia del paso 8.

## Prerrequisitos

- `node_modules` instalados en el worktree; `.env` del worktree según la nota de
  entorno (claves vía MCP de Supabase si faltan).
- `.env.prod` en la raíz del worktree para los builds del paso 7 (se pide al
  dueño o se copia del checkout principal con su permiso; nunca se lee ni se
  publica su contenido).
- Para preview de Vercel: `vercel link` + `vercel deploy` (sin push).

## Riesgos

| Riesgo | Mitigación |
|---|---|
| La barra tapa un CTA fijo de alguna página no revisada | paso 8 recorre portada, ciudad, resultados y blog a 390 px |
| `env(safe-area-inset-bottom)` dentro de `calc` en clase arbitraria de Tailwind | test de fuente + medición en paso 8 |
| Rojos fantasma de vitest por carga | correr desde la raíz y repetir antes de tratar un rojo como real |
| Guardias de fuente que leen comentarios | no dejar en comentarios cadenas que las guardias prohíben (`fab-call`, `tel:` crudo) |

## Despliegue y vuelta atrás

- Despliegue: merge a `main` → Vercel producción de alquilame.
- Monitoreo: clics `telephone` y `whatsapp` del plugin de analítica, fuente
  `'fab'`/`'teaser'` de apertura del chat; comparar 7 días contra los 7 previos.
- Vuelta atrás: revertir el commit del merge; no hay migraciones ni datos.
