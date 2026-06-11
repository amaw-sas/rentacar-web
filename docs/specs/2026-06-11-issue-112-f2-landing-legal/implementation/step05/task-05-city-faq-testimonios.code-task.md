## Status: PENDING
## Blocked-By: step01/task-01-homecontact-reserveanchor.code-task.md
## Completed:

# Task: F2 Step 5 — FAQ + Testimonios city restyle (in-place, datos city)

## Description
Extraer y restilizar `#faqs` y `#testimonios` de la city landing a `app/components/city/Faq.vue` + `app/components/city/Testimonios.vue`, cableados en `CityPage.vue` como drop-in. **Mantienen sus datos city-specific** — NO se reusan los componentes brand-level de F1.

## Background
- `#faqs` city usa `useCityFAQs(city.name)` (FAQs city-specific: pico y placa, El Dorado, etc.) — distinto de `HomeFaq` (que usa `useData().faqs` brand-level). Reusar HomeFaq = regresión de contenido SEO city. El schema `FAQPage` city lo emite `useCityFAQSchema` dentro de `useCityPageSEO` (en `[city]/index.vue`), NO acá → **no moverlo**.
- `#testimonios` city usa `props.city.testimonials` (city-specific) y alimenta `useCityAggregateRating`. Reusar `HomeReviews` (`franchiseTestimonials` brand-level) cambiaría el display y arriesga inconsistencia con el `AggregateRating` city.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f2-landing-legal-design.md` (SCEN-F2-02; filas faqs/testimonios; nota schema)
**Additional:**
- `app/components/CityPage.vue` (`#faqs` ~324-344 `useCityFAQs`; `#testimonios` ~345-... `city.testimonials`)
- Diseño: `/tmp/alqui_f1_design/dist/alquiler-de-carros-bogota/index.html` (`#faq`, `#google-reviews`)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. `city/Faq.vue`: acordeón con `useCityFAQs(city.name)` (NO `useData().faqs`), estilo del diseño. **No** inline el `FAQPage` schema (queda en `useCityPageSEO`).
2. `city/Testimonios.vue`: cards con `props.city.testimonials`, **heading city-targeted** ("…en {city.name}"), estilo del diseño. `useCityAggregateRating` queda consistente con lo mostrado.
3. Cableados en `CityPage.vue` como drop-in de las secciones inline.
4. `bg-linear-to-*`, `.heading-*`.

## Dependencies
- **Step 1** (rama). `useCityFAQs`, `props.city.testimonials`.

## Implementation Approach
1. Crear `city/Faq.vue` (usa `useCityFAQs`) y `city/Testimonios.vue` (usa `city.testimonials` + heading city).
2. Cablear en `CityPage.vue` (drop-in).
3. Test: Faq usa `useCityFAQs`, Testimonios usa `city.testimonials` + heading city.

## Acceptance Criteria
1. **FAQ city in-place (SCEN-F2-02)**
   - Given la city landing
   - When se ve `#faqs`
   - Then el acordeón usa `useCityFAQs(city.name)` (FAQs city-specific), restilado; el schema no se movió.
2. **Testimonios city in-place**
   - Given la city landing
   - When se ve `#testimonios`
   - Then usa `props.city.testimonials` con heading city-targeted; `useCityAggregateRating` consistente.
3. **Test de contrato**
   - Given los componentes
   - When corre el unit test
   - Then Faq referencia `useCityFAQs` (no `useData().faqs`), Testimonios referencia `city.testimonials` (no `franchiseTestimonials`), heading city, `.heading-*`.

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: alquilame, f2, city, faq, testimonios, seo
- **Required Skills**: Vue 3, @nuxt/ui v4
- **Related Tasks**: Blocked-By step 1
- **Step**: 05 of 08
- **Files to Modify**: `app/components/city/Faq.vue` (nuevo), `app/components/city/Testimonios.vue` (nuevo), `app/components/CityPage.vue`, `app/components/city/__tests__/faq-testimonios.test.ts` (nuevo)
- **Files to Read**: `app/components/CityPage.vue`, `/tmp/alqui_f1_design/dist/alquiler-de-carros-bogota/index.html`
- **Context Estimate**: M
- **Scenario-Strategy**: required
