# Decisiones y pendientes — horario del botón WhatsApp (lado web)

Respuesta a `review-web.md`. Rama: `diego-alex-melo/whatsapp-schedule-web`.

---

## Semántica canónica (corregida)

El contrato lo fija el productor (`rentacar-dashboard`, rama
`diego-alex-melo/whatsapp-schedule-dash`, `lib/schemas/whatsapp-schedule.ts`).
La primera versión web se desviaba en dos puntos; ambos están corregidos.

| Entrada | Antes | Ahora | Por qué |
|---|---|---|---|
| `null` / campo ausente | visible | visible | Sin horario configurado. |
| `{}` | **visible** | **oculto toda la semana** | Es un horario válido y vacío. Quien guarda un horario sin ventanas quiere "nunca", no "siempre". |
| día ausente o `[]` | oculto | oculto | Sin ventana ese día. |
| rango con typo (`'8:00-16:00'`) | **abría el día entero** | **se ignora** | Un dígito de menos abría el domingo 24 h sin aviso (D6). |
| día que no es lista | visible | visible | Falla de forma, no de configuración: fail-open. |
| payload no-objeto / reloj inválido | visible | visible | Fail-open. |

El fail-open queda reservado a lo que significa "no pudimos leer un horario".
Dentro de un horario legible, la ausencia de ventana oculta.

## D1 · Test de contrato

`packages/logic/src/composables/__tests__/chatStatusContract.test.ts` +
`fixtures/chat-status.contract.json`.

El fixture es la respuesta capturada de `/api/chat/status`. El test falla con un
mensaje que nombra la rama del dashboard si desaparece `whatsappSchedule`, si
cambia a string/array, si aparece una clave de día que el lector no entiende
(`monday`, `lun`), o si un rango deja de encajar en la gramática compartida.

Verificado en rojo-verde: quitando el campo del fixture caen 5 aserciones con el
mensaje `CONTRACT BROKEN: ...`.

Un caso está fijado a propósito como hueco conocido:
`legacyBeforeDashboardShipped` (la respuesta que producción servía antes de la
rama del dashboard) deja WhatsApp siempre visible. **Fusionar solo el lado web no
cambia nada en pantalla.** El orden de despliegue es dashboard primero.

## D3 · Los números del gate dependen de la versión de Node

La discrepancia (283/2366 reportado vs 278/2335 + 5 errores) no era una cifra
inventada: es Node 20 vs Node 22.

```
Node 20.18.1 → 5 archivos jsdom mueren con ERR_REQUIRE_ESM
               (html-encoding-sniffer@6 hace require() de un ESM)
Node 22.23.1 → esos mismos 5 archivos pasan (31 tests)
```

Comprobado corriendo los 5 archivos aislados bajo Node 22: `5 passed / 31 tests`.
278 + 5 = 283 y 2335 + 31 = 2366, que es exactamente el delta.

Toda cifra de esta rama se mide con el Node portátil:

```bash
export PATH="/tmp/node-v22.23.1-darwin-arm64/bin:$PATH"
export COREPACK_INTEGRITY_KEYS=0
```

## D4 · El test del widget ahora monta

`ChatWidget.whatsappSchedule.test.ts` era regex sobre el `.vue`. Ahora monta el
componente con el `useChatStatus` real y solo falsea el reloj y la respuesta
HTTP, luego lee el DOM (el widget se teletransporta a `<body>`).

Cubre: dentro de ventana, fuera de ventana, `{}`, `null`, fetch caído, y el tick
de 60 s cerrando la opción. Verificado con mutación: quitando el `v-if` del
`<li>`, caen 3 tests.

## D5 · Evidencia citada

La frase "probado con stash" describía un experimento real, pero hecho **antes**
del commit, con el árbol sucio. Sobre el commit ya hecho no se puede reproducir,
así que como evidencia no servía. El método reproducible es el que usó la
revisión y el que queda registrado acá:

```bash
git checkout 6df6402~1 -- <archivos fuente>   # y borrar los de test nuevos
pnpm typecheck                                 # contar errores
git checkout HEAD -- .                         # restaurar
```

Nada de esa afirmación llegó al repo (ni al mensaje del commit); vivía solo en el
reporte al coordinador. No hay texto que borrar, sí un método que dejar escrito.

## D7 · `visibilitychange`

Añadido junto al timer de 60 s y al `focus`. En móvil los timers de fondo se
estrangulan y `focus` no siempre dispara al volver a la pestaña, así que se
re-evalúa la ventana al recuperar visibilidad y se refresca el horario detrás.

---

## Fuera de alcance — decisión de producto pendiente (D2)

El horario tapa **solo el `<li>` de WhatsApp del FAB**. Siguen sin gate ~8
puertas por marca:

| Marca | Superficies sin gate |
|---|---|
| alquilatucarro | `layouts/default.vue` (header, menú móvil, footer), `error.vue`, `CategorySelectionSection.vue`, `pages/blog/index.vue`, `pages/gana/index.vue`, `pages/tiktok.vue` |
| alquilame | `layouts/default.vue`, `home/Hero.vue`, `home/Contact.vue`, `home/Faq.vue`, `city/Faq.vue`, `error.vue`, `CategorySelectionSection.vue`, `pages/gana/index.vue` |
| alquicarros | `layouts/default.vue`, `home/Hero.vue`, `home/Contact.vue`, `home/Faq.vue`, `city/Faq.vue`, `wizard/steps/StepVehicle.vue`, `error.vue`, `pages/gana/index.vue` |

Si el objetivo es no ofrecer un canal que nadie atiende de madrugada, el visitante
lo encuentra igual en el header y en el footer. Queda como follow-up explícito:
hay que decidir si el horario aplica al FAB o a todas las puertas **antes** de
anunciar la funcionalidad.

## Pendiente aguas arriba

Desplegar el dashboard primero. Hasta entonces la funcionalidad es un no-op
deliberado y cubierto por test.
