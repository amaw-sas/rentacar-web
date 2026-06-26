---
name: alquicarros-fleet-card-redesign
created_by: brainstorming
created_at: 2026-06-26T00:00:00Z
---

Holdout para el rediseño de las cards estáticas de flota en alquicarros
(`packages/ui-alquicarros/app/components/home/Fleet.vue` + nuevo
`FleetCard.vue`). Observable = DOM renderizado en home/city de alquicarros.
Precios reales (Supabase), no hardcodeados. Diseño de referencia:
`docs/specs/2026-06-26-alquicarros-fleet-card-redesign-design.md`.

## SCEN-FC-01: badge de categoría superpuesto sobre la imagen
**Given**: el home de alquicarros con la sección `#fleet` renderizada
**When**: se renderiza la card de la categoría "Compacto" (code C)
**Then**: dentro del contenedor de la imagen (posicionado), en la esquina inferior izquierda, aparece un badge con fondo naranja de marca (`bg-brand-600` / `#ef9600`) y texto en negrita "Compacto - Manual"
**Evidence**: DOM — elemento badge `absolute` dentro del frame de imagen con `background-color` rgb(239,150,0) y `textContent` "Compacto - Manual"

## SCEN-FC-02: modelos como título principal
**Given**: una card de flota cualquiera (ej. Compacto)
**When**: se renderiza
**Then**: el encabezado principal bajo la imagen es el ejemplo de modelos seguido de "o similar" (ej. "Kia Picanto / Suzuki S-Presso o similar"); la categoría sola ("Compacto") NO es el título — vive solo en el badge
**Evidence**: DOM — `<h3>` con `textContent` que contiene "Kia Picanto / Suzuki S-Presso o similar"; ningún `<h3>` cuyo texto sea únicamente "Compacto"

## SCEN-FC-03: precio diario real prominente con fail-soft
**Given**: una categoría con precio diario activo positivo y `plan === 'daily'`
**When**: se renderiza la card
**Then**: muestra "Desde", el valor real de `pickRepresentativeDailyPrice` formateado como "$X/día" en color de marca y tamaño prominente, y "+ IVA"
**And Given**: una categoría sin precio activo positivo para el plan vigente
**Then**: no se renderiza ningún bloque de precio (nunca "$0" ni valor fabricado)
**Evidence**: DOM — nodo de precio con clase `text-brand-600`, texto que matchea `/Desde\s+\$[\d.]+\/día/` y "+ IVA" presente; para categoría sin precio, ausencia del nodo de precio

## SCEN-FC-04: specs como chips redondeados independientes
**Given**: una card de flota
**When**: se renderiza
**Then**: pasajeros, maletas y el texto de kilometraje aparecen como chips redondeados independientes (cada uno con borde/fondo propio), no como iconos en línea plana; el valor de maletas es el `luggage` real de la categoría (Compacto = 2)
**Evidence**: DOM — ≥3 elementos chip hermanos con `border-radius` ≥ 8px; chip de pasajeros muestra "5", chip de maletas muestra "2" para Compacto, chip de kilometraje muestra "Kilometraje ilimitado"

## SCEN-FC-05: el toggle Diario/Mensualidad sigue gobernando las cards
**Given**: la sección flota con el toggle visible
**When**: el usuario hace click en "Mensualidad" (`data-testid="fleet-tab-monthly-test"`)
**Then**: cada card con precio mensual activo muestra "Desde $X/mes", el chip de kilometraje cambia a "1.000 km/mes incluidos", y el label fiscal cambia a "IVA incluido"
**Evidence**: DOM — tras el click, nodo de precio matchea `/Desde\s+\$[\d.]+\/mes/`, chip de kilometraje `textContent` contiene "1.000 km/mes incluidos", label "IVA incluido" presente

## SCEN-FC-06: el CTA preserva el flujo de reserva
**Given**: una card rediseñada con CTA `data-testid="fleet-card-cta-test"` y texto "Ver disponibilidad" (mostrado en mayúsculas)
**When**: el usuario hace click/tap en el CTA
**Then**: se abre el modal con `SelectBranch` (mismo comportamiento actual); en móvil el primer tap no se pierde (`hydrate-on-visible`)
**Evidence**: DOM — existe botón `[data-testid="fleet-card-cta-test"]`; tras el click aparece el diálogo del modal conteniendo el control `SelectBranch`

## SCEN-FC-07: sin regresión en otras marcas
**Given**: alquilame y alquilatucarro
**When**: se inspecciona el diff del cambio
**Then**: sus `Fleet.vue` permanecen sin modificar; solo se tocan archivos bajo `packages/ui-alquicarros/`
**Evidence**: `git diff --name-only origin/main` lista únicamente rutas bajo `packages/ui-alquicarros/` y `docs/specs/`
