## Status: PENDING
## Blocked-By: step01/task-01-hero-restyle.code-task.md, step02/task-02-fleet-real-price.code-task.md, step03/task-03-howitworks-valueprops-stats.code-task.md, step04/task-04-cities-internal.code-task.md, step05/task-05-reviews-restyle.code-task.md, step06/task-06-requirements-faq.code-task.md, step07a/task-07a-contact-announcement-fab.code-task.md, step07b/task-07b-partners-marquee.code-task.md, step08/task-08-remove-video-promo-schemas.code-task.md
## Completed:

# Task: F1 Step 9 — Headings adoptan .heading-* (Plus Jakarta)

## Description
Hacer que los headings de página del home adopten la utility `.heading-*` para que computen Plus Jakarta Sans, cerrando la deuda F0-03 (en F0 los headings Nuxt UI seguían en DM Sans).

## Background
F0 dejó `.heading-*` apuntando a `var(--font-heading)` (Plus Jakarta) pero ningún heading de página la usaba (computaban DM Sans). Con las secciones del home ya reconstruidas (steps 1–8), este paso revisa los headings de las nuevas secciones y asegura que usen las clases `.heading-*` apropiadas.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f1-home-design.md` (SCEN-F1-08; cross-cutting `.heading-*`)
**Additional:**
- `app/assets/css/rentacar-main/typography.css` (clases `.heading-hero/-page/-section/-card/-sub/-label`)
- `[[reference_tailwind4_gradient_bg_linear]]` (lección F0 relacionada)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. Los headings de las secciones del home (`home/*`) usan la clase `.heading-*` que corresponda por jerarquía.
2. No regresión visual de tamaños (combinar `.heading-*` con las clases de tamaño existentes).
3. Verificación de font-family computado se hace en step 10 (runtime).

## Dependencies
- **Steps 1–8** (todas las secciones existen).

## Implementation Approach
1. Revisar cada componente `home/*` y aplicar `.heading-section`/`.heading-card`/etc. a sus headings.
2. Test estático: los headings llevan clase `heading-*`.

## Acceptance Criteria
1. **Headings con .heading-* (SCEN-F1-08)**
   - Given los componentes `home/*`
   - When se inspeccionan sus headings
   - Then llevan una clase `.heading-*` (que resuelve a Plus Jakarta).
2. **Sin regresión de tamaño**
   - Given los headings
   - When renderizan
   - Then conservan su escala visual (tamaños) previa.
3. **Test de contrato**
   - Given los componentes
   - When corre el unit test
   - Then valida que los headings de sección llevan clase `heading-*`.

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: alquilame, f1, home, typography, f0-debt
- **Required Skills**: Vue 3, Tailwind 4, CSS
- **Related Tasks**: Blocked-By steps 1–8
- **Step**: 09 of 11
- **Files to Modify**: `app/components/home/*.vue` (headings), `app/components/home/__tests__/headings.test.ts` (nuevo)
- **Files to Read**: `app/assets/css/rentacar-main/typography.css`, `app/components/home/*.vue`
- **Context Estimate**: M
- **Scenario-Strategy**: required
