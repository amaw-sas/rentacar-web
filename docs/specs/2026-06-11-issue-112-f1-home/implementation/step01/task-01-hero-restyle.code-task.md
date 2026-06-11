## Status: PENDING
## Blocked-By:
## Completed:

# Task: F1 Step 1 — Hero restilizado (preservando SelectBranch)

## Description
Restilizar el hero del home de alquilame al diseño nuevo (gradiente rojo, headline, layout) como un componente `app/components/home/Hero.vue`, montado en `index.vue`. Preserva el motor de búsqueda (`SelectBranch`) y su comportamiento/`data-testid`. Primer paso: deja el home renderizando con el nuevo hero.

## Background
F0 dejó el chrome de marca; el cuerpo del home sigue legacy (`index.vue` usa `UPageHero` con `HeroHeadline`/`HeroTitle`/`HeroDescription`/`SelectBranch`/`ImagesFamily`). F1 reskina el cuerpo con approach híbrido: secciones presentacionales como componentes nuevos, engine preservado. Lección F0: gradientes con `bg-linear-to-*` (NO `bg-gradient-to-*`, que con tokens `@theme` custom renderiza transparente).

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f1-home-design.md` (SCEN-F1-01; sección hero del mapeo)
**Additional:**
- Plan: `docs/specs/2026-06-11-issue-112-f1-home/implementation/plan.md` (paso 1, file map)
- Diseño entregado: `/tmp/alqui_f1_design/dist/index.html` (`<section id="hero">`)
- Reuso de gradiente: `[[reference_tailwind4_gradient_bg_linear]]`

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. `Hero.vue` reproduce el layout del hero del diseño: gradiente `bg-linear-to-br from-[#CC022B] to-[#94001E]` (o tokens `hero-from/to` con `bg-linear-*`), headline, y el bloque selector de ciudad.
2. `SelectBranch` se renderiza dentro del hero con el MISMO comportamiento y `data-testid` que hoy (sin cambios de lógica).
3. Cero `bg-gradient-to-*`; usar `bg-linear-to-*`.
4. Headings del hero usan `.heading-*` (Plus Jakarta) donde aplique.
5. `index.vue` monta `<HomeHero />` en lugar del bloque `UPageHero` inline del hero.

## Dependencies
- **F0 mergeado en main**: tokens `hero-from/to`, fuentes — verificar que el branch parte de `main` con F0.
- **`SelectBranch`**: componente existente en `app/components/SelectBranch.vue` — reusar tal cual.

## Implementation Approach
1. Crear `app/components/home/Hero.vue` con el markup/estilo del diseño (gradiente `bg-linear`, headline, contenedor del selector).
2. Mover `SelectBranch` (+ HeroHeadline/Title/Description o su equivalente) dentro de `Hero.vue`, preservando props/`data-testid`.
3. En `index.vue`, reemplazar el `UPageHero` del hero por `<HomeHero />`.
4. Test estático del contrato observable.

**Note:** Approach sugerido; alternativas válidas si cumplen los AC.

## Acceptance Criteria
1. **Hero con marca y gradiente que renderiza**
   - Given el home renderizado
   - When se inspecciona el hero
   - Then tiene el gradiente rojo de marca vía `bg-linear-to-*` (no `bg-gradient-to-*`) y el headline del diseño.
2. **SelectBranch preservado (SCEN-F1-01)**
   - Given el hero
   - When se busca el selector de ciudad
   - Then `SelectBranch` está presente con su `data-testid` intacto y el mismo comportamiento (elegir ciudad → mismo destino/flujo que antes).
3. **Test de contrato**
   - Given el código de `Hero.vue`/`index.vue`
   - When corre el unit test
   - Then asegura presencia de `SelectBranch` y clase `bg-linear` en el hero, y ausencia de `bg-gradient-to-`.

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: alquilame, f1, home, hero, engine-preserve
- **Required Skills**: Vue 3, @nuxt/ui v4, Tailwind 4
- **Related Tasks**: bloquea steps 2–10
- **Step**: 01 of 11
- **Files to Modify**: `app/components/home/Hero.vue` (nuevo), `app/pages/index.vue`, `app/components/home/__tests__/Hero.test.ts` (nuevo)
- **Files to Read**: `app/pages/index.vue`, `app/components/SelectBranch.vue`, `/tmp/alqui_f1_design/dist/index.html`
- **Context Estimate**: M
- **Scenario-Strategy**: required
