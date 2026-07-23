# Plan de implementación — issue #366

**Diseño fuente**: `docs/specs/2026-07-23-issue-366-cta-confirmar-reserva-design.md` (commit 11a5198)
**Fecha**: 2026-07-23
**Modo**: interactivo

Las fases de clarificación, research y diseño se cubrieron en el brainstorming y quedaron en
el design doc, con sus 40 citas verificadas por script. Este documento aporta lo que
faltaba: mapa de archivos, pasos ordenados y verificación con comandos reales.

Los baselines de este plan están **medidos en esta rama**, no recordados.

## Mapa de archivos

Cada archivo con una responsabilidad. Ninguno se parte: el cambio cabe en la estructura que
ya existe.

| Archivo | Responsabilidad tras el cambio |
|---|---|
| `packages/ui-alquicarros/app/composables/useReservationWizard.ts` | Máquina de pasos. Deja de opinar sobre validez de formulario: `canAdvance('datos')` es `true` y `WizardAdvanceState` pierde `formValid` |
| `packages/ui-alquicarros/tests/reservation-wizard-machine.test.ts` | Contrato unitario de la máquina. El caso `'datos'` pasa a asertar que no gatea |
| `packages/ui-alquicarros/tests/reservation-wizard-steps.test.ts` | Guard de fuente del CTA. Gana el aserto de que `ctaDisabled` conserva `!props.canAdvance` |
| `packages/ui-alquicarros/app/components/wizard/ReservationWizard.vue` | Orquestación. Pierde `formValid` de `advanceState` y `politicaPrivacidad` del `storeToRefs` |
| `packages/ui-alquicarros/app/components/wizard/WizardSummary.vue` | Resumen + CTA. Gana estado de carga en sus dos botones. **`ctaDisabled` intacto** |
| `packages/ui-alquicarros/app/components/ReservationForm.vue` | Formulario + validación. Gana handler nombrado de `@error` que lleva el foco al primer campo inválido |
| `packages/ui-alquicarros/app/components/wizard/steps/StepData.vue` | Paso 5. Gana el bloque `role="alert"` del estado desconocido |
| `packages/ui-alquicarros/app/components/wizard/steps/StepVehicle.vue` | Paso 2. Sus dos anclas de WhatsApp pasan a leer de `franchise` |
| `packages/ui-alquicarros/tests/contact-number.test.ts` | Guard de números de contacto. El aserto del wizard pasa a exigir `franchise.whatsapp` |
| `packages/logic/src/stores/useStoreReservationForm.ts` | Estado del formulario. Gana `unknownStatusReserveCode` |
| `packages/logic/src/stores/useStoreSearchData.ts` | Estado de búsqueda. Limpia el código nuevo donde ya limpia el lock |
| `e2e/alquicarros-reservation-wizard.spec.ts` | Holdout e2e de la marca. Acoge SCEN-366-01..05 y la migración de SCEN-311-03 a cero-POST |
| `docs/specs/issue-366-cta-confirmar-reserva/scenarios/` | Holdout de escenarios (P1) |

## Prerequisitos

```bash
# 1. Sin esto, TODO /api responde 500 y los e2e se saltan en silencio (hoy NO existe aquí)
cp /home/pabloandi/proyectos/amaw/rentacar/rentacar-web/.env.local ./.env.local

# 2. Baseline de typecheck. NUNCA `pnpm typecheck` en la raíz: congela el disco en WSL2
ionice -c3 nice -n19 pnpm --filter ui-alquicarros typecheck 2>&1 | tail -3
```

`typecheck` **no corre en CI** (el pipeline tiene lint con `continue-on-error`, cuatro
suites unitarias, el guard de recolección y el job e2e gated por secretos). Es un gate
local, y el baseline de arriba solo cubre `ui-alquicarros`: P4 toca `packages/logic`, cuyos
tipos alimentan las tres marcas. O se capturan las tres, o el AC de P10 declara que solo
alquicarros está gateado.

### Reglas del hook SDD que gobiernan todos los pasos

Tres cosas que paran commits aunque el árbol esté verde:

