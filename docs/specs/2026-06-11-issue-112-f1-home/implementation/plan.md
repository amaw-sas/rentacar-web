# F1 — Reskin del home alquilame · Plan de implementación

**Spec (detailed design):** `docs/specs/2026-06-11-issue-112-f1-home-design.md` (aprobada).
**Rama:** `feat/issue-112-f1-home` · **Holdout:** SCEN-F1-01..13.
**Approach:** híbrido — secciones presentacionales como componentes Vue nuevos bajo `app/components/home/`; engine (hero/fleet) preservado. Datos reales + estilo del diseño.

---

## Chunk 1: File structure + steps

### File-structure map

Todo bajo `packages/ui-alquilame/` (aislamiento F1 — `logic/` y otras marcas intactas).

**NUEVOS** (`app/components/home/`, un componente = una sección, responsabilidad única):

| Archivo | Responsabilidad | Datos / deps |
|---|---|---|
| `AnnouncementBar.vue` | Barra superior descartable | copy diseño; estado de cierre **client-only** (no hornear bajo ISR) |
| `Hero.vue` | Hero restilizado (gradiente `bg-linear`, headline, selector) | **`SelectBranch`** (preservar), `ImagesFamily`, HeroHeadline/Title/Description |
| `Fleet.vue` | 4 cards de categoría con "Desde $X/día" real + modal→Ver disponibilidad | lista local `{code,title,desc,image}` con **los nombres curados** (C=Económico, FX=Sedán Automático, GC=Camioneta SUV, LE=Camioneta Premium — copiados de `representativeCategories`, ver deuda abajo) + `pickRepresentativeDailyPrice(categories.find(code).month_prices)` (import de logic); `SelectBranch` en modal |
| `HowItWorks.vue` | 3 pasos | copy diseño |
| `ValueProps.vue` | 4 props; headline con el nombre de marca desde **`organization.brand`** ("Alquilame", capitalizado — NO `franchise.shortname` que es minúscula `"alquilame"`) | config |
| `Stats.vue` | Banda de stats | copy diseño (excepción nombrada en spec) |
| `Cities.vue` | Grid de ciudades, links internos `/{city.id}` | `useData().cities` (todas activas); imágenes `Images/Ciudades` |
| `Reviews.vue` | Testimonios estilo review | `franchiseTestimonials[brandCode]`; `StarIcon` |
| `Partners.vue` | Marquee "Empresas Aliadas" | logos aliados (assets) |
| `Requirements.vue` | Requisitos | 4 requisitos (copy actual) + `ImagesPersona` |
| `Faq.vue` | Acordeón FAQ | `faqs` (`useData`); el `FAQPage` schema permanece en `index.vue` |
| `Contact.vue` | CTA contacto | `franchise.whatsapp` (URL completa, no re-envolver) + `franchise.phone` |

**MODIFICADOS:**

| Archivo | Cambio |
|---|---|
| `app/pages/index.vue` | Orquestar los `home/*` en el orden del diseño; **eliminar** sección `#video` + llamadas `usePromoVideoSchema()` y `useEarlyBookingPromotion()`; **conservar** `useBaseSEO`/`useHomeBreadcrumb`/og/`FAQPage`/canonical; `useHomeAggregateRating` **sin tocar** (no-regresión); headings adoptan `.heading-*` |
| `app/components/ChatWidget.vue` | **Restyle in-place** del FAB existente (ya montado como `LazyChatWidget` en `app/layouts/default.vue:126`, ya usa `franchise.whatsapp`/phone) — NO montar uno nuevo en `index.vue` (evita FAB duplicado) |

**Decomposición:** cada sección es un componente independiente, testeable por separado (un `*.test.ts` por contrato observable). `index.vue` queda como orquestador delgado. Imágenes reusan `Images/*` existentes (CLS: `aspect-ratio` reservado).

