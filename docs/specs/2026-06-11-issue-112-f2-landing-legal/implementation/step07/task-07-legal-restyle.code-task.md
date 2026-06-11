## Status: PENDING
## Blocked-By:
## Completed:

# Task: F2 Step 7 — Legales restyle (estilo diseño, contenido de intermediación preservado)

## Description
Restilizar `app/pages/terminos-condiciones.vue` y `app/pages/politica-privacidad.vue` al estilo del diseño (layout de documento legal limpio, `font-heading` en h2s numerados) **conservando el contenido legal actual** — incluido el encuadre de intermediación. NO reemplazar el texto por el copy del diseño (operador directo).

## Background
El copy legal del diseño describe a alquilame como **operador directo** de alquiler y dropea "plataforma de intermediación / no somos empresa de alquiler" (modelo AMAW agregador). Reemplazarlo tergiversa el modelo de negocio → riesgo legal. Decisión: aplicar el ESTILO del diseño al CONTENIDO actual (con sus disclaimers de intermediación). El cambio de posicionamiento queda pendiente de validación legal.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f2-landing-legal-design.md` (SCEN-F2-07, F2-07b; Parte B)
**Additional:**
- `app/pages/terminos-condiciones.vue` (contenido actual, intermediación en sec. 2/7/8)
- `app/pages/politica-privacidad.vue`
- Diseño: `/tmp/alqui_f1_design/dist/{terminos,privacidad}/index.html` (SOLO estilo/layout, NO copiar el texto)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. Aplicar el estilo del diseño (layout legal, `font-heading` en h2 numerados, tipografía/espaciado) al **contenido actual** de ambas páginas.
2. **Conservar el encuadre de intermediación** ("plataforma de intermediación / no somos empresa de alquiler") — NO sustituir por el copy operador-directo del diseño.
3. Preservar `useSeoMeta`/`definePageMeta`/layout; los enlaces del footer (`politica-privacidad`, `terminos-condiciones`) siguen resolviendo 200.
4. `bg-linear-to-*` si aplica; headings `.heading-*`/`font-heading`.

## Dependencies
- **(ninguna de otros steps)** — independiente.

## Implementation Approach
1. Restilizar el template de cada página (h1/h2 con `font-heading`, layout de documento legal del diseño).
2. Mantener el texto/secciones actuales (intermediación) intactos.
3. Test: estilo aplicado + disclaimer de intermediación presente + sin copy operador-directo del diseño.

## Acceptance Criteria
1. **Estilo del diseño (SCEN-F2-07)**
   - Given `/terminos-condiciones` y `/politica-privacidad`
   - When se ven
   - Then tienen el layout legal del diseño (`font-heading` en h2s) y los enlaces del footer resuelven 200.
2. **Intermediación preservada (SCEN-F2-07b)**
   - Given `/terminos-condiciones`
   - When se inspecciona el contenido
   - Then conserva "plataforma de intermediación / no somos empresa de alquiler" — NO se reemplazó por el copy operador-directo del diseño.
3. **Test de contrato**
   - Given las páginas
   - When corre el unit test
   - Then valida h2 `font-heading` + presencia del disclaimer de intermediación + ausencia de marcadores del copy operador-directo.

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: alquilame, f2, legal, terminos, privacidad
- **Required Skills**: Vue 3, Tailwind 4
- **Related Tasks**: independiente
- **Step**: 07 of 08
- **Files to Modify**: `app/pages/terminos-condiciones.vue`, `app/pages/politica-privacidad.vue`, `app/components/city/__tests__/legal.test.ts` (nuevo)
- **Files to Read**: `app/pages/terminos-condiciones.vue`, `app/pages/politica-privacidad.vue`, `/tmp/alqui_f1_design/dist/terminos/index.html`
- **Context Estimate**: M
- **Scenario-Strategy**: required
