## Status: PENDING
## Blocked-By:
## Completed:

# Task: Header — CTA "Reservar" → `/reservas`

## Description
Añadir un CTA "Reservar" al header (`default.vue`) en desktop y en el menú móvil, que navegue a `/reservas`. Es el punto de entrada global a la búsqueda centralizada.

## Background
`default.vue` hoy NO tiene CTA "Reservar" top-level (los hits de "reserva" son links de ciudad y copy). Los guards f0-chrome escanean `default.vue` entero: `tests/f0-chrome.test.ts:152-160` (SCEN-F0-06 cero-azul) y `:142-150` (bg-linear). El CTA nuevo no debe introducir tokens azules ni `bg-gradient-to-*`.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-12-issue-112-f3-functional-design.md` (Parte C — Header)

**Additional References:**
- Plan Step 5; `packages/ui-alquilame/app/layouts/default.vue`; `packages/ui-alquilame/tests/f0-chrome.test.ts`

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. `default.vue`: CTA "Reservar" como `<NuxtLink to="/reservas">` visible en nav desktop Y en el menú móvil.
2. Estilo coherente con el chrome de marca (rojo); SIN tokens azules; SIN `bg-gradient-to-*`.
3. Cubrir con test de chrome (presencia del CTA + destino `/reservas`) — extender `tests/f0-chrome.test.ts` o un test nuevo, sin debilitar los guards existentes.

## Dependencies
- **`/reservas`** (step02): destino del CTA.

## Implementation Approach
1. Localizar la nav desktop y el bloque del menú móvil en `default.vue`.
2. Insertar el `<NuxtLink>` CTA en ambos.
3. Añadir aserciones de presencia/destino sin romper los guards cero-azul/bg-linear.

**Note:** Suggested approach.

## Acceptance Criteria
1. **CTA presente (ambos viewports)**
   - Given el header renderizado
   - When se inspecciona nav desktop y menú móvil
   - Then ambos contienen un CTA "Reservar" con `to="/reservas"`
2. **Respeta guards de chrome**
   - Given `default.vue` con el CTA
   - When corren `f0-chrome.test.ts` (cero-azul `:152-160`, bg-linear `:142-150`)
   - Then siguen verdes; `bg-gradient-to-` = 0; sin tokens azules en el CTA
3. **Cobertura**
   - Given el test de chrome
   - When corre
   - Then afirma la presencia + destino del CTA "Reservar"

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: chrome, header, cta, nav
- **Required Skills**: Vue 3, Nuxt layouts, Tailwind 4, Vitest
- **Related Tasks**: step02
- **Step**: 05 of 09
- **Files to Modify**: `packages/ui-alquilame/app/layouts/default.vue`, `packages/ui-alquilame/tests/f0-chrome.test.ts`
- **Files to Read**: `docs/specs/2026-06-12-issue-112-f3-functional-design.md`
- **Context Estimate**: S
- **Scenario-Strategy**: required