**Deuda declarada (F1-isolation):** `representativeCategories` es un `const` privado de `useCityProductSchema.ts` (logic) — para no tocar logic en F1, la lista de fleet se **duplica** localmente en `Fleet.vue` con los mismos nombres curados. Extraer/exportar la lista compartida (cambio que toca logic) queda diferido a una fase posterior. No es cost-free: es duplicación de un dato de dominio, asumida a propósito por aislamiento.

### Pasos de implementación (SDD: escenario → código → satisfacer)

> Cada paso deja el home renderizando (incremento demoable). Tamaño ≤ M. Tests unit colocados en `tests/` o `app/components/home/__tests__/` por paso.

1. **Hero restilizado** | M | deps: none
   - Escenario (SCEN-F1-01): el hero tiene gradiente rojo `bg-linear-to-br from-[#CC022B] to-[#94001E]`, headline, y `SelectBranch` funcional (mismo destino al elegir ciudad).
   - AC: `Hero.vue` creado y montado en `index.vue`; `SelectBranch` preservado (mismo comportamiento/`data-testid`); gradiente con `bg-linear-*` (no `bg-gradient-to-*`); test asegura presencia de `SelectBranch` y clase `bg-linear`.

2. **Fleet con precio real** | M | deps: 1
   - Escenario (SCEN-F1-02): 4 cards (C/FX/GC/LE) cada una con "Desde $X/día" de `pickRepresentativeDailyPrice` (omitida fail-soft si no hay fila activa; **nunca $0**), y "Ver disponibilidad" abre modal con `SelectBranch`.
   - AC: `Fleet.vue` con lista local de 4 categorías **con nombres curados** (Económico/Sedán Automático/Camioneta SUV/Camioneta Premium — alineado con la spec, no las etiquetas genéricas del mockup); precio vía import de `pickRepresentativeDailyPrice`; card sin precio cuando `undefined` (no muestra $0); modal→`SelectBranch` preservado; test: 4 cards, precio formateado, fail-soft sin $0, botón abre modal.

3. **How-it-works + Value props + Stats** | M | deps: 1
   - Escenario (SCEN-F1-03 parcial): existen 3 pasos (Elige/Reserva/Recoge), 4 value props con headline usando el nombre de marca desde `organization.brand`, y banda de stats con copy del diseño.
   - AC: 3 componentes creados y montados; headline desde `organization.brand` ("Alquilame", capitalizado) — NO hardcodea "Alquilame" ni usa `franchise.shortname` (minúscula); test: secciones presentes, headline deriva de config.

4. **Cities** | M | deps: 1
   - Escenario (SCEN-F1-04): la sección lista **todas las ciudades activas** (`useData().cities`) con `href="/{city.id}"` interno; cero `wa.me`.
   - AC: `Cities.vue` itera `useData().cities`; links internos; test: enlaces `/{id}`, cero `wa.me`, cuenta = longitud del data source (no número fijo).

5. **Reviews restilizado** | S | deps: 1
   - Escenario (SCEN-F1-05): usa `franchiseTestimonials` reales; sin "43"/"5,0" hardcoded del mockup.
   - AC: `Reviews.vue` con `franchiseTestimonials[brandCode]`; test: sin literales "43"/"5,0"; renderiza cards reales.

6. **Requirements + FAQ restilizados** | S | deps: 1
   - Escenario (SCEN-F1-06): requisitos y faq con estilo del diseño, datos reales; `FAQPage` schema persiste.
   - AC: `Requirements.vue` + `Faq.vue` (acordeón con `faqs`); `FAQPage` schema sigue en `index.vue`; test: faqs reales, schema presente.

7a. **Contact + Announcement + FAB restyle** | M | deps: 1
   - Escenario (SCEN-F1-03 resto, parte 1): contact (config), barra de anuncio descartable (client-only), y FAB de contacto restilizado.
   - AC: `Contact.vue` + `AnnouncementBar.vue` creados; `ChatWidget` **restilizado in-place** (ya montado en `default.vue:126` — NO duplicar); contact usa `franchise.whatsapp` (URL, sin re-envolver) + `franchise.phone`; estado de cierre del anuncio client-only (no SSR/ISR-horneado); test: secciones presentes, sin número hardcoded, un solo FAB.

