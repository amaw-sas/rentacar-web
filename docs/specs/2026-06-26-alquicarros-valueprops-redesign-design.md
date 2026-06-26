# Rediseño de la sección "¿Por Qué Elegir …?" — alquicarros

**Fecha:** 2026-06-26
**Alcance:** solo `packages/ui-alquicarros/app/components/home/ValueProps.vue`.
**Tipo:** restructura visual de presentación + cambio de mecanismo de iconos. Sin cambios de datos, API ni SEO.

## Contexto

`ValueProps.vue` renderiza "¿Por Qué Elegir {brand}?" con 4 props (Sin Anticipos, Flota Nueva, Asistencia 24/7, Cobertura Nacional). Hoy cada prop es una fila plana (icono SVG inline vía `v-html` dentro de un círculo naranja + título + descripción). El brand sale de `organization.brand`; "Cobertura Nacional" usa la cifra viva `useCityCount()`.

## Objetivo

Reemplazar los iconos SVG inline por **iconos de Nuxt UI (UIcon/lucide)** y dar un **restyle ligero**: cada prop pasa a una card centrada, consistente con las cards de "Cómo Funciona".

## Decisiones tomadas

| Decisión | Valor |
|---|---|
| Alcance | Solo alquicarros |
| Mecanismo de iconos | `<UIcon :name>` (lucide) — elimina `v-html` |
| Iconos | Los más representativos (ver tabla) |
| Restyle | Ligero: cards centradas con badge de icono arriba |
| Copy / brand / cityCount | Se conservan |

### Mapeo de iconos (lucide)

| Prop | Nuevo icono |
|---|---|
| Sin Anticipos | `i-lucide-wallet` |
| Flota Nueva | `i-lucide-car` |
| Asistencia 24/7 | `i-lucide-headset` |
| Cobertura Nacional | `i-lucide-map-pinned` |

## Estructura

- Section `bg-white py-16 md:py-24`, heading `¿Por Qué Elegir {{ brand }}?` (brand de `organization.brand`).
- Grid `sm:grid-cols-2 lg:grid-cols-4 gap-6`.
- Cada prop = card centrada: `bg-[#F8F9FC] rounded-2xl border border-gray-100 p-6 flex flex-col items-center text-center`, hover-lift suave.
  - **Badge de icono** arriba: `w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center mb-4` con `<UIcon :name="prop.icon" class="size-7" />`.
  - Título `heading-sub text-lg font-bold text-gray-900 mb-1`.
  - Descripción `text-gray-600 text-sm leading-relaxed`.
- Datos: el campo `icon` pasa de markup SVG a nombre `i-lucide-*`. Se elimina el `<svg v-html>`.

## Blast radius

- **Modificado:** `packages/ui-alquicarros/app/components/home/ValueProps.vue` y su `__tests__/presentational.test.ts` (el contrato de copy/brand sigue igual; se añade aserción de UIcon/no-v-html).
- **Consumidores:** home, CityPage, `/reservas` de alquicarros heredan. Otras marcas con su propio componente — sin tocar.
- Sin datos/API/SEO. Sin migración.

## Escenarios observables

- **SCEN-VP-01 — Iconos UIcon lucide, sin v-html.** Given la sección, When se renderiza, Then cada uno de los 4 props muestra un UIcon de lucide (wallet/car/headset/map-pinned) dentro de un badge naranja; el componente ya no usa `v-html` ni rutas SVG inline para los iconos de props.
  Evidence: DOM — 4 badges con un elemento icono; código sin `v-html`; los nombres `i-lucide-wallet/car/headset/map-pinned` presentes.
- **SCEN-VP-02 — Cada prop en card centrada.** Given la sección, When se renderiza, Then los 4 props son cards independientes (fondo propio, borde redondeado) con contenido centrado (badge arriba, título, descripción).
  Evidence: DOM — 4 elementos card con `border-radius` ≥ 12px y `text-align: center`.
- **SCEN-VP-03 — Copy y cifra viva preservados.** Given la sección, When se renderiza, Then aparecen los 4 títulos (Sin Anticipos, Flota Nueva, Asistencia 24/7, Cobertura Nacional) con sus descripciones, y "Cobertura Nacional" incluye un número de ciudades.
  Evidence: DOM — textContent de los 4 `<h3>` y la descripción de Cobertura matchea `/\d+ ciudades de Colombia/`.
- **SCEN-VP-04 — Headline deriva el brand.** Given la sección, When se renderiza, Then el `<h2>` dice "¿Por Qué Elegir Alquicarros?" (brand desde `organization.brand`, no hardcodeado en el template).
  Evidence: DOM — `<h2>` textContent contiene "¿Por Qué Elegir Alquicarros?"; código sin literal de marca en el template.
- **SCEN-VP-05 — Sin regresión cross-marca.** Given alquilame y alquilatucarro, When se inspecciona el diff, Then sus componentes quedan sin tocar; solo `packages/ui-alquicarros/` (+ docs/e2e).
  Evidence: `git diff --name-only origin/main` sin rutas de otras marcas.

## Estrategia de satisfacción

- e2e holdout (Playwright, brand-guarded) para SCEN-VP-01..04.
- unit `presentational.test.ts` actualizado (UIcon en vez de SVG inline; copy/brand intactos).
- git diff para SCEN-VP-05.
- Runtime agent-browser: screenshot desktop + móvil; 0 errores de consola propios.
- Typecheck `ui-alquicarros`, delta limpio.
