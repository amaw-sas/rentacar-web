# Plan: cotización por asesor

Spec: `docs/specs/cotizacion-por-asesor/design.md` · Escenarios (holdout, commit `d11c4b9`):
`docs/specs/cotizacion-por-asesor/scenarios/cotizacion-por-asesor.scenarios.md` (SCEN-001…015).
Rama: `diego-alex-melo/cotizacion-por-asesor` (desde `main` 9963fb0).

## Chunk 1: Mapa de archivos

| Archivo | Responsabilidad | Nuevo/cambia |
|---|---|---|
| `packages/logic/server/api/asesor/[code].get.ts` | Resolver un código exacto a `{ code, name }` (service role, activo, salesperson, no `-bot`), tope por IP, `no-store` | nuevo |
| `packages/logic/server/utils/ipWindowLimiter.ts` | Fábrica `createIpWindowLimiter({ windowMs, max })`: un `Map` propio por endpoint, mismas cabeceras `X-RateLimit-*`. Extraída de `exists.get.ts` (no confundir con `rate-limit.ts`, que usa Supabase) | nuevo (y `exists.get.ts` lo usa) |
| `packages/logic/src/utils/advisor/advisorCode.ts` | Normalizar y prevalidar un código (trim, minúscula, ≤ 60, sin espacio `/ ? #`) | nuevo |
| `packages/logic/src/utils/advisor/advisorStorage.ts` | Leer / escribir / borrar `{ code, name }` en `rentacar:asesor`; el valor viejo `'1'` cuenta como vacío y se borra | nuevo |
| `packages/logic/src/composables/useAdvisorMode.ts` | Activar (`?asesor=`), apagar (`=0`), revalidar, quitar el parámetro de la URL, avisos; expone `advisor: { code, name } \| null` | cambia |
| `packages/logic/src/utils/useDateFunctions.ts` | `formatQuoteDateTimeShort` («vie 23 oct. 7:30am») | cambia |
| `packages/logic/src/utils/helpers/quoteText/model.ts` | Modelo común: filas, flags derivados (horas extra, otra sede, plan compartido, Seguro Total parcial), dinero con « COP» | nuevo |
| `packages/logic/src/utils/helpers/quoteText/alquilame.ts`, `alquilatucarro.ts`, `alquicarros.ts` | Una plantilla por marca, palabra por palabra de la spec | nuevo |
| `packages/logic/src/utils/helpers/quoteText/index.ts` | `buildQuoteText(input, franchise)` elige plantilla | nuevo |
| `packages/logic/src/utils/helpers/buildQuoteText.ts` | Se borra (lo sustituye `quoteText/`); `utils/index.ts:157` pasa a exportar `./helpers/quoteText` | borra |
| `packages/logic/src/composables/useCopyQuote.ts` | Pasa la marca (`runtimeConfig.public.rentacarFranchise`) y la descripción sin código | cambia |
| `packages/ui-*/…/CopyQuotePanel.vue` (3) | Mostrar «Asesor: {name}»; montarse con `advisor` en vez de `isAdvisor` | cambia |
| `CategorySelectionSection.vue` (alquilame, alquilatucarro), `StepVehicle.vue` (alquicarros) | `v-if="advisor"`; sus pruebas de texto (`CopyQuotePanel.test.ts` ×2, `CopyQuotePanel.mount.test.ts`) y los stubs de `harness.ts` / `WizardStale.mount.test.ts` | cambia |
| `ReservationResume.vue` (alquilame) | **No cambia**: solo emite `shareWhatsapp`/`copyLink`; la URL la arma el padre (`ReservationResume.test.ts:503-510` exige que siga así) | — |
| `packages/logic/src/utils/referidoPath.ts` | `withReferido(path, code)`: inserta o reemplaza `referido/{code}` en una ruta de búsqueda de cualquier marca | nuevo |
| `getReservationShareUrl` en `CategorySelectionSection.vue` (alquilame, alquilatucarro) | Con asesor activo, enlace con `withReferido` | cambia |
| `packages/logic/src/composables/useRecordReservationForm.ts` | `user` = código del asesor guardado si existe, si no el referido de la ruta | cambia |
| `e2e/copiar-cotizacion.spec.ts` | Simula `/api/asesor/daniela`, comprueba el texto nuevo de alquilame | cambia |

Por qué así: la lógica de texto queda pura y en `logic` (se prueba sin montar nada), una
plantilla por archivo para que cada marca se lea entera; el estado del asesor se lee de
storage en el momento de reservar (mismo patrón que `chat_ref`), así `useRecordReservationForm`
no depende de un composable con ciclo de vida.

## Chunk 2: Pasos

Cada paso sigue SDD: prueba del escenario en rojo → código → verde. Lo hace un subagente
(sonnet) con criterios de aceptación; el orquestador revisa el diff y corre las pruebas.

1. **Endpoint `/api/asesor/{code}`** · S · sin dependencias · SCEN-015, SCEN-003.
   Extraer el tope por IP a la fábrica `ipWindowLimiter.ts`, una instancia por endpoint, para
   que `/api/asesor` no gaste el cupo de `exists` (`exists.get.test.ts` sigue verde sin tocarlo).
   Pruebas del handler con Supabase simulado: 200 exacto `{code,name}` + `no-store`; 404 para
   inexistente, `-bot`, `CAMILA-BOT`, formato inválido (sin consultar); 429 en la llamada 31;
   el `select` pide solo `code,name`.