7b. **Partners "Empresas Aliadas" (marquee de texto)** | S | deps: 1
   - Escenario (SCEN-F1-03 resto, parte 2): marquee de aliados presente.
   - **El diseño usa TEXTO, no logos**: cada aliado (Localiza/Avis/Alquicarros/Alquilatucarro) es un `<span class="font-heading text-2xl font-extrabold text-white/75">` — NO hay `<img>` ni assets de logo en el dist. Replicar el marquee de etiquetas de texto (animación CSS); **sin sourcing de assets** (no existen). Nombres como lista local en el componente.
   - AC: `Partners.vue` con marquee de texto (spans con nombres, estilo del diseño); test: marquee presente con los nombres; runtime (step 10) asegura que el **texto** renderiza (no 200 de imágenes).

8. **Eliminar #video + schemas promo/video** | S | deps: 1
   - Escenario (SCEN-F1-07): no existe la sección video/60%, y el JSON-LD no tiene `VideoObject` ni `Offer/Promotion` (EarlyBooking).
   - AC: sección `#video` removida de `index.vue`; `usePromoVideoSchema()` y `useEarlyBookingPromotion()` eliminadas; test: grep del render sin VideoObject/Promotion.

9. **Headings adoptan `.heading-*` (Plus Jakarta)** | S | deps: 1–8
   - Escenario (SCEN-F1-08): los headings de página computan Plus Jakarta Sans (adoptan `.heading-*`), cerrando deuda F0-03.
   - AC: headings de las secciones usan clases `.heading-*`; test estático: headings con clase `heading-*` (runtime confirma font-family en step de verificación).

10. **Integración + verificación del holdout (runtime, preview)** | M | deps: 1–9
    - Escenario: holdout completo satisfecho en el preview Vercel.
    - AC: `agent-browser` confirma — layout por sección, precio real en fleet, font-family Plus Jakarta en headings (F1-08), cities internas (F1-04), gradientes renderizan `bg-linear` (F1-10), consola limpia, CLS ≤ baseline (F1-12), JSON-LD sin VideoObject/Promotion (F1-07); aislamiento `git diff main --stat` solo `ui-alquilame`+`docs/specs` (F1-13); grep `bg-gradient-to-` **acotado a los archivos de home/chrome tocados por F1** = 0 (NO repo-wide — `gana.vue`/`blog/[...slug].vue` tienen `bg-gradient-to-*` pre-existente fuera de scope); SEO no-regresión (F1-11); E2E `BRAND=alquilame` subconjunto home sin regresión + `data-testid` intactos (F1-09, baseline = los 3 fallos pre-existentes acoplados a alquilatucarro). Cierre con `/verification-before-completion`.

### Prerequisitos
- Worktree `.worktrees/issue-112-f1-home` (branch desde `main` con F0). Sin nuevas deps.
- Preview Vercel del branch para runtime (push-gated).

### Testing
- **Unit (estático)**: por paso, en `app/components/home/__tests__/` o `tests/` — contratos observables (presencia de sección, links internos, precio fail-soft, sin literales hardcoded, schemas removidos, headings con `.heading-*`).
- **Runtime**: paso 10, `agent-browser` + `vitals` en el preview.
- **E2E**: `BRAND=alquilame` contra el preview (config ya soporta `PLAYWRIGHT_BASE_URL`), subconjunto home; comparar fallos vs baseline (los 3 pre-existentes acoplados a alquilatucarro NO cuentan).

### Rollout
- Commits faseados (`feat(alquilame): F1 step NN …`, `Refs #112`). Push gated. PR `Refs #112` (NO `Closes` — F3 cierra #112). Merge tras runtime verde (alquilame.co sigue legacy → intermedio sin tráfico).
