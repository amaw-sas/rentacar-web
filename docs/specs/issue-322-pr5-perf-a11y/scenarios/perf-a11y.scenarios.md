---
name: perf-a11y
created_by: agent
created_at: 2026-07-16T15:00:00Z
issue: 322
pr_package: 5
---

# Issue 322 · PR5 — Rendimiento + accesibilidad

## SCEN-322-P01 — Hero alquilame no descarga video multi-MB en el paint inicial

**Given** la home de alquilame
**When** se pinta el hero por primera vez
**Then** el camino por defecto es el póster (imagen), no `<video autoplay>` con sources webm/mp4
**And** el video pesado solo se activa después (idle/visible), o no se activa con reduced-motion

**Evidence**: `Hero.vue` source + test estructural.

## SCEN-322-P02 — Flota alquilame usa el pipeline de imágenes

**Given** la rejilla `#fleet` de la home
**When** se renderiza cada card
**Then** la imagen del vehículo usa `NuxtImg` (no `<img src>` crudo a JPEG local)

**Evidence**: `Fleet.vue` + test.

## SCEN-322-P03 — Sin hydrate-on-interaction en call sites vivos del audit

**Given** los sitios auditados (modales/FAQ home ATC, FAQ city alquilame)
**When** se inspecciona el source
**Then** no queda `hydrate-on-interaction` (se usa visible/eager o componente no lazy)

**Evidence**: greps en `packages/ui-*`.

## SCEN-322-A01 — Botones de info de categoría tienen nombre accesible

**Given** `CategoryCard` (marcas con grid)
**When** se leen los botones de información de cobertura/extras
**Then** cada control expone `aria-label` (no solo `alt` en un button)

**Evidence**: CategoryCard source + test.

## SCEN-322-A02 — Panel de chat: Escape, foco, fondo no tabulable

**Given** el panel de chat abierto en desktop
**When** el usuario pulsa Escape o el panel se abre
**Then** se cierra con Escape; el contenedor del panel es focuseable; el backdrop no deja la página como único foco útil

**Evidence**: ChatWidget source + test.

## SCEN-322-A03 — Respuestas del chat en región viva

**Given** el widget de chat
**When** llega un mensaje del asistente
**Then** existe una región `aria-live` que anuncia (ya presente: se reafirma)

**Evidence**: ChatWidget + useChatConversation.

## SCEN-322-A04 — Contraste wizard ≥ AA en superficies blancas

**Given** precios/deducible/avisos del wizard alquicarros
**When** se usan sobre fondo blanco
**Then** no usan `text-gray-400` para texto normal de precio/aviso (usan `text-gray-600` o más oscuro)

**Evidence**: wizard components greps + test.
