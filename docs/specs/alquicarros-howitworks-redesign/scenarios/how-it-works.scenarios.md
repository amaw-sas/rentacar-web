---
name: alquicarros-howitworks-redesign
created_by: brainstorming
created_at: 2026-06-26T00:00:00Z
---

Holdout para el rediseño de la sección "Cómo Funciona" de alquicarros
(`packages/ui-alquicarros/app/components/home/HowItWorks.vue`). Observable = DOM
renderizado en home/city/reservas de alquicarros. Diseño de referencia:
`docs/specs/2026-06-26-alquicarros-howitworks-redesign-design.md`.

## SCEN-HW-01: stepper horizontal con estado
**Given**: el home de alquicarros con la sección `#how-it-works`
**When**: se renderiza
**Then**: sobre las cards hay un rail con tres marcadores numerados "1", "2", "3"; el "1" tiene fondo naranja de marca (`bg-brand-600` / `#ef9600`) y texto blanco; los "2" y "3" tienen fondo claro con número en gris; el conector entre 1 y 2 es naranja de marca y el conector entre 2 y 3 es gris
**Evidence**: DOM — marcador "1" con `background-color` rgb(239,150,0); marcadores "2"/"3" sin ese fondo; primer segmento conector con bg de marca, segundo gris

## SCEN-HW-02: iconos de línea naranja, no fotos
**Given**: una card de paso (ej. la primera)
**When**: se renderiza
**Then**: contiene un icono de línea en color de marca (paso 1 = map-pin, paso 2 = calendar-check, paso 3 = key) y NO una imagen/foto
**Evidence**: DOM — cada card incluye un elemento icono (UIcon, `<span>`/`<svg>` con `color` de marca); ninguna card contiene `<img>`

## SCEN-HW-03: copy corto del mockup
**Given**: la sección
**When**: se renderiza
**Then**: los títulos de los 3 pasos son exactamente "Elige ciudad y auto", "Reserva en minutos", "Recoge y conduce", con descripciones "Selecciona la ciudad y el vehículo que mejor se adapte a tu viaje.", "Elige fechas, confirma y recibe tu confirmación al instante.", "Recoge tu auto en la sucursal seleccionada y comienza tu aventura."
**Evidence**: DOM — `textContent` de los 3 `<h3>` y sus `<p>` de descripción

## SCEN-HW-04: sin imágenes dentro de la sección
**Given**: la sección rediseñada
**When**: se renderiza
**Then**: no existe ningún elemento `<img>` dentro de `#how-it-works` (las fotos `paso-*.jpg` fueron sustituidas por iconos)
**Evidence**: DOM — `document.querySelectorAll('#how-it-works img').length === 0`

## SCEN-HW-05: trust footer preservado
**Given**: la sección
**When**: se renderiza
**Then**: bajo las cards aparece la línea "Seguridad • Transparencia • Soporte 24/7" y el caption "Estamos contigo en todo el proceso."
**Evidence**: DOM — `#how-it-works` textContent contiene ambas frases

## SCEN-HW-06: presente donde se usa
**Given**: el home (`/`) y una city page (`/[city]`, ej. `/bogota`)
**When**: cada página carga
**Then**: la sección `#how-it-works` está presente y visible en ambas
**Evidence**: DOM — `#how-it-works` visible en `/` y en `/bogota`

## SCEN-HW-07: sin regresión cross-marca
**Given**: alquilame y alquilatucarro
**When**: se inspecciona el diff del cambio
**Then**: sus componentes `HowItWorks.vue` quedan sin modificar; solo se tocan archivos bajo `packages/ui-alquicarros/` (+ docs/specs y e2e)
**Evidence**: `git diff --name-only origin/main` no lista rutas bajo `packages/ui-alquilame/` ni `packages/ui-alquilatucarro/`