2. **`advisorCode` + `advisorStorage`** · S · sin dependencias · SCEN-002, SCEN-004.
   Normalización (` Daniela ` → `daniela`), rechazos, lectura con `'1'` → null y borrado,
   storage bloqueado tolerado.
3. **`useAdvisorMode`** · M · pasos 1–2 · SCEN-001, 002, 004, 005, 006, 007.
   Pruebas de montaje con `$fetch` simulado: activar guarda y quita el parámetro conservando
   el resto de la query; 404 → aviso «Código de asesor no encontrado», nada guardado; red/5xx →
   aviso «No se pudo verificar el código, intenta de nuevo»; guardado → panel inmediato y
   revalidación (404 borra, 200 actualiza nombre, red/5xx/429 conserva); `?asesor=0` borra;
   sin parámetro ni guardado → cero llamadas a `$fetch`. En el mismo paso se cambian los 3
   consumidores (`v-if="advisor"`), se reescribe `useAdvisorMode.test.ts` y se actualizan las
   pruebas que fijan `isAdvisor` (2× `CopyQuotePanel.test.ts`, `CopyQuotePanel.mount.test.ts`,
   stubs de `harness.ts` y `WizardStale.mount.test.ts`), para que la suite quede verde al
   terminar el paso.
4. **`formatQuoteDateTimeShort` + modelo + plantilla Alquilame** · M · sin dependencias ·
   SCEN-008, SCEN-011 (columna alquilame). Fixture byte a byte del ejemplo aprobado (con un
   precio de silla concreto en vez de `$XX.XXX`) y una prueba por fila de la tabla de variantes.
5. **Plantilla Alquilatucarro** · S · paso 4 · SCEN-009, SCEN-011 (columna).
6. **Plantilla Alquicarros** · S · paso 4 · SCEN-010, SCEN-011 (columna). Más una prueba
   SCEN-012: con la misma entrada, los 3 textos difieren y contienen las mismas cifras.
7. **`useCopyQuote` con plantilla por marca** · S · pasos 4–6 · SCEN-008–010. Elige plantilla
   por `rentacarFranchise`; borra `buildQuoteText.ts` y sus pruebas del texto viejo; cambia el
   export de `utils/index.ts`; mantiene las pruebas de comportamiento (casillas, agotadas,
   `canCopy`).
7b. **Paneles: «Asesor: {name}»** · S · pasos 3 y 7 · SCEN-001 (UI). Los 3 `CopyQuotePanel.vue`
   reciben el nombre y lo muestran; pruebas de montaje por marca.
8. **Atribución en la reserva** · S · paso 2 · SCEN-013. Prueba de
   `useRecordReservationForm`: con asesor guardado `user = 'daniela'` aunque la ruta traiga
   `referido=otro`; sin asesor, igual que hoy. Una sola edición en `partialData` (línea ~117)
   cubre las ramas mensual y diaria; se borran los dos `//TODO add user field` obsoletos.
9. **`withReferido` + botón compartir** · S · paso 2 · SCEN-014. Pruebas de `withReferido`
   en las rutas de las 3 marcas (con y sin referido, con `/categoria/`); prueba de que
   `getReservationShareUrl` no cambia sin asesor.
10. **e2e** · S · pasos 7–9 · SCEN-001, 002, 007, 008. Se reescriben las 3 pruebas de
    `e2e/copiar-cotizacion.spec.ts` que usan `?asesor=1`: simula `/api/asesor/daniela` (200) y
    `/api/asesor/danela` (404) y la disponibilidad; comprueba el texto alquilame, la dirección
    sin `asesor`, el aviso de código no encontrado, y que el visitante no llama `/api/asesor/`.
11. **Validación en vivo** · M · pasos 1–10. Previews de Vercel de las 3 marcas (la
    disponibilidad local necesita una clave que el worktree no tiene). SCEN-001 a 015 con
    navegador, más una pasada exploratoria; consola sin errores, red sin fallos. La reserva de
    SCEN-013 se intercepta, no se crea.
12. **Cierre** · S · paso 11. Revisores (código, seguridad, casos borde, rendimiento), suite
    completa de las 4 suites con `--maxWorkers=2`, `pnpm lint` (tope 201 avisos), typecheck sin
    errores nuevos, `/verification-before-completion`, commit. Sin push hasta que el dueño lo
    autorice.

## Prerrequisitos

- `NUXT_SUPABASE_URL` y `NUXT_SUPABASE_ANON_KEY` ya existen en los 3 proyectos de Vercel
  (los usa `rentacar-data`).
- Para la prueba en vivo, `daniela` sigue activa en `referrals` (se consulta con el MCP de
  Supabase antes de empezar).

## Despliegue y vuelta atrás

- Al fusionar, los asesores que activaron `?asesor=1` pierden el botón: se les avisa que
  activen con su código.
- Vuelta atrás: revertir el merge; no hay migraciones ni datos nuevos.
- PR aparte en el panel de control: enlaces «Activar en…» por asesor. La web no depende de él.
