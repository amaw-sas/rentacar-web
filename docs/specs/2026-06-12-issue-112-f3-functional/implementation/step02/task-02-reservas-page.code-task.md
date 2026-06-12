## Status: PENDING
## Blocked-By: step01/task-01-searcher-city-derivation.code-task.md
## Completed:

# Task: Página `/reservas` (búsqueda centralizada)

## Description
Crear la página nueva `/reservas` (exclusiva de alquilame) que centraliza la búsqueda: un hero rojo con el `<Searcher>` prominente + secciones de confianza reusadas de F1. Al hacer submit navega a las URLs profundas `buscar-vehiculos/...` existentes (vía la derivación de ciudad de step 1) — resultados y SEO intactos, sin redirects.

## Background
`/reservas` no existe hoy. Es una page file por marca (`packages/ui-alquilame/app/pages/reservas/index.vue`) → aislada (otras marcas no la tienen). Reusa el lenguaje visual aprobado en F1/F2: gradiente rojo `bg-linear-to-br from-hero-from to-hero-to` con `[--ctx-text-primary:#fff]`, headings Plus Jakarta. El `<Searcher>` debe ir en `<ClientOnly>` con fallback `<PlaceholdersSearcher>` de altura fija (guard #109: sin shift de hidratación, sin `Date`/`today()` horneado en SSR/ISR). Patrón espejo de `city/Hero.vue:80-96`.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-12-issue-112-f3-functional-design.md` (Parte A)

**Additional References:**
- Plan Step 2; `packages/ui-alquilame/app/components/city/Hero.vue` (patrón hero+Searcher+#109); componentes `home/*` (HomeHowItWorks/HomeRequirements/HomeStats/HomeContact)

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. `app/pages/reservas/index.vue`: hero rojo (`bg-linear-to-br`, `[--ctx-text-primary:#fff]`) con headline/subcopy de búsqueda + `<Searcher>` prominente en `<ClientOnly>` + `<PlaceholdersSearcher>` fallback de altura fija (`h-[\d+px]`).
2. Montar secciones de confianza reusadas de F1: `HomeHowItWorks`, `HomeRequirements`, `HomeStats`, `HomeContact`. `HomeContact reserveAnchor` apunta al hero in-page de `/reservas` (el ancla existe en esta página).
3. SEO propio: title/description/canonical/og de `/reservas`. NO emitir Product/FAQPage de city (esos son de las city pages). Breadcrumb simple (Inicio → Reservas) si aplica el patrón del repo.
4. NUNCA `bg-gradient-to-*` (usar `bg-linear-to-*`). Sin `Date`/`today()` en el markup SSR.
5. Test `app/pages/reservas/__tests__/index.test.ts` con los contratos observables.

## Dependencies
- **step01** (derivación de ciudad): el `<Searcher>` en `/reservas` depende de ella para armar la URL correcta.
- **Componentes `home/*`**: ya existen (F1), se reusan tal cual.

## Implementation Approach
1. Crear la page file con el hero + Searcher (espejo de `city/Hero.vue`) y las secciones `home/*`.
2. Definir SEO con el composable base del repo (`useBaseSEO`/`useSeoMeta`) sin schemas city.
3. Escribir el test cubriendo hero/gradiente/Searcher/#109/sin-schema-city.

**Note:** Suggested approach.

## Acceptance Criteria
1. **Hero + Searcher**
   - Given `/reservas` renderizada
   - When se inspecciona el hero
   - Then tiene `bg-linear-to-br from-hero-from to-hero-to` + `[--ctx-text-primary:#fff]`, monta `<Searcher>` en `<ClientOnly>` con `<PlaceholdersSearcher>` de altura fija (`h-[\d+px]`), y headings `.heading-*` (Jakarta)
2. **Navegación funcional**
   - Given `/reservas` con una sucursal de recogida + fechas/horas válidas
   - When se hace submit
   - Then navega a `/{ciudad-de-la-sucursal}/buscar-vehiculos/...` (resultados existentes), sin redirect
3. **SEO sin schema city + estilo**
   - Given el HTML de `/reservas`
   - When se inspecciona
   - Then hay title/description/canonical/og propios y NO hay Product/FAQPage de city; `bg-gradient-to-` = 0; sin `Date`/`today()` en SSR; el test del paso cubre estos contratos

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: page, reservas, hero, seo, cls
- **Required Skills**: Nuxt pages, Vue 3, SEO meta, Tailwind 4
- **Related Tasks**: step01 (blocker), step03/04/05 (CTAs apuntan acá)
- **Step**: 02 of 09
- **Files to Modify**: `packages/ui-alquilame/app/pages/reservas/index.vue`, `packages/ui-alquilame/app/pages/reservas/__tests__/index.test.ts`
- **Files to Read**: `packages/ui-alquilame/app/components/city/Hero.vue`, `packages/ui-alquilame/app/components/home/Contact.vue`, `packages/ui-alquilame/app/components/home/Hero.vue`, `packages/ui-alquilame/app/components/city/__tests__/Hero.test.ts`
- **Context Estimate**: M
- **Scenario-Strategy**: required
