# Rediseño de las cards estáticas de flota — alquicarros

**Fecha:** 2026-06-26
**Alcance:** solo `packages/ui-alquicarros` — `app/components/home/Fleet.vue` + nuevo `FleetCard.vue`.
**Tipo:** restructura visual de presentación. Sin cambios en lógica de datos, precios ni en el flujo de reserva.

## Contexto

`Fleet.vue` renderiza 6 cards de categorías curadas (C, F, FX, G4, GC, LE) en home (`/`) y city pages (`/[city]`). Los precios son **reales** (Supabase vía `useFetchRentacarData` + `pickRepresentative*Price`), nunca hardcodeados. Un toggle Diario/Mensualidad cambia precio y texto de kilometraje. El CTA abre un `LazyUModal` con `SelectBranch` para elegir ciudad y "Ver disponibilidad".

Estas son cards **estáticas** (catálogo de marketing), distintas de `CategoryCard.vue` (resultados de disponibilidad, API). Este rediseño NO toca `CategoryCard.vue`.

## Objetivo

Adoptar la jerarquía visual del mockup propuesto (`/tmp/card-estatica.jpg`): badge de categoría superpuesto sobre la imagen, modelos como título, chips redondeados para specs, precio más prominente, CTA full-width.

## Decisiones tomadas

| Decisión | Valor |
|---|---|
| Alcance de marcas | Solo alquicarros (alquilame/alquilatucarro sin tocar) |
| 2º chip | Maletas — mantener dato `luggage` existente; solo cambia a estilo chip |
| Imágenes | JPGs actuales en `public/images/vehicles/`; el mockup es referencia de **estructura**, no de assets |
| Toggle Diario/Mensualidad | Conservar; las cards rediseñadas siguen reaccionando al `plan` |
| Arquitectura | Extraer `FleetCard.vue` (presentación) — `Fleet.vue` queda como orquestador |

## Arquitectura

**`Fleet.vue` (orquestador — lógica intacta):** mantiene `CATEGORIES`, `useFetchRentacarData`, `pickRepresentativeDailyPrice`, `pickRepresentativeMonthlyPrice`, `useMoneyFormat`, `plan` ref, toggle, heading y grid. Cambia solo el cuerpo del `v-for`: delega a `<FleetCard :card="card" :plan="plan" />`.

**`FleetCard.vue` (nuevo — presentación pura):**
- Props: `card` (un elemento de `cards` computed: `{ code, title, transmission, example, description, passengers, luggage, image, alt, dailyPrice?, monthlyPrice? }`) y `plan` (`'daily' | 'monthly'`).
- Recibe `moneyFormat` vía el auto-import `useMoneyFormat()` propio (composable del layer), para no pasar funciones por props.
- Renderiza el card completo + el `LazyUModal`/`SelectBranch` CTA (movido tal cual desde `Fleet.vue`, `data-testid`s y `hydrate-on-visible` preservados).

### Estructura del card

```
┌─────────────────────────────────┐
│  [imagen JPG, aspect-16/10]     │  ← contenedor relative, hover-scale
│                                  │
│  ╭──────────────────╮           │
│  │ Compacto - Manual │ ← badge  │  ← absolute bottom-left, bg-brand-600,
│  ╰──────────────────╯           │     texto bold oscuro
├─────────────────────────────────┤
│  Kia Picanto / Suzuki S-Presso  │  ← título: {example} o similar
│  o similar                       │     bold, text-gray-900, font-heading
│                                  │
│  Ágil en el tráfico y fácil...  │  ← descripción, text-gray-600
│                                  │
│  Desde $220.000/día  + IVA      │  ← precio: bold grande text-brand-600
│                                  │     reacciona a plan; fail-soft
│  ╭───╮ ╭───╮ ╭───────────────╮  │
│  │👤 5│ │🧳 2│ │ Kilometraje... │ │  ← chips redondeados gris
│  ╰───╯ ╰───╯ ╰───────────────╯  │
│  ╭─────────────────────────────╮ │
│  │   VER DISPONIBILIDAD        │ │  ← CTA full-width bg-brand-600 uppercase
│  ╰─────────────────────────────╯ │
└─────────────────────────────────┘
```

### Detalles de implementación

