## Status: PENDING
## Blocked-By: step01/task-01-homecontact-reserveanchor.code-task.md, step02/task-02-city-hero.code-task.md, step03/task-03-city-seo-content.code-task.md, step04/task-04-city-delivery-points.code-task.md, step05/task-05-city-faq-testimonios.code-task.md
## Completed:

# Task: F2 Step 6 — Montar marketing F1 + orquestación CityPage

## Description
En `CityPage.vue` (ya orquestador con los `city/*` de los pasos 2-5), montar las secciones de marketing **nuevas** reusando componentes `home/*` de F1: `HomeFleet`, `HomeHowItWorks`, `HomeRequirements`, `HomeContact` (con `reserveAnchor="#searcher"`). Preservar el bloque condicional de resultados intacto.

## Background
El diseño city incluye secciones de marketing (fleet, how-it-works, requirements, contact) idénticas a las del home → reusar los `home/*` de F1 (DRY). Estas secciones NO existían en la city (`#contact`/`#requisitos` no colisionan; `#fleet`/how-it-works tampoco). El bloque de resultados live `#seleccion-categorias` (`CategorySelectionSection`, condicional por params) se preserva — la ruta `buscar-vehiculos` renderiza el mismo CityPage.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f2-landing-legal-design.md` (SCEN-F2-03, F2-05; marketing del diseño + regla anti-colisión)
**Additional:**
- `app/components/CityPage.vue` (orquestador tras steps 2-5; `#seleccion-categorias`)
- `app/components/home/{Fleet,HowItWorks,Requirements,Contact}.vue` (F1)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. Montar `<HomeFleet />`, `<HomeHowItWorks />`, `<HomeRequirements />`, `<HomeContact reserveAnchor="#searcher" />` en el orden del diseño city.
2. **Preservar `#seleccion-categorias`/`CategorySelectionSection` intacto** (condicional por params; no tocar el engine de resultados).
3. **Sin `id` duplicado**: verificar que `#contact`/`#requisitos`/`#fleet`/`#how-it-works` no existan ya en city (no colisionan). El `#testimonios`/`#faqs` city son los de los pasos 5 (no duplicar).
4. `HomeContact` ancla "Reserva Ahora" a `#searcher` (hero city), no al `#hero` inexistente.

## Dependencies
- **Steps 1-5** (reserveAnchor prop + `city/*` cableados).
- **`home/*` de F1** (auto-import).

## Implementation Approach
1. En `CityPage.vue`, montar los 4 componentes de marketing en el orden del diseño.
2. Pasar `reserveAnchor="#searcher"` a `HomeContact`.
3. Confirmar el bloque condicional de resultados sin cambios.
4. Test: componentes montados, reserveAnchor=#searcher, cero `id` duplicado, `CategorySelectionSection` preservado.

## Acceptance Criteria
1. **Marketing F1 montado (SCEN-F2-03)**
   - Given la city landing
   - When se recorre
   - Then existen fleet/how-it-works/requirements/contact (de F1), y "Reserva Ahora" ancla a `#searcher`.
2. **Resultados condicionales intactos (SCEN-F2-05)**
   - Given una ruta `buscar-vehiculos` con params
   - When renderiza
   - Then `#seleccion-categorias`/`CategorySelectionSection` muestra resultados como hoy (engine sin cambios).
3. **Test de contrato**
   - Given `CityPage.vue`
   - When corre el unit test
   - Then valida los 4 montajes, `reserveAnchor="#searcher"`, cero `id` duplicado, `CategorySelectionSection` presente.

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: alquilame, f2, city, marketing, reuse, engine-preserve
- **Required Skills**: Vue 3, @nuxt/ui v4
- **Related Tasks**: Blocked-By steps 1-5
- **Step**: 06 of 08
- **Files to Modify**: `app/components/CityPage.vue`, `app/components/city/__tests__/orchestration.test.ts` (nuevo)
- **Files to Read**: `app/components/CityPage.vue`, `app/components/home/Contact.vue`, `app/components/home/Fleet.vue`
- **Context Estimate**: M
- **Scenario-Strategy**: required
