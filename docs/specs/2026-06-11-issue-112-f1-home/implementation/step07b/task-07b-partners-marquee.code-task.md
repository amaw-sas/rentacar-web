## Status: COMPLETED
## Blocked-By: step01/task-01-hero-restyle.code-task.md
## Completed: 2026-06-11

# Task: F1 Step 7b — Partners "Empresas Aliadas" (marquee de TEXTO)

## Description
Crear `app/components/home/Partners.vue`: marquee "Empresas Aliadas" con los nombres de aliados como TEXTO (no logos), reproduciendo el markup del diseño.

## Background
El diseño renderiza cada aliado (Localiza/Avis/Alquicarros/Alquilatucarro) como un `<span class="font-heading text-2xl font-extrabold text-white/75">` dentro de un marquee — **NO hay `<img>` ni assets de logo** en el dist. Por tanto la sección es texto estilizado, sin sourcing de imágenes.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f1-home-design.md` (SCEN-F1-03; fila "Empresas Aliadas")
**Additional:**
- Diseño: `/tmp/alqui_f1_design/dist/index.html` (sección "Empresas Aliadas"; spans de texto)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. `Partners.vue` con marquee (animación CSS) de etiquetas de TEXTO con los nombres de aliados (lista local en el componente).
2. NO `<img>` ni assets — el diseño usa solo texto.
3. Fondo/gradiente `bg-linear-*` si aplica; tipografía `font-heading` como el diseño.
4. Montada en `index.vue` en el orden del diseño.

## Dependencies
- **Step 1** (orquestación).

## Implementation Approach
1. Crear `Partners.vue` con la lista de nombres y un marquee CSS.
2. Montar `<HomePartners/>` en `index.vue`.
3. Test: marquee presente con los nombres (texto), sin `<img>`.

## Acceptance Criteria
1. **Marquee de texto presente (SCEN-F1-03 resto p2)**
   - Given el home
   - When se ve la sección "Empresas Aliadas"
   - Then muestra los nombres de aliados como texto estilizado en un marquee.
2. **Sin assets de imagen**
   - Given `Partners.vue`
   - When se inspecciona el markup
   - Then no usa `<img>` ni assets de logo (texto, como el diseño).
3. **Test de contrato**
   - Given el componente
   - When corre el unit test
   - Then valida presencia del marquee con los nombres y ausencia de `<img>`.

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: alquilame, f1, home, partners, marquee
- **Required Skills**: Vue 3, CSS animations
- **Related Tasks**: Blocked-By step 1
- **Step**: 07b of 11
- **Files to Modify**: `app/components/home/Partners.vue` (nuevo), `app/pages/index.vue`, `app/components/home/__tests__/Partners.test.ts` (nuevo)
- **Files to Read**: `/tmp/alqui_f1_design/dist/index.html`
- **Context Estimate**: S
- **Scenario-Strategy**: required
