---
name: issue-65-a11y-reservation-slideover-summary
created_by: claude
created_at: 2026-06-04T00:00:00Z
issue: 65
epic: 63
ola: 0
---

# Planning Summary — Issue #65

**Goal**: arreglar dos defectos de a11y del flujo de reserva (un solo slideover
modal activo + `autocomplete`/nombre accesible en el formulario) en las 3 marcas.

## Artefactos
- `design.md` — diseño (spec-reviewed, approved)
- `scenarios/a11y-reservation-slideover.scenarios.md` — 11 escenarios (holdout SDD)
- `implementation/plan.md` — plan de 4 pasos (plan-reviewed, approved)

## Decisiones clave
1. **Des-anidar + mutuamente excluyentes** (no `inert`): un solo `[role=dialog]`
   por construcción, no por parche de atributo.
2. **El diagnóstico de la auditoría era erróneo**: el defecto NO es falta de
   `aria-modal` sino **dos modales simultáneos**. reka-ui NO emite `aria-modal`
   en ningún caso (verificado: 0 ocurrencias en su dist), así que se inyecta
   explícitamente vía la prop `content`.
3. **Quitar `aria-label="Número de teléfono"`**: violaba WCAG 2.5.3 Label in Name;
   el nombre accesible pasa a "Teléfono" vía un `<label for="telefono">` propio
   dentro del `UFormField` (no por `useFormField`, que `VueTelInput` no usa).
4. **Reestructura atómica** (Paso 3): un-nest + watcher + guard en un commit
   indivisible — evita el estado intermedio de dos diálogos en deep-link.

## Complejidad
- **Overall**: M · **Riesgo**: Medio (flujo de conversión + cicatriz #25)
- Paso 3 (L) es el de mayor riesgo de presupuesto.

## Próximos pasos
1. `/scenario-driven-development` con los 11 escenarios como holdout.
2. Verificación runtime Playwright sobre las 3 marcas.
3. `/verification-before-completion` antes de PR.

## Open questions
- API exacta `UFormField`→`VueTelInput` (Context7 al implementar; fallback
  `aria-labelledby`).