- **Badge:** `absolute bottom-3 left-3`, `bg-brand-600 text-gray-900 font-bold`, `rounded-lg px-3 py-1.5 text-sm`. Texto: `{{ card.title }} - {{ card.transmission }}`. El contenedor de imagen pasa a `relative`.
- **Título:** `{{ card.example }} o similar`, `text-xl font-bold font-heading text-gray-900`.
- **Precio (diario):** "Desde" `text-gray-500`, valor `text-2xl font-extrabold font-heading text-brand-600`, "+ IVA" `text-gray-400`. Mensual: "IVA incluido" en `text-emerald-600`. Bloque omitido si el precio del plan activo es `undefined`.
- **Chips:** cada uno `inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 border border-gray-200`. Iconos SVG reutilizados (pasajeros, maleta). El chip de kilometraje muestra "Kilometraje ilimitado" (diario) o "1.000 km/mes incluidos" (mensual) — strings exactos, sin cambiar el copy actual.
- **CTA:** `block w-full py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-gray-900 font-bold uppercase` dentro del `LazyUModal`, con `data-testid="fleet-card-cta-test"` (nuevo, para validación con selector estable).
- **Tailwind 4:** evitar `bg-gradient-to-*` (usar `bg-linear-to-*` si hace falta) y `transform: translate()` hand-rolled — gotchas conocidos del proyecto.

## Riesgos / blast radius

- **Archivos:** `packages/ui-alquicarros/app/components/home/Fleet.vue` (modificado), `packages/ui-alquicarros/app/components/home/FleetCard.vue` (nuevo).
- **Consumidores:** `Fleet.vue` se usa en home y city pages de alquicarros — ambas heredan el cambio. Otras marcas NO se afectan (componente propio por marca).
- **Tests:** `data-testid="fleet-tab-daily-test"` / `fleet-tab-monthly-test` viven en `Fleet.vue` (toggle) — se conservan. Cualquier `data-testid` del CTA dentro del card se mueve intacto a `FleetCard.vue`.
- **Sin migración de datos, sin cambios de API, sin cambios de SEO.**

## Escenarios observables (Given/When/Then)

- **SCEN-FC-01 — Badge de categoría sobre la imagen.**
  Given el home de alquicarros con la sección flota,
  When se renderiza la card "Compacto",
  Then aparece un badge naranja superpuesto en la esquina inferior izquierda de la imagen con el texto "Compacto - Manual".

- **SCEN-FC-02 — Modelos como título.**
  Given una card de flota,
  When se renderiza,
  Then el título principal (bajo la imagen) es el ejemplo de modelos seguido de "o similar" (ej. "Kia Picanto / Suzuki S-Presso o similar"), NO la categoría sola.

- **SCEN-FC-03 — Precio real prominente con fail-soft.**
  Given una categoría con precio diario activo positivo,
  When `plan === 'daily'`,
  Then la card muestra "Desde $X/día + IVA" con el valor real de `pickRepresentativeDailyPrice` en color marca;
  And Given una categoría sin precio activo positivo para el plan, no se renderiza ningún bloque de precio (nunca "$0").

- **SCEN-FC-04 — Specs como chips.**
  Given una card,
  When se renderiza,
  Then pasajeros, maletas y el texto de kilometraje aparecen como chips redondeados independientes (no como iconos en línea plana);
  And el valor de maletas es el `luggage` existente de la categoría.

- **SCEN-FC-05 — Toggle sigue gobernando las cards.**
  Given la sección flota,
  When el usuario activa "Mensualidad",
  Then cada card muestra "Desde $X/mes" (precio mensual real), el chip de kilometraje cambia a "1.000 km/mes incluidos", y el label fiscal a "IVA incluido".

- **SCEN-FC-06 — CTA preserva el flujo de reserva.**
  Given una card rediseñada con CTA `data-testid="fleet-card-cta-test"`,
  When el usuario hace tap/click en "VER DISPONIBILIDAD",
  Then se abre el modal con `SelectBranch` (mismo comportamiento actual), sin perder el primer tap en móvil (`hydrate-on-visible`).

- **SCEN-FC-07 — Sin regresión en otras marcas.**
  Given alquilame y alquilatucarro,
  When se construyen,
  Then su `Fleet.vue` permanece sin cambios (este rediseño no los toca).

## Estrategia de satisfacción

- Validación runtime con dev server del worktree + agent-browser: capturar screenshot de la grilla en home alquicarros, verificar badge/título/chips/CTA y el toggle (SCEN-FC-01..06).
- Comparación visual contra el mockup (estructura, no pixel-perfect: imágenes y precios son reales).
- `git diff --stat` confirma que solo se tocan archivos de ui-alquicarros (SCEN-FC-07).
- Typecheck de la marca (`ionice -c3 nice -n19 pnpm --filter ui-alquicarros typecheck`), cero errores nuevos.
- Cero errores de consola / requests fallidos en la validación runtime.
