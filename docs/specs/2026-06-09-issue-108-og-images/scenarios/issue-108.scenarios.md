# Scenarios — Issue #108 og:image por marca

Holdout observable. "Done" = todos satisfechos con evidencia de ejecución, no por debilitar el escenario.

---

## SCEN-001 — alquilame: og:image resuelve y es de SU marca

**Given** el `<head>` renderizado de alquilame (`app.config.ts` con `ogImage` apuntando a su asset propio),
**When** un scraper lee `og:image`,
**Then** la URL termina en `/img/og-alquilame.jpg` (no `og-alquilatucarro.jpg`),
**And** ese archivo existe en `packages/ui-alquilame/public/img/` y es un JPEG 1200×630 válido (resuelve 200, no 404).

## SCEN-002 — alquicarros: og:image resuelve y es de SU marca

**Given** el `<head>` renderizado de alquicarros,
**When** un scraper lee `og:image`,
**Then** la URL termina en `/img/og-alquicarros.jpg` (no `og-alquilatucarro.jpg`),
**And** ese archivo existe en `packages/ui-alquicarros/public/img/` y es un JPEG 1200×630 válido.

## SCEN-003 — alquilatucarro intacto (no regresión)

**Given** el `<head>` renderizado de alquilatucarro,
**When** un scraper lee `og:image`,
**Then** la URL sigue terminando en `/img/og-alquilatucarro.jpg`,
**And** su asset no fue modificado.

## SCEN-004 — assets generados son deterministas y on-brand

**Given** el script `scripts/generate-og-images.ts` y los SVG fuente,
**When** se re-ejecuta el script,
**Then** produce JPEGs 1200×630 para alquilame y alquicarros,
**And** cada uno contiene el wordmark de ESA marca (verificable: el asset difiere del de alquilatucarro y entre sí),
**And** re-ejecutar no cambia el resultado (idempotente).

---

## Estrategia de satisfacción

- **SCEN-001/002/003**: test de config (`app.config.ts.ogImage` por marca) + verificación de existencia/validez del asset (sharp metadata 1200×630) + runtime: servir cada marca, `curl` el HTML, `grep og:image`, confirmar el path correcto y que el asset responde 200.
- **SCEN-004**: ejecutar el script dos veces, comparar hash; confirmar 3 assets mutuamente distintos (alquilame ≠ alquicarros ≠ alquilatucarro).
- **Anti-reward-hacking**: no se permite "arreglar" apuntando las dos marcas al mismo archivo ni reusando og-alquilatucarro; cada marca debe tener asset propio con su wordmark.
