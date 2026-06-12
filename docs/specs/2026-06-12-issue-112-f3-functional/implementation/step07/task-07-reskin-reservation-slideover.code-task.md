## Status: PENDING
## Blocked-By:
## Completed:

# Task: Reskin slideover de reserva (ReservationResume + ReservationForm)

# Description
Aplicar el estilo de marca al slideover de reserva: el resumen (`ReservationResume`) y el formulario de datos del cliente (`ReservationForm`), SIN cambiar comportamiento, `data-testid`, schemas valibot ni los contratos load-bearing de contraste/leading.

## Background
El slideover de dos pasos vive dentro de `CategorySelectionSection`: paso 1 `ReservationResume` (resumen + precios), paso 2 `ReservationForm` (datos cliente). Contratos load-bearing en los tests: `ReservationForm.test.ts:13-21` — el `<u-form>` mantiene `class="light"` y NO añade `scheme-dark` (fix de contraste de labels: los tokens Nuxt UI resuelven a neutral-700 aun con la página en colorMode dark). `ReservationResume.test.ts:11-33` — `leading-tight`/`!leading-none` en los bloques de totales. Los `data-testid` `extra-driver-line`/`baby-seat-line`/`wash-line` viven en `ReservationResume`.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-12-issue-112-f3-functional-design.md` (Parte C — slideover)

**Additional References:**
- Plan Step 7; `__tests__/ReservationForm.test.ts`, `__tests__/ReservationResume.test.ts`

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. Reskin de `ReservationResume.vue` + `ReservationForm.vue` a tokens de marca (rojo, `.heading-*` Jakarta, `bg-linear` donde aplique).
2. Conservar `data-testid` `extra-driver-line`/`baby-seat-line`/`wash-line`.
3. PRESERVAR `class="light"` + NO `scheme-dark` en el `<u-form>` (contraste labels).
4. PRESERVAR `leading-tight`/`!leading-none` en los bloques de totales del resumen.
5. Schemas valibot + campos del formulario sin cambio. NUNCA `bg-gradient-to-*`. Ambos tests verdes sin debilitar.

## Dependencies
- Ninguna (reskin visual sobre componentes existentes; el slideover lo monta step06 pero los componentes son independientes).

## Implementation Approach
1. Aplicar tokens de marca al chrome de ambos componentes, preservando `class="light"`, los `leading-*` y los testids.
2. Correr ambos tests; ajustar solo styling de marca sin tocar los contratos nombrados.

**Note:** Suggested approach.

## Acceptance Criteria
1. **Reskin + testids**
   - Given el slideover (resumen + form) renderizado
   - When se inspecciona
   - Then estilo de marca (rojo, Jakarta) y `extra-driver-line`/`baby-seat-line`/`wash-line` presentes; `bg-gradient-to-` = 0
2. **Contraste preservado**
   - Given el `<u-form>` de `ReservationForm`
   - When se inspecciona
   - Then mantiene `class="light"` y NO tiene `scheme-dark`
3. **Tests verdes sin debilitar**
   - Given `ReservationForm.test.ts` + `ReservationResume.test.ts`
   - When corren
   - Then verdes (incl. `class="light"`/no-`scheme-dark` y `leading-tight`/`!leading-none`), sin debilitar

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: reskin, reservation, form, brand
- **Required Skills**: Vue 3, Tailwind 4, @nuxt/ui, valibot, Vitest
- **Related Tasks**: step06 (monta el slideover)
- **Step**: 07 of 09
- **Files to Modify**: `packages/ui-alquilame/app/components/ReservationResume.vue`, `packages/ui-alquilame/app/components/ReservationForm.vue`, `packages/ui-alquilame/app/components/__tests__/ReservationForm.test.ts`, `packages/ui-alquilame/app/components/__tests__/ReservationResume.test.ts`
- **Files to Read**: `docs/specs/2026-06-12-issue-112-f3-functional-design.md`
- **Context Estimate**: M
- **Scenario-Strategy**: required
