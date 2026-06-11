# Planning Summary: F2 — City landing + legales

**Date:** 2026-06-11
**Goal:** Reskin de la city landing (`CityPage.vue`) + páginas legales de alquilame al diseño, preservando engine, todo el SEO y el modelo de negocio (intermediación).

## Artefactos
- `docs/specs/2026-06-11-issue-112-f2-landing-legal-design.md` — detailed design (spec, aprobada; holdout SCEN-F2-01..12 +07b).
- `docs/specs/2026-06-11-issue-112-f2-landing-legal/implementation/plan.md` — file map + 8 pasos SDD.
- `docs/specs/2026-06-11-issue-112-f2-landing-legal/summary.md` — este archivo.

## Decisiones clave
1. **City landing = reskin marketing, engine/rutas INTACTOS.** `Searcher.vue` (sus testids) sigue navegando a `buscar-vehiculos` (F3 lo reapunta a `/reservas`); resultados condicionales (`#seleccion-categorias`), branches, pin #41, guard #109 preservados.
2. **Preservar TODO el SEO** (descripcion/ventajas/destinos/consejos/temporada/ciudades-cercanas restiladas) + agregar marketing reusando `home/*` de F1 (Fleet/HowItWorks/Requirements/Contact).
3. **Contenido city = restyle in-place** (faqs con `useCityFAQs`, testimonios con `city.testimonials`); solo el marketing puro brand-level se reusa de F1. `HomeContact` gana prop `reserveAnchor` (`#searcher` en city).
4. **Legales = estilo del diseño sobre el contenido de intermediación actual** (no el copy operador-directo del diseño — riesgo legal del modelo AMAW agregador). SCEN-F2-07b lo guarda.
5. **Decomposición**: extraer secciones city en `app/components/city/*`; CityPage queda orquestador (mirror de `home/*`).

## Revisiones (gate)
- Spec-review: 2 iteraciones → Approved (Searcher≠SelectBranch, #faqs city-specific, id-collision, reserveAnchor, legal/intermediación, FAQ schema location).
- Plan-review: 1 iteración → Approved; correcciones aplicadas (testimonios in-place vs HomeReviews por `useCityAggregateRating`/city-specific; ordering clarity; solo reserveAnchor prop).

## Complejidad
- **Overall:** L (CityPage es engine-pesada + grande) · **Pasos:** 8 (≤ M c/u) · **Riesgo:** Medio (preservar engine/SEO en una página compartida con la ruta de resultados; mayor cuidado en steps que tocan CityPage).

## Próximos pasos
1. `sop-task-generator` → `.code-task.md` por paso.
2. Implementar (worktree `issue-112-f2`), runtime en preview, PR `Refs #112`.

## Open questions / deuda declarada
- `/reservas` + flujo resultados/reserva + blog → F3 (cierra #112). F3 reapunta el searcher.
- El copy legal del diseño (operador directo) NO se usa hasta validación legal del cambio de posicionamiento.