1. **Una invocación de `/verification-before-completion` por commit.** El hook intercepta
   todo `git commit` sin `--no-verify` y consume el flag (lee-y-borra). Diez pasos son diez
   commits: diez invocaciones. El gate ya está activo desde P1, porque el repo ya tiene
   `*.scenarios.md` de issues anteriores.
2. **Cuando un paso toca un `.scenarios.md`** (P1 y P7), el orden es *cambiar el escenario →
   invocar verification → commitear*. La evidencia lleva un mapa de hashes de escenarios y
   debe coincidir con el estado actual; al revés el commit se bloquea aunque la skill se
   haya invocado.
3. **Editar el test antes que el fuente, dentro de cada paso.** El guard bloquea editar un
   fuente sin test cuando la sesión acumula fuentes sin tests, y su detección es por nombre
   de archivo: `useReservationWizard.ts`, `WizardSummary.vue`, `StepData.vue`,
   `StepVehicle.vue` y `useStoreSearchData.ts` **no** tienen test homónimo (sus tests se
   llaman `reservation-wizard-*`, `contact-number`, `useStoreSearchData.<sufijo>`). Es
   además el orden que SDD exige.

Y una trampa de forma: el guard deniega ediciones de test que **reduzcan** el número de
asertos mientras el estado de tests sea `passing: false`. Los dos cambios de P2 (quitar
`toBeDisabled()`, reescribir el caso unitario) caen justo ahí. Se hacen en **una sola**
operación `Edit` cuyo `new_string` contenga igual o más asertos que el `old_string` — nunca
borrar primero y añadir después.

Higiene: `pw-report.json` no está en `.gitignore` (sí lo está `e2e-results/`). Borrarlo tras
cada corrida o acabará en un commit.

El dev server no necesita `PORT`: `nuxt.config.ts:12-14` ya fija 4001 y Playwright reutiliza
el que esté vivo.

### Baselines medidos hoy en esta rama

| Suite | Resultado |
|---|---|
| `pnpm --filter @rentacar-main/logic test` | 138 files / 1002 tests · **todo verde** |
| `pnpm --filter ui-alquicarros test` | 52 files / 638 tests · **todo verde** |

Ambas corren en CI sin `continue-on-error`: el criterio es verde absoluto, más los tests
nuevos que cada paso añada. (Una nota previa hablaba de 3 flaky en `logic`; no se
reprodujeron en esta rama — no se usa como excusa para aceptar fallos.)

---

## Fase 1 — Contrato observable

### P1 · Holdout de escenarios · S · dep: ninguna

Crear `docs/specs/issue-366-cta-confirmar-reserva/scenarios/cta-confirmar-reserva.scenarios.md`
con SCEN-366-01..06 del design doc.

El guard SDD rechaza la primera escritura de un `*.scenarios.md` no-tracked dentro de un
worktree, y también los comandos Bash que escriban en directorios de scenarios. Se autora
main-clone-side con plumbing (índice temporal: `hash-object` → `update-index` →
`commit-tree` → `update-ref`) y se hereda aquí con `git reset --hard`. **Stashear antes**:
el reset destruye trabajo sin commitear.

`git reset --hard` está en `ask` dentro de `.claude/settings.json`: pedirá confirmación. Es
esperado, no un fallo — conviene saberlo si este paso lo ejecuta un sub-agente.

**Aceptación**: `git ls-files` lista el archivo y su hash en disco iguala el del commit.

No probar el write-once editando el archivo a propósito: cada divergencia sin
`amend_request` incrementa el contador de intentos de amend, y al segundo el hook fuerza un
STOP de sesión con escalación. Quemaría media ruta de amend antes de llegar a P7, que sí la
necesita.

---

## Fase 2 — El CTA deja de mentir

### P2 · Consentimiento fuera del gate + el error se ve (D1 + D6) · M · dep: P1

El usuario llega al paso 5 con la casilla sin marcar, encuentra un botón pulsable, lo pulsa
y el formulario lo lleva hasta la casilla —con foco— sin registrar nada.

