---
name: alquicarros-valueprops-redesign
created_by: brainstorming
created_at: 2026-06-26T00:00:00Z
---

Holdout para el rediseño de la sección "¿Por Qué Elegir …?" de alquicarros
(`packages/ui-alquicarros/app/components/home/ValueProps.vue`). Observable = DOM
renderizado en home de alquicarros. Diseño:
`docs/specs/2026-06-26-alquicarros-valueprops-redesign-design.md`.

## SCEN-VP-01: iconos UIcon de lucide en badge naranja, sin v-html
**Given**: el home de alquicarros con la sección de value props
**When**: se renderiza
**Then**: cada uno de los 4 props muestra un icono de Nuxt UI (UIcon de lucide: wallet / car / headset / map-pinned) dentro de un badge con fondo naranja de marca; el componente ya no usa `v-html` ni rutas SVG dibujadas a mano para los iconos de props
**Evidence**: DOM — 4 badges naranja (`background-color` rgb(239,150,0)) cada uno con un elemento icono visible; fuente del componente sin `v-html` y con los nombres `i-lucide-wallet`, `i-lucide-car`, `i-lucide-headset`, `i-lucide-map-pinned`

## SCEN-VP-02: cada prop en una card centrada
**Given**: la sección
**When**: se renderiza
**Then**: los 4 props son cards independientes (fondo propio + borde redondeado) con el contenido centrado: badge de icono arriba, luego título y descripción
**Evidence**: DOM — 4 elementos card con `border-radius` ≥ 12px y `text-align: center`

## SCEN-VP-03: copy y cifra viva preservados
**Given**: la sección
**When**: se renderiza
**Then**: aparecen los 4 títulos "Sin Anticipos", "Flota Nueva", "Asistencia 24/7", "Cobertura Nacional" con sus descripciones, y la descripción de "Cobertura Nacional" incluye un número de ciudades
**Evidence**: DOM — textContent de los 4 `<h3>`; la descripción de Cobertura matchea `/\d+ ciudades de Colombia/`

## SCEN-VP-04: el headline deriva el nombre de marca
**Given**: la sección
**When**: se renderiza
**Then**: el `<h2>` dice "¿Por Qué Elegir Alquicarros?" — el nombre sale de `organization.brand`, no hardcodeado en el template
**Evidence**: DOM — `<h2>` textContent contiene "¿Por Qué Elegir Alquicarros?"; fuente del componente sin el literal de marca en el template (usa `{{ brand }}`)

## SCEN-VP-05: sin regresión cross-marca
**Given**: alquilame y alquilatucarro
**When**: se inspecciona el diff del cambio
**Then**: sus componentes `ValueProps.vue` quedan sin modificar; solo se tocan archivos bajo `packages/ui-alquicarros/` (+ docs/specs y e2e)
**Evidence**: `git diff --name-only origin/main` no lista rutas bajo `packages/ui-alquilame/` ni `packages/ui-alquilatucarro/`
