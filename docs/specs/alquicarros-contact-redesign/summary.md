# Planning Summary: alquicarros `#contact` doble-ruta CTA

**Date:** 2026-07-01
**Goal:** Rediseñar la sección `#contact` de alquicarros a un layout "doble ruta CTA" distinto de la banda clonada de alquilame, conservando los dos CTA reales.

## Artifacts Created
- `docs/specs/2026-07-01-alquicarros-contact-doble-ruta-design.md` — diseño detallado (fuente de verdad), revisado 2 iteraciones + aprobado por usuario. Incluye SCEN-CONTACT-01..07.
- `docs/specs/alquicarros-contact-redesign/implementation/plan.md` — plan de 3 pasos (SDD), revisado + aprobado.
- `docs/specs/alquicarros-contact-redesign/summary.md` — este documento.

> Fases de clarificación/research/detailed-design de sop-planning colapsadas: el diseño ya existía, revisado y aprobado, antes de invocar planning.

## Key Decisions
1. **Doble ruta sin imagen** (no la banda + SUV): dos tiles de acción, uno por CTA, sobre fondo crema. Es la composición que más se aleja de alquilame conservando el tono de cierre-CTA (no formulario).
2. **CTAs intactos:** prop `reserveAnchor` bindeada verbatim (soporta ancla `#hero`/`#searcher` y ruta `/reservas`); WhatsApp con `target/rel/aria-label`.
3. **Iconografía lucide** alineada a `ValueProps` (car, message-circle, wallet, shield-check, headset, map-pinned); badge de ciudades vía `useCityCount().value`.
4. **Test source-reading** (`contact.test.ts`, patrón `reskin-invariants`) en vez de montar Nuxt — consistente con los tests existentes.

## Complexity Estimate
- **Overall:** M (un componente reescrito + un test nuevo).
- **Duration:** ~2–3 h incl. validación runtime.
- **Risk Level:** Low — cambio aislado a un archivo, sin estado ni red nuevos, rollback por `git revert`.

## Recommended Next Steps
1. Ejecutar Step 1: escribir `contact.test.ts` (holdout, debe fallar contra el actual).
2. Step 2: reescribir `Contact.vue`.
3. Step 3: validación runtime `/agent-browser` + `/dogfood` + `/verification-before-completion`.
4. Invocar `/scenario-driven-development` para conducir la implementación con SCEN-01..07 como holdout.

## Open Questions
Ninguna bloqueante. Copys de microtexto de los tiles ("Cotiza y confirma en 2 minutos, sin llamadas." / "Un asesor te ayuda a elegir y reservar al instante.") son ajustables en implementación sin cambiar scenarios.
