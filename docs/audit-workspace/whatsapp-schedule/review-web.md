# Revisión adversarial — `diego-alex-melo/whatsapp-schedule-web`

**Commit:** `6df6402` · **Repo:** rentacar-web · **Worktree:** `whatsapp-schedule-web`
**Fecha:** 2026-07-21 · **Revisor:** agente fresco (sin contexto del implementador)
**Postura:** refutar, no validar. Todo lo que sigue lo ejecuté yo mismo.
**Estabilidad:** el barrido de husos, el contrato de producción, los md5 de los widgets y la
suite completa se re-ejecutaron una segunda vez antes de cerrar; resultados idénticos.

> **⚠️ Este documento tiene dos partes.** Lo que sigue hasta la línea `# Re-verificación` es la
> revisión original sobre `6df6402`. El veredicto vigente y los hallazgos abiertos están en la
> [sección de re-verificación](#re-verificación--ad16c46) sobre `ad16c46`, al final del archivo.

---

## Veredicto (revisión original, `6df6402`)

**APROBADO para fusión — RECHAZADA la afirmación de que la funcionalidad esté entregada.**

El código es correcto. Ataqué la zona horaria, la frontera de día, el fail-open y la regresión
de los widgets con contraejemplos ejecutables y **ninguno rompió nada**. Barrí una semana
completa minuto a minuto contra `Intl` en siete husos horarios: 0 discrepancias.

Pero el endpoint de producción **no devuelve `whatsappSchedule` para ninguna de las 3 marcas**.
Al fusionar, la funcionalidad no hace absolutamente nada — el fail-open la convierte en un
no-op silencioso. Y el gate de tests que se reporta (283 archivos / 2366 tests) **no se
reproduce** en este mismo worktree.

Merece merge porque no puede romper nada. No merece que se diga "listo".

---

## Lo que ejecuté

| Verificación | Comando | Resultado |
|---|---|---|
| Suite completa | `npx vitest run` | **278 archivos / 2335 tests pasan, 5 errores no capturados** — ≠ 283/2366 reportado |
| Build | `pnpm build:alquicarros` | **exit 0**, gate presente en el bundle (`.output/public/_nuxt/CqIEmkD1.js`) |
| Typecheck HEAD | `pnpm typecheck` | 166 errores, exit 1 |
| Typecheck baseline (A/B real) | archivos revertidos a `6df6402~1` | 192 errores → **0 errores nuevos, 0 tocan archivos modificados** |
| Barrido de husos horarios | script propio, 7 TZ × 11 040 minutos | **0 discrepancias** vs `Intl/America/Bogota` |
| Matriz fail-open | 13 entradas basura + `Invalid Date` | **13/13 visibles** |
| Matriz en DOM real | servidor dev + API stub, 6 escenarios | ver tabla abajo |
| Contrato de producción | `curl` a los 3 endpoints reales | **sin `whatsappSchedule` en ninguno** |

Árbol de trabajo restaurado a `6df6402` limpio. No toqué código, no hice push.

---

## Ataques que fallaron (el código aguanta)

### A1 · Zona horaria del dispositivo — refutado

Barrí `2026-07-19T00:00Z` + 11 040 minutos consecutivos contra una implementación de
referencia independiente (`Intl.DateTimeFormat` con `timeZone: 'America/Bogota'`), bajo
`TZ=America/Bogota, UTC, Europe/Madrid, America/New_York, Asia/Kolkata, Pacific/Kiritimati (UTC+14), Pacific/Midway (UTC−11)`:

```
[TZ=Europe/Madrid]       week sweep mismatches: 0
[TZ=Pacific/Kiritimati]  week sweep mismatches: 0
[TZ=Pacific/Midway]      week sweep mismatches: 0
...las 7 idénticas
```

La función solo usa `getUTCDay/getUTCHours/getUTCMinutes` sobre el instante desplazado −5 h.
El reloj civil del dispositivo no entra en el cálculo. No hay contraejemplo.

### A2 · Frontera de día — refutado

El punto crítico era si la clave del día sale de Bogotá o de UTC. Sale de Bogotá:

| Instante | Bogotá | Día usado | Esperado | Obtenido |
|---|---|---|---|---|
| `2026-07-26T05:30Z` | dom 00:30 | `sun` | oculto | oculto ✓ |
| `2026-07-27T01:00Z` | dom 20:00 (¡lunes en UTC!) | `sun` | oculto | oculto ✓ |
| `2026-07-28T01:00Z` | lun 20:00 (martes en UTC) | `mon` | oculto | oculto ✓ |
| `2026-07-26T04:00Z` | sáb 23:00 (domingo en UTC) | `sat` | oculto | oculto ✓ |
| `2026-07-27T00:00Z` con `{sun:['18:00-22:00']}` | dom 19:00 | `sun` | visible | visible ✓ |

El caso `sun: ['18:00-22:00']` es el más duro: la ventana entera cae en el *lunes* UTC y aun
así resuelve como domingo. Correcto.

### A3 · Fail-open — refutado en DOM real

Levanté un stub del dashboard y recorrí la matriz con el navegador embebido de Orca sobre
`localhost:4000/blog` (alquilatucarro):

| Escenario del API | Ítems del FAB renderizados | Correcto |
|---|---|---|
| ventana abierta hoy | `Chat 24 horas`, `WhatsApp`, `Llámanos` | ✓ |
| `{hoy: []}` (cerrado explícito) | `Chat 24 horas`, `Llámanos` | ✓ oculta |
| día de hoy ausente | `Chat 24 horas`, `Llámanos` | ✓ oculta |
| rango basura `zz:zz-99:99` | `Chat`, **`WhatsApp`**, `Llámanos` | ✓ fail-open |
| HTTP 500 | **`WhatsApp`**, `Llámanos` | ✓ fail-open (Chat cae por fail-closed, como debe) |
| apiBase caído (ECONNREFUSED) | **`WhatsApp`**, `Llámanos` | ✓ fail-open |

Más 13 entradas malformadas contra la función pura (`null`, `undefined`, string, número,
array, `{}`, claves en español, día no-array, día `null`, rango objeto, `true`, `Invalid Date`):
las 13 devuelven visible.

**El botón nunca desaparece por un fallo.** Esto es lo que más importa y está bien resuelto.

### A4 · Regresión en los 3 widgets — refutado

- Los tres `ChatWidget.vue` son **byte-idénticos**: `md5 = cb084b6f8b1bf05aba188c73592de1ae`.
- El menú con 2 vías abre correctamente. Estado leído del DOM tras hacer clic en el FAB:
  ```json
  {"expanded":"true","ulLabel":"Opciones de contacto","visible":"flex",
   "items":[{"label":"Chat 24 horas","aria":"Abrir Chat 24 horas"},
            {"label":"Llámanos","aria":"Llamar al +57 301 672 9250"}]}
  ```
  `aria-expanded`, `aria-label` del `<ul>` y `aria-label` de cada opción intactos. El `<ul>`
  es `flex flex-col gap-3` sin posicionamiento por ítem: quitar un `<li>` no descuadra nada.
- La vía Llamar sigue sin gate. La vía Chat conserva su propio `v-if="chatEnabled"`.
- El menú nunca queda vacío: `Llámanos` no está condicionado.

### A5 · SSR / hidratación — refutado

Todo el widget vive dentro de `<ClientOnly>` (`ChatWidget.vue:15`–`169`) y además se teletransporta
a `<body>`. El servidor nunca renderiza el `<li>`, así que un `v-if` que difiera entre servidor y
cliente es imposible por construcción. `whatsappVisible` arranca en `true` y solo cambia tras el
`onMounted`, que no corre en SSR.

### A6 · Typecheck "solo errores preexistentes" — verificado (por mi cuenta)

Hice el A/B de verdad: revertí los 4 archivos fuente a `6df6402~1`, borré los 3 de test, corrí
`pnpm typecheck`, comparé conjuntos ordenados de errores.

```
BASE errors: 192
HEAD errors: 166
errores SOLO en HEAD (nuevos): (ninguno)
errores SOLO en BASE:          26  (ruido de tsconfig regenerado en alquilatucarro)
```

Cero errores nuevos. Cero errores que mencionen `useChatStatus.ts`, `ChatWidget.vue`,
`chat.vue` o `tiktok.vue`. La afirmación es cierta.

---

## Hallazgos

### D1 · La funcionalidad no hace nada en producción — ALTA (entrega)

El dashboard no emite el campo. Los tres endpoints reales, ahora mismo:

```
$ curl -s "https://rentacar-dashboard-delta.vercel.app/api/chat/status?brand=alquilatucarro"
{"brand":"alquilatucarro","enabled":true}
$ ... brand=alquilame
{"brand":"alquilame","enabled":false}
$ ... brand=alquicarros
{"brand":"alquicarros","enabled":false}
```

Sin `whatsappSchedule` → `evaluateWhatsappVisibility(undefined, …)` → `true` → WhatsApp
siempre visible. Idéntico al comportamiento actual.

Peor: no hay nada en el repo que detecte la desincronización. Ni test de contrato, ni fixture
capturado del API real, ni referencia al cambio del dashboard, ni bandera. Si el dashboard
publica el campo con otra forma (`{mon:[{start,end}]}`, claves `monday`, JSON como string,
mayúsculas), el parser cae al fail-open y **la funcionalidad sigue sin hacer nada, en silencio,
sin un solo log**.

**Contraejemplo ejecutable:** el `curl` de arriba. Fusiona hoy y no cambia ni un píxel.

**Qué falta:** confirmar la forma exacta del payload del dashboard, un test de contrato contra
un fixture real, y decidir el orden de despliegue (dashboard primero).

### D2 · Solo se tapó una de ~8 puertas a WhatsApp — MEDIA (alcance)

El gate cubre el `<li>` del FAB. Fuera de horario, el visitante sigue viendo WhatsApp en:

| Marca | Superficies sin gate |
|---|---|
| alquilatucarro | `layouts/default.vue` (header, menú móvil, footer), `error.vue`, `CategorySelectionSection.vue`, `pages/blog/index.vue`, `pages/gana/index.vue`, `pages/tiktok.vue` |
| alquilame | `layouts/default.vue`, `home/Hero.vue`, `home/Contact.vue`, `home/Faq.vue`, `city/Faq.vue`, `error.vue`, `CategorySelectionSection.vue`, `pages/gana/index.vue` |
| alquicarros | `layouts/default.vue`, `home/Hero.vue`, `home/Contact.vue`, `home/Faq.vue`, `city/Faq.vue`, `wizard/steps/StepVehicle.vue`, `error.vue`, `pages/gana/index.vue` |

El commit dice "the contact FAB's WhatsApp option", así que es coherente con lo que se
programó. No es coherente con el objetivo de producto: si la razón es no ofrecer un canal
que nadie atiende a las 3 a.m., el visitante lo encuentra igual en el header y en el footer.

**Contraejemplo:** con el stub en `closed`, `document.querySelectorAll('a[href*="wa.me"]')`
en `/blog` sigue devolviendo los enlaces de layout. Solo desaparece el del FAB.

Decisión de producto, no bug. Pero hay que tomarla antes de anunciar la funcionalidad.

### D3 · Los números del gate no se reproducen — MEDIA (verificación)

Reportado: 283 archivos / 2366 tests, limpio.
Mi corrida en el mismo worktree, mismo commit:

```
Test Files  278 passed (278)
     Tests  2335 passed (2335)
    Errors  5 errors
  Duration  97.98s
```

Los 5 errores son `ERR_REQUIRE_ESM`: `html-encoding-sniffer@6` hace `require()` de
`@exodus/bytes/encoding-lite.js`, que es ESM. Eso mata el entorno **jsdom**, y los archivos
que lo usan son exactamente 5:

```
packages/logic/src/composables/__tests__/useDelayedClose.test.ts
packages/ui-alquilatucarro/app/components/__tests__/SearcherSelectDrawer.mount.test.ts
packages/ui-alquilame/app/components/__tests__/SearcherSelectDrawer.mount.test.ts
packages/ui-alquicarros/app/components/__tests__/SearcherSelectDrawer.mount.test.ts
packages/ui-alquilatucarro/app/components/__tests__/UnableCategoryCard.mount.test.ts
```

278 + 5 = 283. 2335 + 31 = 2366. Cuadra exacto.

**No lo causa esta rama** — ninguno de esos 5 importa `useChatStatus`, y el commit no los
toca. Es podredumbre de dependencias en el entorno. Pero el gate como se reporta no es
reproducible, y esos 5 archivos (los únicos tests de montaje real del repo) **no corrieron**.

### D4 · El test de "integración" del widget no renderiza nada — MEDIA (calidad de test)

`packages/ui-alquicarros/app/components/__tests__/ChatWidget.whatsappSchedule.test.ts` lee
los `.vue` como texto y les aplica regex:

```js
expect(source, brand).toMatch(
  /<li v-if="whatsappVisible" class="flex">\s*<a\s+:href="franchise\.whatsapp"/,
)
expect(chatStatusSource).toContain('setInterval(reevaluateWhatsapp, 60_000)')
```

Eso no es integración: es una aserción sobre el código fuente. Pasa sin montar el componente
jamás. Rompe si alguien reordena atributos o cambia `60_000` por `60000` — cambios inocuos —
y no detecta ninguna regresión real de render. La conducta que dice cubrir (menú de 2 vías,
aria, layout) tuve que verificarla yo con el navegador porque el test no la toca.

Los 21 tests de la función pura y los 7 del composable, en cambio, están bien: prueban
comportamiento, no texto, y cubren los bordes correctos (`[inicio, fin)`, cierre `24:00`,
fail-open, timer de 60 s, revalidación en focus). Ahí no hay reward hacking.

### D5 · "Probado con stash" describe un experimento que no existió — BAJA (proceso)

La rama está comiteada y el árbol limpio: `git stash` no tiene nada que guardar. La afirmación
"typecheck: solo errores preexistentes, probado con stash" no puede corresponder a un
experimento real sobre este commit.

El fondo resultó cierto — lo comprobé con un A/B propio (ver A6). Pero la evidencia citada
no era evidencia.

### D6 · Semántica de fallo asimétrica y silenciosa — BAJA

Un día **ausente** oculta WhatsApp (fail-closed). Un rango **con typo** lo muestra las 24 h
(fail-open). Ambas decisiones están documentadas en el código, pero se contradicen y el
operador no tiene forma de notarlo:

```js
evaluateWhatsappVisibility({ sun: ['8:00-16:00'] }, domingoALas3AM)  // → true (¡visible!)
```

Un dígito de menos (`8:00` en vez de `08:00`) y el domingo queda abierto todo el día, sin
warning, sin log, sin validación. Y como el parser exige `^\d{2}:\d{2}-\d{2}:\d{2}$`, el formato
es más estricto de lo que un humano escribe por instinto.

**Mitigación:** validar el formato en el dashboard al guardar, o al menos un
`console.warn` en cliente cuando un rango no parsea.

### D7 · Granularidad de 60 s sin `visibilitychange` — BAJA

La revalidación cuelga de `focus` + `setInterval(60_000)`. En móvil, los timers se estrangulan
en segundo plano y `focus` no siempre dispara al volver (restauración desde bfcache dispara
`pageshow`). El visitante puede ver hasta ~60 s de estado obsoleto en el peor caso.

Impacto real: bajo. El peor efecto es un WhatsApp visible un minuto de más, que es justo el
lado seguro del error.

### D8 · Los escenarios que citan los tests no existen — MEDIA (trazabilidad)

`whatsappVisibility.test.ts:5` abre con:

```js
// SCEN S1/S2/S5/S4 — WhatsApp FAB visibility windows (Bogota civil time, UTC−5, …)
```

No hay ningún artefacto de escenarios para esta funcionalidad:

```bash
$ grep -rln "whatsappVisible\|whatsappSchedule" docs/specs/
(sin resultados)
$ ls docs/specs/ | grep -i whats
2026-07-17-chat-bubbles-whatsapp      # otra feature
2026-07-17-chat-reply-whatsapp        # otra feature
issue-284-whatsapp-green-token        # otra feature
```

Los identificadores `S1/S2/S4/S5` tampoco siguen la convención `SCEN-###` del repo. Sin el
artefacto no se puede comprobar si los tests satisfacen los escenarios ni si alguno se
debilitó para que pasaran — que es justo lo que el gate de SDD existe para impedir. Las
referencias apuntan al vacío.

---

## Cosas que verifiqué y están bien, para que no se vuelvan a revisar

- `[inicio, fin)` exclusivo en el cierre: 15:59 visible, 16:00 oculto. Correcto.
- `24:00` aceptado solo como fin, rechazado como inicio, y no se desborda al día siguiente.
- Ventanas partidas (turno mañana + turno noche) y el hueco entre ellas.
- Guarda de generación en `refresh()`: una respuesta lenta no pisa una revalidación más nueva.
- Un error transitorio conserva el último horario autoritativo en vez de resucitar el botón.
- El timer se limpia en `onBeforeUnmount`; el `unref()` opcional no revienta en navegador.
- `fetchChatEnabled` sigue existiendo y los 3 `pages/chat.vue` no cambiaron de conducta.
- Colisiones de nombre en el auto-import de Nuxt: los 3 `.nuxt/imports.d.ts` exponen los
  nuevos símbolos sin conflicto.

---

## Condiciones para cerrar

1. **D1** — confirmar el contrato con el dashboard y añadir un test contra un fixture real del
   endpoint. Sin eso no se puede afirmar que la funcionalidad esté entregada.
2. **D2** — decidir explícitamente si el horario aplica solo al FAB o a todas las puertas a
   WhatsApp. Si es solo el FAB, dejarlo escrito.
3. **D3** — arreglar o marcar como saltados los 5 archivos jsdom, y volver a reportar el gate
   con los números que realmente salen.
4. **D4** — sustituir las regex sobre el fuente por un test de montaje que renderice el menú
   con `whatsappVisible=false` y afirme sobre el DOM (o borrarlo y quedarse con los unitarios,
   que sí valen).
5. **D6** — validar el formato de los rangos en el dashboard al guardar.
6. **D8** — publicar el artefacto de escenarios que los tests dicen cubrir, o quitar las
   referencias `SCEN S1/S2/S4/S5` que apuntan a la nada.

Nada de esto bloquea el merge. Todo bloquea decir que está listo.

---

## Reproducir

```bash
# Barrido de husos horarios (script en el scratchpad de la sesión)
for tz in UTC Europe/Madrid America/New_York Asia/Kolkata Pacific/Kiritimati; do
  TZ=$tz npx tsx probe.ts | head -1
done

# Contrato de producción
for b in alquilatucarro alquilame alquicarros; do
  curl -s "https://rentacar-dashboard-delta.vercel.app/api/chat/status?brand=$b"; echo
done

# Matriz en DOM: stub del dashboard en :4599, dev server apuntando ahí
NUXT_PUBLIC_RENTACAR_PUBLIC_API_BASE=http://localhost:4599 pnpm dev:alquilatucarro
orca goto --url http://localhost:4000/blog
orca eval --expression "JSON.stringify(Array.from(document.querySelectorAll('#contact-fab-menu li')).map(l=>l.querySelector('.fab-label')?.textContent))"
```

Nota de entorno: este worktree no tiene `.env.local`, así que `/` devuelve 500 por falta de
credenciales de Supabase. `/blog` sí renderiza el layout completo con el FAB — es la ruta que
usé para toda la validación en DOM. Los errores de consola que aparecen son todos de esa falta
de credenciales, ninguno del cambio.

---
---

# Re-verificación — `ad16c46`

**Fecha:** 2026-07-21 · **Revisor:** el mismo que emitió D1–D8 · **Base:** `f77c201..ad16c46`
**Postura:** re-ejecutar mis propios contraejemplos contra el código corregido, no leer el diff
y confiar. Toda cifra de abajo salió de un comando que corrí en esta sesión.

## Veredicto final

**APROBADO.** Las correcciones son reales y las verifiqué una por una. Ninguna aserción previa
se debilitó: los 7 asserts que desaparecieron son exactamente los de fail-open que se
invirtieron a propósito, y entraron 16 en su lugar. Los tests de frontera (`15:59`/`16:00`,
`08:00` inclusivo, cruce de medianoche, S1/S2/S5) están intactos byte a byte.

Con una condición que **no bloquea el merge pero sí bloquea el despliegue del dashboard**:
al quitar la guarda de "ninguna clave de día reconocida", cinco formas de deriva entre repos
que antes fallaban abiertas ahora **ocultan WhatsApp 24/7 en las 3 marcas, en silencio**
(D9, abajo). Es una línea de código.

## Cifras medidas

| Verificación | Comando | Resultado |
|---|---|---|
| Suite completa | Node 22.23.1 · `npx vitest run` | **284 archivos / 2396 tests pasan, 0 errores, exit 0** (2 corridas, cifras idénticas) |
| Build | Node 22 · `pnpm build:alquicarros` | **exit 0**, `Build complete`, gate en 2 chunks del bundle |
| Typecheck HEAD | `pnpm typecheck` | 166 errores, **ninguno menciona archivos de la rama** |
| Typecheck BASE (A/B real) | fuentes revertidas a `6df6402~1` | 172 errores |
| **Errores nuevos** | `comm -13 base head` | **0** |
| Widgets | `md5 -q ChatWidget.vue` ×3 | `cb084b6f…` ×3, y `E10` sigue exigiéndolo |

**D3 queda cerrado.** Los 284/2396 que reporta el implementador son exactamente lo que me da
a mí bajo Node 22. Mis 278/2335+5 eran Node 20. La explicación reproduce.

## Mis contraejemplos, re-ejecutados

### R1 · Ruta normal, 7 husos — sigue en 0

Barrido de 11 040 minutos consecutivos contra `Intl/America/Bogota` bajo
`America/Bogota, UTC, Europe/Madrid, America/New_York, Asia/Kolkata, Pacific/Kiritimati (UTC+14), Pacific/Midway (UTC−11)`:

```
[TZ=Pacific/Kiritimati] R1 barrido semana (ruta normal): 0 discrepancias
...las 7 idénticas
```

El cambio de semántica no tocó el camino feliz.

### R2 · `{}` oculta toda la semana — confirmado exhaustivamente

No me bastó con un instante por día. Evalué **los 10 080 minutos de una semana completa**, en
los 7 husos:

```
[TZ=UTC]                R2 {} visible en 0/10080 minutos
[TZ=Pacific/Midway]     R2 {} visible en 0/10080 minutos
...las 7 en 0/10080
```

La afirmación es cierta sin excepciones.

### R3 · Frontera de día — intacta

```
OK  dom 00:30 Bogota                        -> false
OK  dom 20:00 Bogota (lunes en UTC)         -> false
OK  lun 20:00 Bogota (martes en UTC)        -> false
OK  sáb 23:00 Bogota (domingo en UTC)       -> false
OK  sáb 15:59 / 16:00 (fin exclusivo)       -> true / false
OK  mar 08:00 (inicio inclusivo)            -> true
OK  dom 19:00 con ventana entera en lunes UTC -> true
```

### R4 · Qué falla abierto y qué oculta ahora

| Entrada | Antes (`6df6402`) | Ahora (`ad16c46`) |
|---|---|---|
| `null` / `undefined` / campo ausente | visible | visible |
| no-objeto (`'x'`, `42`, `[]`, `true`) | visible | visible |
| `{tue: null}` / `{tue: 'x'}` (día no-lista) | visible | visible |
| `Invalid Date` | visible | visible |
| `{}` | visible | **oculto** ✔ corregido |
| `{tue: ['8:00-18:00']}` (typo) | visible 24 h | **oculto** ✔ corregido (D6) |
| `{tue: [{start,end}]}` (rango objeto) | visible | **oculto** ⚠ ver D9 |
| `{lunes: [...]}` | visible | **oculto** ⚠ ver D9 |
| `{monday: [...]}` | visible | **oculto** ⚠ ver D9 |
| `{Tue: [...]}` | visible | **oculto** ⚠ ver D9 |
| `{version:2, days:{...}}` | visible | **oculto** ⚠ ver D9 |

### R5 · La misma matriz en DOM real

Servidor dev apuntando a un stub del dashboard, FAB leído del DOM con el navegador de Orca:

| Respuesta del API | Ítems renderizados |
|---|---|
| ventana abierta | `Chat 24 horas`, `WhatsApp`, `Llámanos` |
| `{hoy: []}` | `Chat 24 horas`, `Llámanos` |
| día de hoy ausente | `Chat 24 horas`, `Llámanos` |
| **`{}`** | `Chat 24 horas`, `Llámanos` ✔ |
| **`{monday:[…], lunes:[…]}`** | `Chat 24 horas`, `Llámanos` ⚠ D9 |
| typo `8:00-23:00` | `Chat 24 horas`, `Llámanos` ✔ |
| `{hoy: 'no-soy-lista'}` | `Chat`, **`WhatsApp`**, `Llámanos` (fail-open) |
| `whatsappSchedule: null` | `Chat`, **`WhatsApp`**, `Llámanos` |
| HTTP 500 | **`WhatsApp`**, `Llámanos` (fail-open) |

## Rojo-verde del test de contrato — verificado con 3 mutaciones

No me fié del "verificado en rojo-verde". Rompí el contrato yo mismo:

**A · el dashboard deja de servir el campo** (borré `whatsappSchedule` del fixture):
```
Tests  5 failed | 7 passed (12)
AssertionError: CONTRACT BROKEN: fixture "scheduled" has no "whatsappSchedule" key.
  […] Check rentacar-dashboard@diego-alex-melo/whatsapp-schedule-dash (app/api/chat/status/route.ts)
```

**B · el dashboard renombra las claves a `monday`/`tuesday`**:
```
Tests  2 failed
AssertionError: CONTRACT BROKEN: unexpected weekday key "monday". The reader only understands
  mon/tue/wed/thu/fri/sat/sun; any other key collapses that day to hidden.
```

**C · semántica vieja** (`useChatStatus.ts` revertido a `f77c201`):
```
Tests  15 failed | 29 passed (44)
```

**Verde con el estado actual:** `Test Files 2 passed (2)` · `Tests 44 passed (44)`.
Fixture y fuentes restaurados; árbol limpio tras cada experimento.

## El test del widget ahora tiene dientes

`ChatWidget.whatsappSchedule.test.ts` pasó de regex sobre el `.vue` a un `mount()` real con
`@vue/test-utils` + jsdom, el `useChatStatus` de verdad, y aserciones sobre `document.body`
(el widget se teletransporta). Comprobé la mutación yo mismo — quité el `v-if` del `<li>`:

```
× removes the WhatsApp option outside the window, keeping Chat and Llámanos
× hides WhatsApp all week for an empty schedule {} (canonical semantics)
× closes the option on the 60s tick when the window ends
Tests  3 failed | 5 passed (8)
```

Monta solo la copia de alquicarros, pero `ChatWidget.burbuja-mission.test.ts` (`E10`) exige que
las tres sean byte-idénticas, así que la cobertura alcanza a las tres. D4 cerrado.

## Hallazgos

### D9 · NUEVO — la deriva de claves entre repos ahora apaga el botón — MEDIA-ALTA

> **CERRADO en `b10c517`.** Verificación puntual al final del documento:
> [Cierre de D9](#cierre-de-d9--b10c517).

Al borrar la guarda `if (!DAY_KEYS.some(key => key in record)) return true`, un payload cuyas
claves no reconoce **ninguna** el lector dejó de ser "no pude leer un horario" y pasó a ser
"un horario sin ninguna ventana". Resultado: WhatsApp desaparece de las 3 marcas, las 24 h,
sin log, sin alerta y sin que ningún test se ponga rojo.

Es exactamente la deriva contra la que advierte el mensaje de error del propio test de
contrato — *"any other key collapses that day to hidden"* — solo que el test vigila el
**fixture**, que es un archivo estático. Si el dashboard cambia y nadie re-captura el fixture,
la suite sigue verde mientras el botón se apaga en producción. El `_comment` del JSON dice
"If this file stops matching the endpoint, chatStatusContract.test.ts fails loudly": eso no es
cierto, nada compara el fixture con el endpoint vivo.

**Contraejemplo ejecutable** (verificado en función pura y en DOM):
```js
evaluateWhatsappVisibility({ monday: ['00:00-24:00'] }, new Date())  // → false
evaluateWhatsappVisibility({ lunes:  ['00:00-24:00'] }, new Date())  // → false
evaluateWhatsappVisibility({ Tue:    ['00:00-24:00'] }, new Date())  // → false
evaluateWhatsappVisibility({ version: 2, days: { tue: ['00:00-24:00'] } }, new Date())  // → false
```

Nótese la asimetría invertida que introduce: un fallo de forma en **un** día (`{tue: null}`)
falla abierto, pero un fallo de forma en **todas** las claves falla cerrado. El fallo más
grave recibe el trato menos seguro.

**Arreglo mínimo** — distinguir "cero claves" de "claves que no entiendo", que preserva la
semántica canónica de `{}` sin sacrificar el fail-open:

```js
if (Object.keys(record).length === 0) return false          // {} canónico → oculto
if (!DAY_KEYS.some(k => k in record)) return true           // claves ilegibles → fail-open
```

Con eso `{}` sigue ocultando toda la semana y `{monday: […]}` vuelve a fallar abierto.

No bloquea el merge: hoy el endpoint no manda el campo, así que la rama no puede activar este
camino. **Bloquea el despliegue del dashboard.**

### D6 · Cerrado, con una consecuencia que conviene tener presente — informativo

El typo ya no abre el día (`{sun: ['8:00-16:00']}` → oculto, verificado). El precio es que
ahora un dígito de menos **oculta** el canal en vez de mostrarlo de más. Es la elección
correcta si el dashboard valida al guardar — y el fixture documenta que lo hace
(`lib/schemas/whatsapp-schedule.ts`, un horario inválido se sirve como `null`). Queda
registrado para que nadie se sorprenda: en este diseño, un error de configuración pierde
leads en silencio.

### D8 · Sigue abierto — trazabilidad

`whatsappVisibility.test.ts:5` sigue diciendo `// SCEN S1/S2/S5/S4` y sigue sin existir el
artefacto:

```bash
$ grep -rln "whatsappVisible\|whatsappSchedule" docs/specs/
(sin resultados)
```

`decisions-web.md` responde a D1, D2, D3, D4, D5, D6 y D7. D8 no aparece. Es el hallazgo más
barato de cerrar: publicar el archivo de escenarios o borrar la referencia.

### D1 · Convertido en un no-op documentado y cubierto por test — mejorado, no resuelto

El endpoint real, re-consultado hoy:

```
{"brand":"alquilatucarro","enabled":true}
{"brand":"alquilame","enabled":false}
{"brand":"alquicarros","enabled":false}
```

Sigue sin `whatsappSchedule`. La funcionalidad sigue sin hacer nada en producción. Lo que
cambió — y es la respuesta correcta — es que ahora es una propiedad **explícita y verificada**:
el caso `legacyBeforeDashboardShipped` del fixture fija que una respuesta sin el campo deja
WhatsApp siempre visible. Ya no es un punto ciego, es una decisión revisada con orden de
despliegue escrito: dashboard primero.

Consecuencia menor: el fixture se describe como "respuesta capturada", pero el endpoint vivo
nunca ha servido ese payload. Está derivado de leer el esquema del dashboard, que es legítimo
— conviene que el `_comment` lo diga así.

### D2 · Diferido de forma explícita — aceptable

La tabla de ~8 superficies sin gate por marca quedó copiada en `decisions-web.md` como
decisión de producto pendiente, con la condición de resolverla antes de anunciar la
funcionalidad. Es el manejo correcto de un hallazgo de alcance.

### D5 · Cerrado

El método reproducible (revertir a `6df6402~1`, contar, `comm -13`) quedó escrito. La frase
que no correspondía nunca llegó al repo.

### D7 · Cerrado

`visibilitychange` añadido junto a `focus` y al timer, con limpieza simétrica en
`onBeforeUnmount`. Detalle sin importancia: al volver a una pestaña pueden dispararse
`focus` y `visibilitychange` a la vez y provocar dos `refresh()`; la guarda de generación ya
descarta el que llegue tarde, así que solo es una petición de más.

## Estado de los hallazgos

| # | Estado |
|---|---|
| D1 · feature inerte en producción | **Mejorado** — no-op documentado y cubierto por test; pendiente aguas arriba |
| D2 · alcance limitado al FAB | **Diferido explícitamente** (decisión de producto) |
| D3 · números del gate no reproducibles | **Cerrado** — era Node 20 vs 22; 284/2396 reproduce |
| D4 · test de widget sin render | **Cerrado** — monta de verdad, mutación mata 3 tests |
| D5 · evidencia citada inexistente | **Cerrado** |
| D6 · asimetría de fallo | **Cerrado** (con la consecuencia anotada arriba) |
| D7 · sin `visibilitychange` | **Cerrado** |
| D8 · SCEN sin artefacto | **Abierto** |
| D9 · deriva de claves apaga el botón | **Cerrado en `b10c517`** — ver el cierre al final |

## Condiciones para el despliegue

1. ~~**D9** — restaurar el fail-open para claves irreconocibles (2 líneas) **antes** de que el
   dashboard empiece a servir el campo.~~ **Hecho en `b10c517` y verificado.**
2. **D1** — re-capturar el fixture contra el endpoint real en cuanto el dashboard despliegue, y
   corregir el `_comment` para que no prometa una detección automática que no existe.
3. **D8** — publicar el artefacto de escenarios o quitar las referencias `SCEN`.
4. **D2** — decidir si el horario aplica solo al FAB antes de anunciar la funcionalidad.

## Reproducir

```bash
export PATH="/tmp/node-v22.23.1-darwin-arm64/bin:$PATH" COREPACK_INTEGRITY_KEYS=0
npx vitest run                                    # 284 / 2396 / 0 errores
pnpm build:alquicarros                            # exit 0

# rojo-verde del contrato: borrar whatsappSchedule del fixture, o renombrar mon -> monday
npx vitest run packages/logic/src/composables/__tests__/chatStatusContract.test.ts

# mutación del widget: quitar v-if="whatsappVisible" del <li> de alquicarros
npx vitest run packages/ui-alquicarros/app/components/__tests__/ChatWidget.whatsappSchedule.test.ts

# D9
node -e 'import("./packages/logic/src/composables/useChatStatus.ts")' # o vía tsx:
# evaluateWhatsappVisibility({ monday: ["00:00-24:00"] }, new Date()) -> false
```

---

## Cierre de D9 — `b10c517`

**Veredicto: D9 CERRADO.** Verificación puntual, mismos contraejemplos, ejecutados de nuevo.

El arreglo es el que propuse y está en el orden correcto — `{}` se resuelve **antes** que la
regla de legibilidad, que es justo lo que evita que el vacío canónico se cuele por el
fail-open:

```js
if (Object.keys(record).length === 0) return false        // {} canónico → oculto
if (!DAY_KEYS.some(key => key in record)) return true     // forma ilegible → fail-open
```

### Los contraejemplos de D9 vuelven a fallar abiertos

No probé un instante: evalué **los 10 080 minutos de la semana** para cada forma ilegible, en
`Pacific/Kiritimati` (UTC+14, el huso más hostil al cálculo de día). Ninguna se oculta ni un
solo minuto:

| Payload | Antes (`ad16c46`) | Ahora (`b10c517`) |
|---|---|---|
| `{monday: ['00:00-24:00']}` | oculto | **visible 10080/10080** |
| `{lunes: ['08:00-18:00']}` | oculto | **visible 10080/10080** |
| `{version: 2, days: {}}` | oculto | **visible 10080/10080** |
| `{version: 2, days: {tue: […]}}` | oculto | **visible 10080/10080** |
| `{Tue: ['00:00-24:00']}` | oculto | **visible 10080/10080** |
| `{Mon: [], Tue: []}` | oculto | **visible 10080/10080** |
| `{lun: [], mar: []}` | oculto | **visible 10080/10080** |
| `{_comment: 'x'}` | oculto | **visible 10080/10080** |

### Nada de lo anterior regresó

| Caso | Resultado |
|---|---|
| `{}` oculto toda la semana | **0/10 080 minutos visible**, en los 7 husos |
| Barrido de la ruta normal vs `Intl/America/Bogota` | **0 discrepancias**, en los 7 husos |
| `{mon: []}` un lunes | oculto ✓ |
| `{mon: ['08:00-18:00']}` un **martes** (día ausente) | oculto ✓ |
| `{mon: ['08:00-18:00']}` un **lunes** dentro de ventana | visible ✓ |
| `{sun: []}` un martes (hoy ausente, otro día reconocible) | oculto ✓ |
| `{tue: ['8:00-18:00']}` (typo, D6) | oculto ✓ |
| `{tue: null}` (día no-lista) | visible ✓ |
| `null` / `'basura'` / `[]` / `Invalid Date` | visible ✓ |

### El agujero que busqué y no existe

Restaurar el fail-open podría haber roto la forma realista de decir "cerrado toda la semana"
desde una UI, que no es `{}` sino los siete días con lista vacía. Comprobé las dos:

```
{} (vacío canónico)                  : visible 0/10080 min
los 7 días con [] (cerrado total)    : visible 0/10080 min
solo {sun: []} (1 día reconocible)   : visible 0/10080 min
{version: 2} sin días reconocibles   : visible 10080/10080 min   ← fail-open, correcto
```

Ambas maneras de cerrar la semana siguen cerrando. El fail-open solo se activa cuando de
verdad no hay ninguna llave que el lector entienda.

### En DOM real

Servidor dev contra el stub del dashboard, FAB leído del DOM:

| Respuesta del API | Ítems renderizados |
|---|---|
| **`{monday:[…], lunes:[…]}`** | `Chat 24 horas`, **`WhatsApp`**, `Llámanos` ✔ antes faltaba |
| `{}` | `Chat 24 horas`, `Llámanos` ✔ sigue oculto |
| ventana abierta | `Chat 24 horas`, `WhatsApp`, `Llámanos` |
| `{hoy: []}` / día ausente / typo | `Chat 24 horas`, `Llámanos` |
| `{hoy: 'no-soy-lista'}` / `null` | `Chat`, `WhatsApp`, `Llámanos` |
| HTTP 500 | `WhatsApp`, `Llámanos` |

### Tests

Los dos asserts que codificaban el bug (`{foo: […]}` y `{lunes: […]}` → oculto) no
desaparecieron: se reemplazaron por una suite de regresión D9 explícita, más una prueba que
fija el **orden** (`{}` oculto aunque no nombre ningún día) y otra que confirma que una sola
llave reconocible vuelve legible el objeto (`{version: 2, mon: […]}` → lunes abierto, domingo
cerrado). El `it.each` de `{}` en los 7 días quedó intacto.

```
npx vitest run  (Node 22.23.1)
Test Files  284 passed (284)
     Tests  2402 passed (2402)      # +6 respecto a ad16c46, todos de la regresión D9
    Errors  0        exit 0
```

Dos corridas, cifras idénticas. Los barridos de 10 080 minutos también se re-ejecutaron en un
huso distinto (`Pacific/Midway`, UTC−11) con los mismos resultados.

### Estado final de los hallazgos

| # | Estado |
|---|---|
| D1 | Mejorado — no-op documentado y cubierto por test; pendiente aguas arriba (dashboard primero) |
| D2 | Diferido explícitamente (decisión de producto) |
| D3 · D4 · D5 · D6 · D7 | Cerrados |
| **D9** | **Cerrado** |
| **D8** | **Abierto** — los `SCEN S1/S2/S4/S5` siguen sin artefacto en `docs/specs/` |

Queda un solo hallazgo abierto, el más barato: publicar el archivo de escenarios o borrar la
referencia.
