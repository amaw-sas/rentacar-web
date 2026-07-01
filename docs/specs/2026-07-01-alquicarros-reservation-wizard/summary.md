# Planning Summary — Wizard de reserva acompañada (alquicarros)

**Fecha:** 2026-07-01
**Goal:** Convertir el flujo de resultados de alquicarros en un wizard guiado de 5 pasos (Búsqueda → Vehículo → Seguro → Adicionales → Datos) con agrupación por segmentos y resumen persistente, aislado a la marca.

## Artefactos creados
- `docs/specs/2026-07-01-alquicarros-reservation-wizard-design.md` — diseño detallado aprobado (fuente; 15 escenarios observables SCEN-W-01, W-01b, W-02..W-14). Producido en `/brainstorming` + 2 rondas de revisión de spec.
- `docs/specs/2026-07-01-alquicarros-reservation-wizard/implementation/plan.md` — plan de 13 pasos en 4 fases, con mapa de archivos, criterios de aceptación por paso ligados a los SCEN-W, y revisión de plan aprobada.
- `docs/specs/2026-07-01-alquicarros-reservation-wizard/summary.md` — este documento.

> Nota: se comprimió `/sop-planning` a la generación del plan (Steps 6.5–8) por decisión del usuario — rough-idea/idea-honing/research/detailed-design ya estaban cubiertos por el spec aprobado.

## Decisiones clave
1. **Segmento → vehículo (2 niveles):** el grupo simplifica la entrada; la gama sigue siendo la unidad reservada.
2. **Wizard completo en `/reservas` + rutas de resultados por ciudad**, no un grid; SEO preservado (landings indexables, `noindex,follow` solo en `/reservas?query`, rutas ISR con canonical sin cambios).
3. **Entrada por URL:** sin params → Paso 1; con params de búsqueda → Paso 2 directo; `paso`/`/categoria` posterior → ese paso.
4. **Marca-local:** todo en `packages/ui-alquicarros/`; `logic/` y las hermanas no se tocan (blast radius verificado).
5. **Resumen persistente:** sidebar sticky en desktop, barra inferior expandible en móvil.
6. **Taxonomía cerrada:** Económicos (C/CX) · Sedanes (F/FX/FL/FU/FY) · Camionetas-SUV (G4/GC/GL/GY) · Premium (LE/LP/LU/LY) · fail-soft "Otros".

## Complejidad
- **Overall:** L (13 pasos, ~15 archivos nuevos/modificados, routing + SEO + estado).
- **Duración estimada:** ~18–24 h de implementación (pasos ≤M, ≤2 h c/u).
- **Riesgo:** Medio — concentrado en el handshake búsqueda→avance (Paso 9) y el results-mode SSR de CityPage (Paso 10). Bajo riesgo de regresión externa por el aislamiento marca-local.

## Próximos pasos recomendados
1. Implementar en orden con `/scenario-driven-development` — los 15 SCEN-W son el holdout; satisfacer escenarios, no debilitarlos.
2. Empezar por Fase 1 (Paso 1 config + Paso 2 máquina) — fundación testeable sin UI.
3. `/verification-before-completion` con evidencia fresca antes de cualquier claim de "done", commit final o PR.
4. Validación runtime `/agent-browser` + `/dogfood` en el Paso 13 (dev port 4000 en el worktree; copiar `.env.local`).
5. Push y PR solo con autorización explícita del usuario.

## Preguntas abiertas / diferidas
- **Nivel-2 del Paso 2:** reúso de `CategoryCard` reducida vs. componente nuevo — se arranca por reúso, se mide CLS (riesgo logueado en el plan).
- **Default del seguro:** Básico preseleccionado con Total "recomendado" (sin forzar) — puede revisarse tras datos de conversión.