**D1 y D6 van juntos a propósito.** El propio diseño dice que D1 sin D6 *"cambia un botón
gris mudo por un click sin efecto visible, que es el mismo defecto con otra cara"*. Un paso
cuyo estado final es el defecto del issue no es un incremento entregable. El gate es uno.

Son dos commits, y el reparto está fijado para que **ambos sean verdes por separado**:

- **Commit A**: D1 + caso unitario reescrito + migración del aserto de #311 a cero-POST +
  guard de fuente en `reservation-wizard-steps.test.ts`. La migración va aquí, no en el
  commit B: si A llevara D1 solo, dejaría el job e2e rojo hasta B.
- **Commit B**: D6 + los tests de SCEN-366-01/02/03.

Contenido:
- `canAdvance('datos') → true`; `formValid` sale de `WizardAdvanceState`, de `advanceState`
  y `politicaPrivacidad` del `storeToRefs`.
- Handler **nombrado** en `@error` (no arrow inline: `ReservationForm.test.ts:11` corta el
  tag en el primer `>`), que resuelve `document.getElementById(err.id)`, hace
  `scrollIntoView` y `focus({preventScroll: true})`. Fallback `#telefono`: el id de ese
  campo no existe en el DOM porque VueTelInput no usa `useFormField`.
- Reescribir el caso unitario `'datos is gated by form validity'`.
- **Migrar el aserto de #311 en el e2e** (`alquicarros-reservation-wizard.spec.ts:223-227`):
  `toBeDisabled()` → contador de POST a `/api/reservations/record` en cero, patrón de
  `reservation-privacy-consent.spec.ts:116-120`. Sin esto el árbol queda rojo durante todos
  los pasos siguientes, porque ese aserto vive dentro del test SCEN-W-06/07/11 que CI sí
  ejecuta. El aserto hermano de SCEN-311-04 (`toBeEnabled()` tras marcar la casilla) sigue
  siendo cierto y **no se toca**.
- Añadir SCEN-366-01, 02 y 03 como tests nuevos en ese mismo spec.
- Añadir a `reservation-wizard-steps.test.ts` (junto a sus asertos de `isSubmittingForm` y
  `formSubmitLocked`, línea 175-181) el guard permanente de que `ctaDisabled` conserva
  `!props.canAdvance`.

**Aceptación**:
- `pnpm --filter ui-alquicarros test` → 52 files / 638+ tests, todo verde.
- `git diff --exit-code <SHA_P1> -- packages/ui-alquicarros/app/components/wizard/WizardSummary.vue`
  sin salida (acotado al commit de P1: el diff acumulado caduca cuando P3 toque el archivo).
- SCEN-366-01, 02 y 03 satisfechos con `skipped == 0`.
- Con los cinco campos vacíos, el foco cae en un campo nombrado de antemano, estable en
  `--repeat-each=3`. Si el orden de `issues` de valibot resulta inestable, se ancla al
  primero en orden de DOM y se documenta.
- `pricing-horizon-alquicarros.spec.ts` verde: es la suite que detecta la regresión del gate
  de los pasos 1-4 y **no corre en CI**.

---

## Fase 3 — El envío se anuncia

### P3 · Estado de carga en los dos CTAs (D2) · S · dep: P2

Durante el round-trip el usuario ve un spinner y "Confirmando…" en vez de un botón gris.

`:loading="isSubmittingForm"` y label condicional en `wizard-continue-desktop-test` y
`wizard-continue-mobile-test`. Test nuevo en el spec de la marca.

**Aceptación**: SCEN-366-04 satisfecho — spinner vía `[data-slot="leadingIcon"]`, label
"Confirmando…", y **un solo** POST tras un segundo click con `force: true` (el botón está
deshabilitado; sin `force` el actionability check cuelga 20 s).

---

## Fase 4 — El bloqueo se explica

### P4 · El código de reserva sobrevive (D4 + D7) · S · dep: P3

`unknownStatusReserveCode` declarado, asignado en la rama de status desconocido, exportado, y
limpiado en `useStoreSearchData.ts:81` junto al lock.

