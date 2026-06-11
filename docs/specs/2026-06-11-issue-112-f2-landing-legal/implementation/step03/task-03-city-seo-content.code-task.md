## Status: PENDING
## Blocked-By: step01/task-01-homecontact-reserveanchor.code-task.md
## Completed:

# Task: F2 Step 3 — City SEO content restyle (preservar texto indexable)

## Description
Extraer y restilizar las secciones de contenido SEO de la city landing a `app/components/city/Intro.vue` + `app/components/city/SeoContent.vue`, cableadas en `CityPage.vue` como drop-in. **Todo el texto SEO se preserva** (indexable); solo cambia el estilo.

## Background
`CityPage.vue` tiene secciones de contenido SEO city-specific: `#descripcion`, `#introduccion` (→ `#intro` del diseño), `#ventajas`, `#destinos`, `#consejos-conduccion`, `#mejor-temporada`, `#ciudades-cercanas`. Son activos SEO (texto indexable). F2 las restila al diseño SIN remover contenido (decisión: preservar todo el SEO).

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f2-landing-legal-design.md` (SCEN-F2-02; filas de contenido SEO)
**Additional:**
- `app/components/CityPage.vue` (secciones ~102-322)
- Diseño: `/tmp/alqui_f1_design/dist/alquiler-de-carros-bogota/index.html` (`#intro` y estilo de secciones)
- `app/components/city/Hero.vue` (sibling conventions, step 2)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. `city/Intro.vue`: intro/descripcion + introduccion con el estilo `#intro` del diseño; **texto preservado**.
2. `city/SeoContent.vue`: ventajas/destinos/consejos/temporada/ciudades-cercanas restiladas; **texto preservado** (o un componente por sección si crece — mantener ≤ responsabilidad clara).
3. Cableadas en `CityPage.vue` como drop-in de las secciones inline equivalentes.
4. `bg-linear-to-*`, `.heading-*` (Plus Jakarta); `[--ctx-text-primary:#fff]` solo si la sección es de fondo oscuro.

## Dependencies
- **Step 1** (rama). Datos `city` (props CityPage), `relatedCities`.

## Implementation Approach
1. Crear `city/Intro.vue` y `city/SeoContent.vue` recibiendo `city`/`relatedCities`.
2. Portar el texto SEO actual verbatim + aplicar estilo del diseño.
3. Cablear en `CityPage.vue`.
4. Test: cada sección/heading presente con su texto; sin pérdida de copy.

## Acceptance Criteria
1. **SEO content preservado (SCEN-F2-02)**
   - Given `/{city}`
   - When se inspecciona el texto
   - Then todas las secciones SEO (descripcion/intro/ventajas/destinos/consejos/temporada/ciudades-cercanas) están presentes con su contenido indexable, restiladas.
2. **Estilo del diseño**
   - Given las secciones
   - When se ven
   - Then usan `.heading-*` + `bg-linear`, sin `bg-gradient-to-`.
3. **Test de contrato**
   - Given los componentes
   - When corre el unit test
   - Then valida presencia de cada sección + su texto clave + `.heading-*`.

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: alquilame, f2, city, seo, content
- **Required Skills**: Vue 3, Tailwind 4
- **Related Tasks**: Blocked-By step 1
- **Step**: 03 of 08
- **Files to Modify**: `app/components/city/Intro.vue` (nuevo), `app/components/city/SeoContent.vue` (nuevo), `app/components/CityPage.vue`, `app/components/city/__tests__/seo-content.test.ts` (nuevo)
- **Files to Read**: `app/components/CityPage.vue`, `/tmp/alqui_f1_design/dist/alquiler-de-carros-bogota/index.html`
- **Context Estimate**: M
- **Scenario-Strategy**: required
