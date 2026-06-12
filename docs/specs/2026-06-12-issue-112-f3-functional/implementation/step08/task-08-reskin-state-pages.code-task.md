## Status: PENDING
## Blocked-By:
## Completed:

# Task: Reskin páginas de estado (pendiente / sindisponibilidad / reservado)

## Description
Aplicar el estilo de marca alquilame a las tres páginas de estado del flujo de reserva, conservando íconos semánticos, CTAs, copy y el confetti — sin cambiar comportamiento.

## Background
`pendiente.vue` (solicitud en proceso, icono reloj), `sindisponibilidad.vue` (sin disponibilidad, icono X, CTA "Modificar búsqueda" + WhatsApp), `reservado/[reserveCode]/index.vue` (confirmada, icono check, código de reserva, `js-confetti` lazy). Las tres usan contenedor `text-white` sobre el root oscuro de marca. NO exponen `data-testid` (grep = 0) → reskin solo-visual, sin contrato de testid que preservar.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-12-issue-112-f3-functional-design.md` (Parte C — páginas de estado)

**Additional References:**
- Plan Step 8

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. Reskin de marca (headings `.heading-*` Jakarta, acentos rojos, `[--ctx-text-primary:#fff]` donde haga falta sobre fondo oscuro) en las 3 páginas.
2. Conservar íconos semánticos (reloj #ff8a00 / X rojo / check verde), CTAs (modificar búsqueda, WhatsApp, mail), copy y el código de reserva.
3. `reservado` conserva el `js-confetti` lazy en `onMounted`.
4. Sin cambio de comportamiento. NUNCA `bg-gradient-to-*`.

## Dependencies
- Ninguna.

## Implementation Approach
1. Aplicar tokens de marca al chrome de cada página, preservando íconos/CTAs/copy.
2. Verificar el confetti de `reservado` intacto.

**Note:** Suggested approach.

## Acceptance Criteria
1. **Reskin de marca**
   - Given `/pendiente`, `/sindisponibilidad`, `/reservado/{code}` renderizadas
   - When se inspeccionan
   - Then headings Jakarta + acentos de marca; `bg-gradient-to-` = 0
2. **Semántica preservada**
   - Given cada página de estado
   - When se inspecciona
   - Then conserva su icono semántico, CTAs (modificar búsqueda / WhatsApp / código) y copy; `reservado` mantiene `js-confetti`
3. **Sin regresión de comportamiento**
   - Given el flujo que aterriza en cada estado
   - When se navega
   - Then el comportamiento es idéntico (solo cambió el estilo)

## Metadata
- **Complexity**: Low
- **Estimated Effort**: M
- **Labels**: reskin, state-pages, brand
- **Required Skills**: Vue 3, Nuxt pages, Tailwind 4
- **Related Tasks**: —
- **Step**: 08 of 09
- **Files to Modify**: `packages/ui-alquilame/app/pages/pendiente.vue`, `packages/ui-alquilame/app/pages/sindisponibilidad.vue`, `packages/ui-alquilame/app/pages/reservado/[reserveCode]/index.vue`
- **Files to Read**: `docs/specs/2026-06-12-issue-112-f3-functional-design.md`
- **Context Estimate**: S
- **Scenario-Strategy**: required