**Aceptación** — toca `packages/logic`, así que las **cuatro** suites que CI exige:
```
pnpm --filter @rentacar-main/logic test    → 138 files / 1002+ tests verde
pnpm --filter ui-alquicarros test          →  52 files /  638+ tests verde
pnpm --filter ui-alquilatucarro test       → verde
pnpm --filter ui-alquilame test            → verde
```
Más: tras una búsqueda nueva el ref queda en `null`, con test unitario del store.

### P5 · El bloque persistente (D3) · M · dep: P4

Cuando el servidor devuelve un estado que la web no sabe interpretar, el paso 5 explica qué
pasó, da el código y ofrece WhatsApp — y sigue ahí cuando el toast se va.

Bloque `role="alert"` en `StepData` bajo `v-if="formSubmitLocked"`.

**Aceptación**: SCEN-366-05 satisfecho con el stub
`{reservationStatus:'desconocido', reserveCode:'E2ECODE'}` (200, JSON), sin esperar los 25 s
del toast. Además, aserto explícito: el bloque sigue visible tras volver al paso 2 sin
re-buscar, y desaparece al lanzar una búsqueda nueva.

### P6 · El contacto sale de `app.config` (D5) · S · dep: P5

Las dos anclas de `StepVehicle` y la de `StepData` leen `useAppConfig().franchise`. El
literal `3187703670` desaparece del wizard. `contact-number.test.ts` pasa a exigir
`franchise.whatsapp` y ausencia de `wa.me/<dígitos>`, igual que ya hace con `error.vue`.

**Aceptación**: SCEN-366-06 satisfecho; el `href` sigue resolviendo
`https://wa.me/573187703670` (destino idéntico, verificable en el DOM).

---

## Fase 5 — Cierre

### P7 · Enmienda del holdout de #311 · S · dep: P6 · **riesgo alto, ya no bloquea el árbol**

El escenario `consentimiento-datos-pre-marcado.scenarios.md:48` dice "el CTA está
deshabilitado". Se enmienda al invariante real: sin consentimiento no hay registro.

El e2e ya migró en P2, así que este paso es solo documental y su bloqueo no deja nada rojo.
El protocolo de amend tiene cuatro compuertas con juez independiente y HMAC ligado a la
sesión: **no escribir el marcador a mano** — el propio hook describe eso como el bypass que
el endurecimiento previene.

**Aceptación**: el texto enmendado nombra "cero requests a `/api/reservations/record`" y el
e2e de P2 lo asserta.
**Si se atasca**: no forzar. Documentar la enmienda en el cuerpo del PR y dejar constancia
de la contradicción pendiente. Decisión del usuario.

### P8 · Suites locales que el CI no mira · S · dep: P7

```
BRAND=alquicarros pnpm exec playwright test --project=chromium e2e/pricing-horizon-alquicarros.spec.ts
BRAND=alquicarros pnpm exec playwright test --project=chromium e2e/alquicarros-reserva-mensual.spec.ts
```
Más el guard de recolección de las **tres** marcas: un error de sintaxis en el spec de
alquicarros tumba el guard de todas.
```bash
for b in alquilatucarro alquicarros alquilame; do
  BRAND=$b pnpm exec playwright test --list --reporter=list 2>&1 | tail -1
done
# pisos: alquilatucarro ≥1000 tests/42 files · alquicarros y alquilame ≥750 tests/30 files
```

**Aceptación**: ambas suites verdes; los tres contadores por encima de su piso.

### P9 · Validación en runtime · M · dep: P8

Lo que los tests no ven: `/agent-browser` sobre el dev server para el foco de D6 con varios
errores, el spinner real de D2 y el bloque de D3; `/dogfood` exploratorio del paso 5.

**Aceptación**: evidencia de runtime para SCEN-366-02 (foco), 04 (spinner) y 05 (bloque);
cero errores de consola y cero respuestas 4xx/5xx de mismo origen bajo `/api` (el dev server
emite ruido ajeno al cambio; acotar evita perseguir fantasmas).

### P10 · Verificación y PR · S · dep: P9

