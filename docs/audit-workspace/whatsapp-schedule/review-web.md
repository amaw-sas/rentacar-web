# Revisión adversarial — `diego-alex-melo/whatsapp-schedule-web`

**Commit:** `6df6402` · **Repo:** rentacar-web · **Worktree:** `whatsapp-schedule-web`
**Fecha:** 2026-07-21 · **Revisor:** agente fresco (sin contexto del implementador)
**Postura:** refutar, no validar. Todo lo que sigue lo ejecuté yo mismo.
**Estabilidad:** el barrido de husos, el contrato de producción, los md5 de los widgets y la
suite completa se re-ejecutaron una segunda vez antes de cerrar; resultados idénticos.

---

## Veredicto

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
