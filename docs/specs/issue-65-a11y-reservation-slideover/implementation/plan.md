---
name: issue-65-a11y-reservation-slideover-plan
created_by: claude
created_at: 2026-06-04T00:00:00Z
issue: 65
spec: ../design.md
scenarios: ../scenarios/a11y-reservation-slideover.scenarios.md
---

# Plan de implementación — Issue #65

Diseño y escenarios ya aprobados (ver `spec`/`scenarios`). Este plan solo aporta
el mapa de archivos y los pasos ordenados con escenarios embebidos. No repite
clarificación ni research: el spec pasó spec-review.

## Chunk 1: Form a11y + slideover restructure

### Mapa de archivos

| Archivo | Responsabilidad | Cambio |
|---|---|---|
| `packages/logic/src/composables/usePhoneField.ts` | Opciones del input de teléfono (compartido) | `+autocomplete:'tel'`, **quitar** `aria-label` |
| `packages/logic/src/utils/types/type/PhoneInputOptionsType.ts` | Tipo de esas opciones | `+autocomplete: string`, quitar `aria-label` (higiene, no rompe tsc) |
| `packages/ui-{atc,alquilame,alquicarros}/app/components/ReservationForm.vue` | Formulario de datos (×3 byte-idénticos) | `autocomplete` en nombres/apellidos/email; asociar `VueTelInput` al `UFormField` |
| `packages/ui-{atc,alquilame,alquicarros}/app/components/CategorySelectionSection.vue` | Grid + slideovers Resumen/Datos (×3 byte-idénticos) | des-anidar slideovers; `goToForm`/`backToResume`; reescribir watcher de auto-apertura; guard de 1 línea en watcher de URL |

Invariante de paridad: tras cada paso, los 3 archivos de cada componente quedan
**byte-idénticos** (mismo md5). Estrategia: editar `alquilatucarro`, luego copiar
el archivo a las otras dos marcas.

### Prerrequisitos

- Dev server por marca: `pnpm dev:alquilatucarro` (`:3000`).
- Backend admin en `:3000` para tarjetas reales; si no, stub de availability vía
  Playwright `page.route` (NO via agent-browser network route — no intercepta el
  POST; ver memoria de validación local).
- Confirmar API de `UFormField` (slot/id para asociar label) con Context7 antes
  del paso 2.

### Pasos

Orden: primero Problema B (independiente, bajo riesgo), luego Problema A
(reestructura, mayor riesgo). SDD: escenario → código → satisfacer → refactor.

**Paso 1 — autocomplete en campos de texto** · Size: S · Dep: ninguna
El formulario expone `autocomplete="given-name"` (nombres), `family-name`
(apellidos), `email` (correo); tipo y número de identificación NO exponen
`autocomplete` (no se fabrica token ni `"off"`).
- Archivos: `ReservationForm.vue` ×3.
- Escenario: SCEN-007 (atributos presentes en 3, ausentes en 2 de id).
- Aceptación: DOM renderizado muestra los 3 tokens; los 2 de id sin atributo;
  3 archivos byte-idénticos.

**Paso 2 — teléfono: autocomplete + nombre accesible "Teléfono"** · Size: M · Dep: Paso 1
El input de teléfono expone `autocomplete="tel"`, su nombre accesible computado
es "Teléfono" (vía `UFormField`), y ya no tiene `aria-label="Número de
teléfono"`.
- Archivos: `usePhoneField.ts`, `PhoneInputOptionsType.ts`, `ReservationForm.vue` ×3.
- Confirmar con Context7 si la asociación va por `for`/`id` o `aria-labelledby`
  (depende de cómo `VueTelInput` renderiza su `<input>`).
- Escenario: SCEN-008 (accessible name == "Teléfono", `aria-label` ausente,
  `autocomplete="tel"`).
- Aceptación: accessibility tree en runtime confirma el nombre; tsc verde;
  archivos byte-idénticos.

**Paso 3 — reestructura completa del slideover (un cambio atómico)** · Size: L · Dep: ninguna (independiente de 1-2, mismo archivo)
> Fusiona des-anidar + handlers + watcher de auto-apertura + guard de URL en
> **un solo paso**. Razón (spec-review): des-anidar sin reescribir la cascada
> deja un estado intermedio roto — un deep-link `?reservar=X` renderizaría dos
> `[role=dialog]` hermanos. El des-anidar no es demoable verde sin la reescritura
> de la cascada, así que van juntos.

Cambios en `CategorySelectionSection.vue` ×3:
1. "Datos" sale del `#footer` de "Resumen" → ambos hermanos top-level.
2. "Siguiente" → `goToForm` (`form=true; resume=false`, síncrono).
3. "Volver" en Datos → `backToResume` (`resume=true; form=false`, síncrono;
   reemplaza el handler de línea 163).
4. Watcher de auto-apertura (`:357-393`): `?reservar=X` abre **solo** `form`;
   `/categoria/X` o `?resumen=X` abre **solo** `resume` (elimina la cascada).
5. Guard de 1 línea en el watcher de `slideoverReservationResume` (`:332-338`):
   `if (!isOpen && !slideoverReservationForm.value) updateCategoriaUrl(undefined)`.

Invariante en todo momento y por toda ruta de entrada: a lo sumo un
`[role=dialog]`, con `aria-modal="true"`.
- Escenarios: SCEN-002a (click tarjeta → solo Resumen), SCEN-002 (Siguiente →
  solo Datos), SCEN-003 (Volver → reabre Resumen, URL `/categoria/X`), SCEN-001
  (deep-link `?reservar` → solo Datos), SCEN-001b (cold-load `/categoria/X` →
  solo Resumen), SCEN-004 (transición no borra `?reservar=X`), SCEN-005 (Volver
  en Resumen → cierra todo + limpia URL).
- Aceptación: los 7 escenarios pasan en runtime; conteo de `[role=dialog]` == 1
  en cada transición **y en cada deep-link**; archivos byte-idénticos.

**Paso 4 — regresión #25 + verificación integral** · Size: S · Dep: Paso 3
Confirmar que `onBeforeRouteLeave` sigue cerrando ambos refs y que Back no deja
`pointer-events:none` colgado en `<body>`. Correr los 11 escenarios en
Playwright sobre las 3 marcas (o al menos atc + un smoke en las otras dos por la
paridad byte-idéntica).
- Escenarios: SCEN-006 (regresión #25), SCEN-009 (paridad md5).
- Aceptación: Searcher responde tras Back; `<body>` sin `pointer-events:none`;
  md5 de los 6 archivos coincide por componente; `pnpm typecheck` + `pnpm lint`
  sin delta nuevo vs baseline.

## Testing Strategy

- **Runtime (principal)**: Playwright/`agent-browser` sobre preview de
  alquilatucarro — snapshots del accessibility tree, conteo de `[role=dialog]`,
  inspección de `window.location` y de `<body>` inline style. Stub de
  availability vía `page.route` si no hay backend en `:3000`.
- **Paridad**: `md5sum` de los 6 archivos UI tras cada paso (SCEN-009).
- **Estático**: `pnpm typecheck` y `pnpm lint` — delta-vs-baseline, no "verde"
  absoluto (baseline rojo conocido).
- Sin unit tests nuevos: el comportamiento es de DOM/a11y, se valida en runtime.

## Rollout

- Worktree `fix/issue-65-a11y-slideover-autocomplete` → PR contra `main`.
- Verificación en preview de Vercel (3 marcas). alquilatucarro es la única en
  dominio público; alquicarros/alquilame se validan vía alias `-git-main-`.
- Rollback: revertir el PR; cambios aislados a 4 archivos lógicos, reversibles.