`/verification-before-completion` con los seis escenarios ejecutados, luego `/pull-request`
(code-reviewer, security-reviewer, edge-case-detector, performance-engineer). `Closes #366`.
Sin `git push` sin autorización explícita.

**Aceptación**: `[6/6] escenarios satisfechos` con salida fresca; delta de typecheck contra
el baseline del prerequisito en cero.

---

## Comandos

**Unitarios** — los cuatro que CI exige verdes:
```bash
pnpm --filter @rentacar-main/logic test
pnpm --filter ui-alquicarros test
pnpm --filter ui-alquilatucarro test
pnpm --filter ui-alquilame test
pnpm --filter ui-alquicarros exec vitest run tests/reservation-wizard-machine.test.ts   # un archivo
```
Ojo: esa ruta es **relativa al paquete**, no a la raíz — el resto de comandos de este
documento sí son root-relative, y mezclarlos da `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`.

**Un spec e2e de una marca**:
```bash
BRAND=alquicarros pnpm exec playwright test --project=chromium e2e/alquicarros-reservation-wizard.spec.ts
BRAND=alquicarros pnpm exec playwright test --project=chromium \
  e2e/alquicarros-reservation-wizard.spec.ts -g "SCEN-366-02" --repeat-each=3
```

**Anti-vacuidad** — obligatorio antes de decir "SCEN satisfecho". Sin `.env.local` los tests
se saltan y el reporte sale verde sin haber probado nada:
```bash
BRAND=alquicarros PLAYWRIGHT_JSON_OUTPUT_NAME=pw-report.json pnpm exec playwright test \
  --project=chromium --reporter=list,json \
  e2e/alquicarros-reserva-mensual.spec.ts e2e/alquicarros-reservation-wizard.spec.ts
jq '{passed: .stats.expected, failed: .stats.unexpected, skipped: .stats.skipped}' pw-report.json
```

## Estrategia de verificación

| Nivel | Qué cubre | Dónde |
|---|---|---|
| Unitario | `canAdvance`, store, ref nuevo | `packages/ui-alquicarros/tests/`, `packages/logic/src/**/__tests__/` |
| Nivel-fuente | Contacto sin literales, tag de `u-form`, `ctaDisabled` intacto | `contact-number.test.ts`, `ReservationForm.test.ts`, `reservation-wizard-steps.test.ts` |
| e2e | Los 6 escenarios | `alquicarros-reservation-wizard.spec.ts` (el único que CI corre para esta marca) |
| Regresión no-CI | Gate de los pasos 1-4 | `pricing-horizon-alquicarros.spec.ts`, local |
| Runtime | Foco, spinner, consola | agent-browser + dogfood en `:4001` |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| El guard SDD bloquea P1 en el worktree | Alta | Receta plumbing main-clone-side, probada en #311 y #374 |
| e2e verdes en vacío por falta de `.env.local` | Alta si se olvida | Prerequisito + comprobación `skipped == 0` con `jq` |
| El protocolo de amend bloquea P7 | Alta | Ya no bloquea el árbol (el e2e migró en P2); fallback documentado |
| El orden de `issues` de valibot hace el foco no determinista | Media | `--repeat-each=3`; anclar al primero en orden de DOM |
| Un e2e nuevo no se ejecutaría en CI | Alta si se olvida | Todo va dentro de `alquicarros-reservation-wizard.spec.ts` |
| Tocar `packages/logic` rompe una marca hermana | Media | P4 exige las cuatro suites, no solo la de logic |
| El hook lee la migración del e2e de P2 como reward hacking | Alta | Un solo `Edit` con `new_string` de asertos ≥ `old_string` |
| Un commit se bloquea por falta de flag de verificación | Alta | Una invocación de la skill por commit; el flag se consume |
| El guard de ordenación bloquea 5 fuentes sin test homónimo | Media | Editar el test antes que el fuente dentro de cada paso |

## Rollback

Cada fase es un commit independiente y revertible. El orden de dependencia permite revertir
de P6 hacia atrás sin tocar lo anterior. El único cambio cross-marca es el ref de
`packages/logic`, aditivo: revertirlo no afecta a alquilame ni alquilatucarro.
