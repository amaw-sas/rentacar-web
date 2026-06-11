## Status: PENDING
## Blocked-By: step01/task-01-hero-restyle.code-task.md
## Completed:

# Task: F1 Step 6 — Requirements + FAQ (restyle, datos reales)

## Description
Reconstruir `#requisitos` y `#faqs` actuales como `app/components/home/Requirements.vue` y `app/components/home/Faq.vue` con el estilo del diseño, usando los datos reales (4 requisitos actuales; `faqs` del data source). El `FAQPage` schema permanece en `index.vue`.

## Background
El home actual tiene `#requisitos` (4 items: Reserva previa, Documento, Tarjeta crédito, Licencia) y `#faqs` (acordeón con `faqs` de `useData()` — Supabase). F1 los restila al diseño manteniendo datos y el schema `FAQPage`.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f1-home-design.md` (SCEN-F1-06; filas requirements/faq)
**Additional:**
- `app/pages/index.vue` (`#requisitos`, `#faqs`, `faqs`, `FAQPage` schema)
- Diseño: `/tmp/alqui_f1_design/dist/index.html` (`#requirements`, `#faq`)
- `app/components/Images/Persona.vue`

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. `Requirements.vue`: 4 requisitos reales (copy actual) con estilo del diseño + `ImagesPersona` (aspect-ratio CLS).
2. `Faq.vue`: acordeón con `faqs` del data source, estilo del diseño.
3. El `useSchemaOrg([FAQPage{...}])` permanece en `index.vue` (no se rompe).
4. Gradientes/fondos `bg-linear-*`; headings `.heading-*`.

## Dependencies
- **Step 1** (orquestación).
- **`faqs`**: vía `useData()`.

## Implementation Approach
1. Crear `Requirements.vue` y `Faq.vue` portando datos del `index.vue` actual al estilo del diseño.
2. Montar `<HomeRequirements/>` y `<HomeFaq/>` en `index.vue`; mantener el `FAQPage` schema.
3. Test: faqs reales en el acordeón; requisitos presentes; schema persiste.

## Acceptance Criteria
1. **Requirements + FAQ con datos reales (SCEN-F1-06)**
   - Given el home
   - When se ven requirements y faq
   - Then usan los 4 requisitos reales y `faqs` del data source con el estilo del diseño.
2. **FAQPage schema persiste**
   - Given `index.vue`
   - When se inspecciona el schema
   - Then el `FAQPage` sigue emitido desde `faqs`.
3. **Test de contrato**
   - Given los componentes
   - When corre el unit test
   - Then valida faqs reales en el acordeón y la presencia del schema.

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: alquilame, f1, home, faq, requirements, seo
- **Required Skills**: Vue 3, @nuxt/ui v4
- **Related Tasks**: Blocked-By step 1
- **Step**: 06 of 11
- **Files to Modify**: `app/components/home/Requirements.vue` (nuevo), `app/components/home/Faq.vue` (nuevo), `app/pages/index.vue`, `app/components/home/__tests__/requirements-faq.test.ts` (nuevo)
- **Files to Read**: `app/pages/index.vue`, `/tmp/alqui_f1_design/dist/index.html`
- **Context Estimate**: S
- **Scenario-Strategy**: required
