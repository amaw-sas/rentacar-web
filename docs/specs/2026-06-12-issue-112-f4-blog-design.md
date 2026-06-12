# Issue #112 — F4: Blog reskin (fase de cierre)

**Fecha:** 2026-06-12
**Branch:** `feat/issue-112-f4-blog` · worktree `.worktrees/issue-112-f4-blog` · base `origin/main` (f4a9d66, con F0+F1+F2+F3)
**Cierre:** esta fase cierra #112 con `Closes #112`.

## Objetivo

Reskin de marca alquilame (rojo #CC022B, Plus Jakarta Sans headings + DM Sans body, tokens F0-F3) sobre las **dos páginas del blog**, hoy en estilo mayormente genérico (escala gris + `red-*` default + botón Facebook azul + gradiente v3 `bg-gradient-to-*`). Aislado a `packages/ui-alquilame`. Cero regresión en data, SEO/schema, comportamiento y E2E.

## No-objetivos

- NO tocar `packages/logic` ni las otras 2 marcas.
- NO cambiar el data contract (`BlogPost`), endpoints (`/api/blog/posts`, `/api/blog/post/[slug]`), ni el transform Valibot.
- NO cambiar el schema JSON-LD (`BlogPosting` + `BreadcrumbList`) ni los campos `useSeoMeta` (article meta).
- NO cambiar el comportamiento (filtros de categoría, navegación, MDC render, TOC, reading progress, ISR 3600s).
- NO crear directorio `app/components/blog/` nuevo salvo que un bloque inline justifique extracción (preferir restyle in-place).

## Decisiones de diseño (aprobadas por usuario 2026-06-12)

1. **CTAs de reserva → `/reservas`.** Hoy existen **3** CTAs de reserva, todos apuntando a `to="/"` (HOME, no a reserva): `index.vue:155` (footer), `[...slug].vue:143` (caja sidebar), `[...slug].vue:175` (bio del autor). Los **3** se retargetean a `/reservas` con copy de reserva. `<NuxtLink to="/reservas">`. **Anti-reward-hack: ningún CTA de reserva del blog puede seguir apuntando a `to="/"`** — el target viejo debe desaparecer, no solo agregarse el nuevo.
2. **Hero del index: oscuro restyleado sobre el ground del layout.** El `UPageHero` NO tiene fondo propio; el oscuro lo aporta `layouts/default.vue` (`bg-linear-to-b from-brand-900 to-brand-950`, F0, **fuera de scope**) y la página fuerza `colorMode:'light'` con texto blanco. "Oscuro restyleado" = renderizar el contenido del hero sobre ese ground rojo-oscuro heredado (ya on-brand, distinto de los heroes brillantes `hero-from/hero-to`), **sin agregar wrapper de fondo ni gradiente brillante**. Solo se restylea el CONTENIDO: h1 → `font-heading` conservando `text-white` (NO usar `.heading-*` crudo: su color oscuro haría el título invisible sobre el ground oscuro — si se usa, exige `[--ctx-text-primary:#fff]` en el contenedor); acento `text-red-500` → tono brand legible sobre oscuro. El hero del **detalle** sigue siendo imagen con overlay (convertir el único `bg-gradient-to-t` de `[...slug].vue:19` → `bg-linear-to-t` por la regla Tailwind 4).
3. **Share buttons: colores de plataforma.** 4 botones × 2 ubicaciones (sidebar `:109-134` + barra móvil `:242-269`). Conservar WhatsApp verde (`bg-green-500`) / Facebook azul (`bg-blue-600`) / X negro (`bg-black`) — convención UX de reconocibilidad, igual que el verde "confirmar" de F3. El azul de FB se acepta como color de plataforma, NO de marca. Solo el botón "copiar enlace" gris (`bg-gray-600`, ambas ubicaciones) pasa a token de marca.
4. **Chrome sin marca también entra al reskin** (mandato general "blog a marca"): back-to-blog button (`[...slug].vue:230`, `bg-gray-200 text-black`), bloque 404 (`[...slug].vue:275-285`, grises + `bg-red-700`), card de bio del autor (`[...slug].vue:158`, `bg-gray-50`). A tokens de marca/surface.

   **Política de superficies (aplica a TODA superficie estructural, no solo las 3 nombradas):** ningún `gray-*` crudo sobrevive como chrome. Mapeo con tokens F0:
   - Grounds de sección `bg-gray-100` (`index:19`, `slug:196`) → `bg-surface-soft` (#edf0f5).
   - Paneles/cards claros `bg-gray-50` (los **3 paneles sidebar** `slug:65/:90/:104` + bio `:158`) y cards `bg-white` → `bg-surface-softer`/`bg-surface-softest` (cards pueden quedar `bg-white` si necesitan contraste sobre el ground soft).
   - Pills `bg-gray-200` (`slug:96`, back button `:230`) → `bg-surface-soft` (back button: superficie soft + acento brand en hover/texto).
   - Panel CTA oscuro `bg-gray-900` (`index:146`) → `bg-brand-900` (#7a001a) con `[--ctx-text-primary:#fff]` para headings blancos.
   - **Excepción legibilidad:** el TEXTO neutro gris sobre superficies claras (`text-gray-600/700/900` de body/meta/títulos de card) se permite — es texto legible, NO chrome de marca. Solo backgrounds estructurales + acentos rojos rebrandean. No reemplazar texto gris por brand salvo los acentos (hover `text-red-700`→`text-brand-700`, etc.).
5. **`red-*` default → `brand-*`.** Todo el blog usa rojos Tailwind por defecto (`red-500/700/100`, p.ej. `rgb(185,28,28)`=red-700) que ≠ marca #CC022B. Los acentos rojos (badges categoría, filtro activo, hovers, links de prose, borde blockquote, code) pasan a la escala `brand-*`.

## Patrones heredados (F0-F3, no se re-deciden)

- Escala `brand-*` (600=#CC022B, 800=#94001E); usar tokens, no `red-*`/`gray-*` crudos para chrome de marca.
- `bg-linear-to-*` NUNCA `bg-gradient-to-*` (con `@theme` custom da `background-image:none`). Ver `reference_tailwind4_gradient_bg_linear`.
- `.heading-*` traen color OSCURO + tamaño; sobre fondo oscuro/rojo añadir `[--ctx-text-primary:#fff]` en el contenedor.
- Body hereda DM Sans global; headings → `font-heading`/`.heading-*`. Sin `<link>` Google Fonts (vía @nuxt/fonts).
- Preservar selectores E2E (el blog usa text/href, sin `data-testid`).

## Alcance por archivo (file structure)

| Archivo | Responsabilidad | Cambio |
|---|---|---|
| `app/pages/blog/index.vue` (283 L) | Listado: hero, featured, filtros categoría, grid, empty, CTA footer | Restyle in-place: hero contenido brand (font-heading+white), cards brand-*, filtros activo brand, footer CTA `:155`→/reservas |
| `app/pages/blog/[...slug].vue` (670 L) | Detalle: progress bar, hero img, meta, MDC, sidebar (TOC/tags/share/CTA), share bar móvil, bio autor, relacionados, back, 404, **`<style>` prose** | Restyle in-place: tokens brand-*, `bg-linear-to-t` (`:19`), share platform+debrand gris copy, CTAs `:143`+`:175`→/reservas, bio card surface (`:158`), back button (`:230`), 404 (`:275`); **`<style>` block `:526-670` = dueño del prose MDC** (h2/p/a/code/table/blockquote): red-700 `rgb(185,28,28)`→brand #CC022B |
| `app/assets/css/rentacar-main/blog.css` (34 L) | **Dueño de callouts/admonitions** del MDC (`.prose div.bg-muted`, `.prose div.text-default`, `article.prose > div.group`) — selectores DISJUNTOS del `<style>` de la página, sin conflicto | Ampliar acentos a tokens brand, callouts legibles |
| `app/pages/blog/__tests__/index.test.ts` (NEW) | Guard de marca del index | Asserts: hero `text-white`+`font-heading`, cero `bg-gradient-to-`, footer CTA `to="/reservas"` y **cero `to="/"` de reserva**, filtros |
| `app/pages/blog/__tests__/slug.test.ts` (NEW) | Guard de marca del detalle | Asserts: tokens brand, share platform (green/blue/black) preservados + copy debrandado, ambos CTAs `to="/reservas"` y **cero `to="/"`**, `bg-linear-to-t`, schema fields presentes |

## Estrategia de satisfacción

- **Unit (vitest, desde el WORKTREE root):** tests de marca nuevos asercionan clases/tokens sobre el markup renderizado (cero `bg-gradient-to-`, cero `text-blue-*` salvo el FB share intencional documentado, CTA `to="/reservas"`, `.heading-*`/`font-heading` en títulos, share platform colors presentes, copy-button debrandado). NO debilitar: si un assert falla, arreglar el componente, no el test.
- **Typecheck:** `ionice -c3 nice -n19 pnpm --filter ui-alquilame typecheck` desde el worktree — delta 0 vs baseline (apples-to-apples con `.nuxt` fresco).
- **Aislamiento:** `git diff main --stat` = solo `packages/ui-alquilame/**` + `docs/specs/**`; `packages/logic` y las otras 2 marcas vacías.
- **Runtime (Vercel preview, /agent-browser):** /blog y un /blog/[slug] real — hero oscuro texto blanco legible, gradiente detalle renderiza (`background-image != none`), cards brand, filtros funcionan, CTA→/reservas navega, share buttons visibles, cero errores de consola nuevos, cero requests fallidos, CLS ≤ baseline.
- **SEO:** curl+grep del HTML renderizado — `BlogPosting` + `BreadcrumbList` JSON-LD presentes, article meta (published/modified/author/section/tags) intactos. URL absoluta de og:image. Ver `reference_nuxt_seo_og_image_absolute`.
- **E2E:** `BRAND=alquilame` `e2e/blog.spec.ts` contra el preview — delta 0 net-new failures vs baseline main (los fallos remotos flaky preexistentes no cuentan).

## Holdout — escenarios observables (SCEN-F4)

- **SCEN-F4-01** — Index hero oscuro: dado `/blog`, el h1/heading rinde en blanco Plus Jakarta sobre fondo oscuro (texto NO invisible), shortname con acento rojo de marca.
- **SCEN-F4-02** — Cards del listado (featured + grid): usan tokens brand (acento rojo, `font-heading`), cero `bg-gradient-to-*`, cero gris-como-color-de-marca.
- **SCEN-F4-03** — Filtros de categoría: estado activo en rojo de marca, inactivo neutro; click filtra los posts (comportamiento preservado).
- **SCEN-F4-04** — CTA footer del index enlaza a `/reservas` con copy de reserva, Y ningún CTA de reserva del index sigue apuntando a `to="/"` (target viejo eliminado).
- **SCEN-F4-05** — Detalle hero: imagen + overlay `bg-linear-to-t` renderiza; título `.heading-*` blanco sobre imagen; fila de meta (autor/fecha/tiempo) intacta.
- **SCEN-F4-06** — Cuerpo MDC: prose estilado a marca (blog.css), callouts legibles (contraste correcto).
- **SCEN-F4-07** — Sidebar: TOC + tags brand; caja CTA del sidebar Y CTA de bio del autor → `/reservas`; ningún CTA de reserva del detalle sigue en `to="/"`.
- **SCEN-F4-08** — Share buttons: WhatsApp verde / FB azul / X negro preservados (plataforma); botón copiar gris → token de marca; barra share móvil presente.
- **SCEN-F4-09** — Sección bio del autor: estilada a marca (token surface, no `gray-50` crudo).
- **SCEN-F4-10** — Relacionados: cards brand, enlazan a `/blog/[slug]`.
- **SCEN-F4-11** — SEO preservado: `BlogPosting` + `BreadcrumbList` JSON-LD intactos en el HTML; article meta (published/modified/author/section/tags) presentes.
- **SCEN-F4-12** — E2E `blog.spec.ts` (BRAND=alquilame): index carga, 7 slugs cargan, navegación, meta SEO, HTTP 200 — delta 0 vs baseline.
- **SCEN-F4-13** — Aislamiento: `git diff main` = solo `packages/ui-alquilame` + docs; logic + otras 2 marcas vacías; typecheck delta 0.
- **SCEN-F4-14** — Chrome sin marca rebrandeado: back-to-blog button, bloque 404 y card de bio del autor usan tokens de marca/surface (no `bg-gray-200 text-black`, no `bg-gray-50` crudo); prose MDC con links/blockquote/code en brand #CC022B (no red-700 `rgb(185,28,28)`).

## Riesgos

- **Hero del index (fondo lo da el layout):** el `UPageHero` no tiene fondo; el oscuro viene de `default.vue` (fuera de scope). NO agregar wrapper de fondo en la página (rompería el patrón y duplicaría el ground). El título es `text-white` explícito hoy y debe seguir legible — añadir `font-heading` SIN cambiar a `.heading-*` crudo (su color oscuro lo volvería invisible); si se usa `.heading-*`, exige `[--ctx-text-primary:#fff]`. B1 cazado en F0/F1.
- **Gradiente del overlay del detalle:** el único `bg-gradient-to-t from-gray-900/80` (`:19`) usa color directo (no @theme) así que técnicamente renderiza, pero se convierte a `bg-linear-to-t` por consistencia de regla — verificar en runtime que el overlay sigue visible sobre la imagen.
- **Doble dueño del prose:** `<style>` de la página (`:526-670`, elementos MDC) y `blog.css` (callouts `div.bg-muted`) tienen selectores disjuntos — confirmar que el rebrand de acentos (red-700→#CC022B) en ambos no introduce solape; acotar selectores, no usar `.prose *` amplio.
- **og:image / schema:** no tocar los campos (`BlogPosting`, `BreadcrumbList`, article meta); solo estilo. Verificar en HTML renderizado (curl+grep), no en source. Ver `reference_nuxt_seo_og_image_absolute`.
- **E2E selectores text/href:** `blog.spec.ts` usa `getByText`/`href*=/blog/` sin testids — el reskin no debe cambiar textos visibles ni los `href` de navegación a posts.

---
*F4 cierra el reskin de marca alquilame (#112). Cadena: F0 fundación → F1 home → F2 city+legales → F3 funcional/reservas → **F4 blog**.*
