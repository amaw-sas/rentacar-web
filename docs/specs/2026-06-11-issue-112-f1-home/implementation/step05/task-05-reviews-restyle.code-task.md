## Status: COMPLETED
## Blocked-By: step01/task-01-hero-restyle.code-task.md
## Completed: 2026-06-11

# Task: F1 Step 5 — Reviews (restyle con testimonios reales)

## Description
Reconstruir el `#testimonios` actual como `app/components/home/Reviews.vue` con el estilo "review" del diseño, usando `franchiseTestimonials` reales — sin los números de marketing hardcodeados del mockup ("43 reseñas", "5,0").

## Background
El home actual ya muestra testimonios reales (`franchiseTestimonials[brandCode]`, Supabase) con estrellas. El diseño los presenta como reseñas estilo Google con un número de rating ("43"/"5,0") que es marketing hardcodeado del mockup → NO replicar. `useHomeAggregateRating` está roto/hardcodeado = deuda pre-existente, NO se toca en F1 (sin regresión).

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f1-home-design.md` (SCEN-F1-05; decisión de reviews)
**Additional:**
- `app/pages/index.vue` (`franchiseTestimonials`, `#testimonios`, `Testimonial` type)
- Diseño: `/tmp/alqui_f1_design/dist/index.html` (`<section id="google-reviews">`)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. `Reviews.vue` renderiza `franchiseTestimonials[brandCode]` (mismo origen actual) en el layout de review del diseño (cards con avatar/nombre/quote/estrellas).
2. NO introducir los literales del mockup ("43 reseñas verificadas", "5,0").
3. `useHomeAggregateRating` permanece llamado en `index.vue` SIN cambios (no-regresión).
4. Gradientes/fondos `bg-linear-*`; headings `.heading-*`.

## Dependencies
- **Step 1** (orquestación).
- **`franchiseTestimonials`**: vía `useFetchRentacarData()`.

## Implementation Approach
1. Crear `Reviews.vue` con el grid de testimonios reales, estilo review del diseño.
2. Reusar `StarIcon`/`UUser` según convenga.
3. Montar `<HomeReviews/>` en `index.vue` (reemplaza `#testimonios`); mantener la llamada `useHomeAggregateRating()` intacta.
4. Test: usa testimonios reales; sin literales "43"/"5,0".

## Acceptance Criteria
1. **Testimonios reales en estilo review (SCEN-F1-05)**
   - Given `franchiseTestimonials` del brand
   - When renderiza Reviews
   - Then muestra las reseñas reales con el estilo del diseño.
2. **Sin números de marketing hardcodeados**
   - Given el render de la sección
   - When se busca "43" / "5,0" del mockup
   - Then no aparecen.
3. **AggregateRating sin regresión**
   - Given `index.vue`
   - When se revisa el script
   - Then `useHomeAggregateRating()` sigue llamado sin cambios.

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: alquilame, f1, home, reviews, seo
- **Required Skills**: Vue 3, @nuxt/ui v4
- **Related Tasks**: Blocked-By step 1
- **Step**: 05 of 11
- **Files to Modify**: `app/components/home/Reviews.vue` (nuevo), `app/pages/index.vue`, `app/components/home/__tests__/Reviews.test.ts` (nuevo)
- **Files to Read**: `app/pages/index.vue`, `/tmp/alqui_f1_design/dist/index.html`
- **Context Estimate**: S
- **Scenario-Strategy**: required
