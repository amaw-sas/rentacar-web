## Status: PENDING
## Blocked-By:
## Completed:

# Task: Reskin grilla de resultados (CategorySelectionSection + CategoryCard)

## Description
Aplicar el estilo de marca alquilame (rojo, Plus Jakarta, gradientes `bg-linear`, contraste) al chrome de la grilla de resultados y las tarjetas de categoría, SIN cambiar comportamiento, `data-testid`, ni el color de la acción de confirmar (verde, intencional).

## Background
`CategorySelectionSection.vue` orquesta la grilla + un slideover único de dos pasos (#65). Sus CTAs de confirmar/avanzar usan verde (`:104` `bg-green-500`, `:149`/`:173` `bg-green-700`). **Decisión de diseño:** el verde = semántica de confirmar/avanzar (distinta de los CTAs rojos navegacionales) y SE CONSERVA; el reskin de marca aplica al chrome de tarjeta/grilla (bordes, headings, precios, fondos), NO al color de la acción de confirmar. Por eso el contrato de loading verde del test (`__tests__/CategorySelectionSection.test.ts:22-31`: `disabled:bg-green-700`/`aria-disabled:bg-green-700`/`disabled:opacity-80`/`aria-disabled:opacity-80`, que vencen el `disabled:bg-inverted` neutro de Nuxt UI) se PRESERVA tal cual. `CategoryCard.vue` tiene el carrusel de modelos + precios.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-12-issue-112-f3-functional-design.md` (Parte C — grilla)

**Additional References:**
- Plan Step 6 (decisión de color verde); `__tests__/CategorySelectionSection.test.ts`; [[reference_tailwind4_gradient_bg_linear]], [[reference_reka_ui_modal_handoff_pointer_events]]

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. Reskin del chrome de `CategorySelectionSection.vue` + `CategoryCard.vue` a tokens de marca (rojo, `.heading-*` Jakarta, `bg-linear-to-*`, `[--ctx-text-primary:#fff]` en fondos oscuros/rojos).
2. Conservar `data-testid`: `reservation-next-test`, `reservation-resume-back-test`, `reservation-form-back-test`.
3. Conservar los CTAs de confirmar/avanzar en verde (`:104,149,173`) + su contrato de loading (`disabled:bg-green-700`/`aria-disabled`/`opacity-80`) — sin tocar.
4. Slideover único (#65) sin cambio de comportamiento (no reintroducir swap de capas que filtra `pointer-events`).
5. NUNCA `bg-gradient-to-*`. `CategorySelectionSection.test.ts` verde sin debilitar.

## Dependencies
- Ninguna (independiente; el reskin es visual sobre componentes existentes).

## Implementation Approach
1. Recorrer las clases de `CategorySelectionSection.vue` + `CategoryCard.vue`, aplicar tokens de marca al chrome, dejar los CTAs verdes intactos.
2. Verificar gradientes renderizados (computed `background-image ≠ none`).
3. Correr el test del componente; ajustar solo si una aserción de styling de marca lo requiere (sin tocar el contrato verde).

**Note:** Suggested approach.

## Acceptance Criteria
1. **Chrome de marca**
   - Given la grilla de resultados renderizada
   - When se inspecciona
   - Then tarjetas/grilla con tokens de marca (rojo, headings Jakarta legibles, `bg-linear` que renderiza, `[--ctx-text-primary:#fff]` en fondos oscuros); `bg-gradient-to-` = 0
2. **Engine + verde intactos**
   - Given la grilla + slideover
   - When se inspeccionan
   - Then `reservation-next-test`/`reservation-resume-back-test`/`reservation-form-back-test` presentes; los CTAs de confirmar siguen verdes; slideover único (#65) sin cambio de comportamiento
3. **Contrato de loading preservado**
   - Given `__tests__/CategorySelectionSection.test.ts`
   - When corre
   - Then verde sin debilitar (incluye `disabled:bg-green-700`/`aria-disabled:bg-green-700`/`disabled:opacity-80`)

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: reskin, results, slideover, brand
- **Required Skills**: Vue 3, Tailwind 4, @nuxt/ui, Vitest
- **Related Tasks**: step07 (slideover interno)
- **Step**: 06 of 09
- **Files to Modify**: `packages/ui-alquilame/app/components/CategorySelectionSection.vue`, `packages/ui-alquilame/app/components/CategoryCard.vue`, `packages/ui-alquilame/app/components/__tests__/CategorySelectionSection.test.ts`
- **Files to Read**: `docs/specs/2026-06-12-issue-112-f3-functional-design.md`, `packages/ui-alquilame/app/components/city/Hero.vue` (tokens marca)
- **Context Estimate**: M
- **Scenario-Strategy**: required
