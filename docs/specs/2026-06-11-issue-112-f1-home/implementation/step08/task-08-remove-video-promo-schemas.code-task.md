## Status: COMPLETED
## Blocked-By: step01/task-01-hero-restyle.code-task.md
## Completed: 2026-06-11

# Task: F1 Step 8 — Eliminar sección #video + schemas promo/video

## Description
Eliminar de `index.vue` la sección "Video 60% descuento" (`#video`) y las dos llamadas de schema asociadas (`usePromoVideoSchema()` y `useEarlyBookingPromotion()`), porque el diseño nuevo no incluye ni el video ni el 60%.

## Background
El diseño no surface el descuento del 60% ni un video → conservar esos schemas dejaría JSON-LD sin contenido visible (SEO deshonesto). `usePromoVideoSchema()` (línea ~330) y `useEarlyBookingPromotion()` (línea ~333) viven en el `<script setup>` de `index.vue`; la sección `#video` está en el `<template>`. Conservar `useBaseSEO`/`useHomeBreadcrumb`/og/`FAQPage`/canonical/`useHomeAggregateRating`.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f1-home-design.md` (SCEN-F1-07; decisión de #video)
**Additional:**
- `app/pages/index.vue` (`#video`, `usePromoVideoSchema`, `useEarlyBookingPromotion`)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. Eliminar la sección `#video` del template de `index.vue`.
2. Eliminar las llamadas `usePromoVideoSchema()` y `useEarlyBookingPromotion()` (y sus imports si quedan sin uso — `noUnusedLocals`).
3. NO tocar los demás schemas/SEO (`FAQPage`, og, breadcrumb, canonical, `useHomeAggregateRating`).

## Dependencies
- **Step 1** (orquestación; idealmente combinar con la reescritura del `<script>` de `index.vue` para no hacer dos pasadas).

## Implementation Approach
1. Quitar el bloque `<UPageSection id="video">…` del template.
2. Quitar las 2 llamadas de schema y limpiar imports sin uso.
3. Test: el render no contiene `VideoObject` ni `Offer/Promotion` en el JSON-LD.

## Acceptance Criteria
1. **Sección y schemas removidos (SCEN-F1-07)**
   - Given el home renderizado
   - When se busca la sección video/60% y el JSON-LD
   - Then no existe la sección, ni `VideoObject`, ni `Offer/Promotion` (EarlyBooking).
2. **SEO restante intacto**
   - Given `index.vue`
   - When se inspecciona el script
   - Then `FAQPage`, og, breadcrumb, canonical y `useHomeAggregateRating` permanecen.
3. **Test de contrato**
   - Given el render
   - When corre el test (grep del JSON-LD)
   - Then confirma ausencia de VideoObject/Promotion y presencia del resto.

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: alquilame, f1, home, seo, cleanup
- **Required Skills**: Vue 3, schema.org/JSON-LD
- **Related Tasks**: Blocked-By step 1
- **Step**: 08 of 11
- **Files to Modify**: `app/pages/index.vue`, `app/components/home/__tests__/schema-cleanup.test.ts` (nuevo)
- **Files to Read**: `app/pages/index.vue`
- **Context Estimate**: S
- **Scenario-Strategy**: required
