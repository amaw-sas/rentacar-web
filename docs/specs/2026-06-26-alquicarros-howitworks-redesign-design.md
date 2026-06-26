# Rediseño de la sección "Cómo Funciona" — alquicarros

**Fecha:** 2026-06-26
**Alcance:** solo `packages/ui-alquicarros/app/components/home/HowItWorks.vue`.
**Tipo:** restructura visual de presentación. Sin cambios de datos, API ni SEO.

## Contexto

`HowItWorks.vue` (`<HomeHowItWorks>`) renderiza la sección "Cómo Funciona" en home (`/`), `CityPage.vue` y `/reservas`. Hoy: badges flotantes 01/02/03 sobre cada card, fotos `paso-*.jpg`, títulos/descripciones largos, flechas-conector entre cards, barra-underline naranja, y un trust footer.

## Objetivo

Adoptar la jerarquía del mockup: un **stepper horizontal** (círculos 1-2-3) sobre **3 cards** con **icono de línea naranja** + título corto + descripción corta. El trust footer se conserva.

## Decisiones tomadas

| Decisión | Valor |
|---|---|
| Alcance | Solo alquicarros |
| Stepper | Decorativo estático: paso 1 activo (naranja), 2/3 inactivos (gris); conector 1→2 naranja, 2→3 gris |
| Iconos | `@nuxt/icon` (UIcon) con lucide — patrón establecido en el repo |
| Copy | Texto corto del mockup (verbatim) |
| Trust footer | Conservar |
| Arquitectura | Un solo componente (~120 líneas, cohesivo) — sin extraer hijo |

## Estructura

Se conserva el shell: `<section id="how-it-works" class="... bg-[#EDF0F5] ...">`, heading "Cómo Funciona" + subtítulo "Alquila tu carro en 3 simples pasos", y el trust footer ("Seguridad • Transparencia • Soporte 24/7" + "Estamos contigo en todo el proceso.").

### Stepper rail (nuevo, decorativo)
- `aria-hidden="true"` — contenido semántico lo portan las cards.
- 3 círculos con número: **paso 1** `bg-brand-600 text-white`; **2 y 3** `bg-white border border-gray-300 text-gray-400`.
- 2 conectores (líneas): **1→2** `bg-brand-600`; **2→3** `bg-gray-300`.
- Centrado, horizontal en todos los breakpoints (compacto en móvil).

### Cards (3)
- `bg-white rounded-2xl border border-gray-200 shadow-sm`, hover sutil, centrado.
- **UIcon** `text-brand-600`, tamaño grande (~40px): `i-lucide-map-pin` / `i-lucide-calendar-check` / `i-lucide-key`.
- **Título** `font-bold text-gray-900`; **descripción** `text-gray-500`.
- Se eliminan: `NuxtImg` (fotos), barra-underline, flechas entre cards, badge flotante.

### Copy (verbatim del mockup)
1. **Elige ciudad y auto** — "Selecciona la ciudad y el vehículo que mejor se adapte a tu viaje."
2. **Reserva en minutos** — "Elige fechas, confirma y recibe tu confirmación al instante."
3. **Recoge y conduce** — "Recoge tu auto en la sucursal seleccionada y comienza tu aventura."

### Datos
`steps[]`: se reemplaza `image/imageAlt` por `icon` (string i-lucide-*); se mantiene `number`, `title`, `description`. Assets `paso-*.jpg` quedan sin uso (no se borran — fuera de alcance).

### Tailwind v4
- Stepper usa flex/centrado, **sin** `transform: translate()` hand-rolled → evita el gotcha de doble-offset del critical CSS. El badge flotante (que usaba `-translate-x-1/2`) se elimina; no se toca el critical CSS de `nuxt.config.ts`.
- Cualquier gradiente usa `bg-linear-to-*` (no el alias v3).

## Blast radius

- **Modificado:** `packages/ui-alquicarros/app/components/home/HowItWorks.vue`.
- **Consumidores:** home, CityPage, `/reservas` de alquicarros heredan el cambio. Otras marcas tienen su propio componente — sin tocar.
- Sin migración de datos, API ni SEO.

## Escenarios observables

- **SCEN-HW-01 — Stepper con estado.** Given la sección en home, When se renderiza, Then hay un rail con círculos "1","2","3"; el "1" tiene fondo naranja de marca y los "2"/"3" fondo claro con número gris; el conector 1→2 es naranja y el 2→3 gris.
  Evidence: DOM — círculo "1" con background rgb(239,150,0); círculos "2"/"3" sin ese fondo; primer conector con bg de marca, segundo gris.
- **SCEN-HW-02 — Iconos de línea, no fotos.** Given una card de paso, When se renderiza, Then muestra un icono UIcon naranja (`i-lucide-map-pin`/`calendar-check`/`key`) y NO una imagen.
  Evidence: DOM — cada card contiene un elemento icono con color de marca; el primer card usa el glyph de map-pin.
- **SCEN-HW-03 — Copy del mockup.** Given la sección, When se renderiza, Then los títulos son "Elige ciudad y auto", "Reserva en minutos", "Recoge y conduce" con sus descripciones cortas.
  Evidence: DOM — textContent de los 3 `<h3>` y sus `<p>`.
- **SCEN-HW-04 — Sin fotos en la sección.** Given la sección rediseñada, When se renderiza, Then no hay ningún `<img>`/NuxtImg dentro de `#how-it-works`.
  Evidence: DOM — `#how-it-works img` count 0.
- **SCEN-HW-05 — Trust footer preservado.** Given la sección, When se renderiza, Then aparece "Seguridad • Transparencia • Soporte 24/7" y "Estamos contigo en todo el proceso.".
  Evidence: DOM — textContent presente bajo las cards.
- **SCEN-HW-06 — Renderiza donde se usa.** Given home (`/`) y una city page (`/[city]`), When cargan, Then la sección `#how-it-works` está presente y visible en ambas.
  Evidence: DOM — `#how-it-works` visible en `/` y en una ciudad.
- **SCEN-HW-07 — Sin regresión cross-marca.** Given alquilame y alquilatucarro, When se inspecciona el diff, Then sus componentes quedan sin tocar; solo `packages/ui-alquicarros/` (+ docs/e2e).
  Evidence: `git diff --name-only origin/main` limpio fuera de ui-alquicarros.

## Estrategia de satisfacción

- e2e holdout (Playwright, brand-guarded a alquicarros) para SCEN-HW-01..06.
- git diff para SCEN-HW-07.
- Runtime agent-browser: screenshot desktop + móvil vs mockup, 0 errores de consola / requests fallidos.
- Typecheck `ui-alquicarros`, sin errores nuevos (delta vs baseline).
