## Status: PENDING
## Blocked-By: step01/task-01-hero-restyle.code-task.md
## Completed:

# Task: F1 Step 2 — Fleet con precio "Desde $X/día" real

## Description
Reconstruir la sección de categorías (`#categorias` legacy) como `app/components/home/Fleet.vue` con el grid del diseño: 4 categorías representativas con precio "Desde $X/día" REAL y el flujo modal→`SelectBranch`→"Ver disponibilidad" preservado.

## Background
El `#categorias` actual son 3 cards estáticas sin precio. El diseño muestra "Desde $X/día". El precio sale de `pickRepresentativeDailyPrice(category.month_prices).one_day_price` — date-free, determinista, nunca $0/fabricado (omite fail-soft). El pricing es **global por categoría** (`useFetchRentacarData().categories`, `c.id === code`), NO por-ciudad → funciona en el home sin ciudad. Mismo mecanismo que `useCityProductSchema` (#68). **Aislamiento F1**: `representativeCategories` es privado en logic → duplicar la lista localmente con los nombres curados (deuda declarada).

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f1-home-design.md` (SCEN-F1-02; fila fleet + nota de fuentes)
**Additional:**
- `packages/logic/src/utils/pickRepresentativeDailyPrice.ts` (import de logic, NO modificar)
- `packages/logic/src/composables/useCityProductSchema.ts` (`representativeCategories` a copiar: C=Económico, FX=Sedán Automático, GC=Camioneta SUV, LE=Camioneta Premium)
- Diseño: `/tmp/alqui_f1_design/dist/index.html` (`<section id="fleet">`)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. `Fleet.vue` con 4 cards (C/FX/GC/LE) usando los **nombres curados** (Económico/Sedán Automático/Camioneta SUV/Camioneta Premium) como lista local.
2. Precio "Desde $X/día" vía `pickRepresentativeDailyPrice(categories.find(c=>c.id===code)?.month_prices ?? [])` (importado de logic). Si `undefined`, la card NO muestra precio (nunca $0 ni inventado).
3. Botón "Ver disponibilidad" (verde, ya existe el estilo) abre modal con `SelectBranch` (`variant="gray"`), preservando el flujo y navegación actuales.
4. Gradientes/estilos con `bg-linear-*` donde aplique; imágenes reusan `Images/Categorias/*` con `aspect-ratio` (CLS).
5. Headings de card usan `.heading-*`.

## Dependencies
- **Step 1** (hero montado, `index.vue` ya orquesta `home/*`).
- **`pickRepresentativeDailyPrice`**: exportado de `@rentacar-main/logic/utils` — import directo.
- **`useFetchRentacarData().categories`**: payload con `month_prices` por categoría.

## Implementation Approach
1. Crear `Fleet.vue` con lista local `[{code,title,desc,image}]` (4 curadas).
2. Computar precio por card con `pickRepresentativeDailyPrice`; formatear como moneda CO; ocultar si `undefined`.
3. Portar el modal→`SelectBranch`→"Ver disponibilidad" desde el `#categorias` actual.
4. Montar `<HomeFleet />` en `index.vue` (reemplaza `#categorias`).
5. Test: 4 cards, precio formateado, fail-soft sin $0, botón abre modal.

## Acceptance Criteria
1. **Cuatro categorías con precio real (SCEN-F1-02)**
   - Given el payload de datos con `month_prices`
   - When renderiza Fleet
   - Then muestra 4 cards (C/FX/GC/LE) y cada una con "Desde $X/día" = `pickRepresentativeDailyPrice(...).one_day_price` formateado.
2. **Fail-soft, nunca $0**
   - Given una categoría sin fila activa con precio > 0
   - When renderiza su card
   - Then la card NO muestra precio (ni "$0" ni inventado).
3. **Flujo de disponibilidad preservado**
   - Given una card
   - When se hace click en "Ver disponibilidad"
   - Then abre el modal con `SelectBranch` y la navegación se comporta igual que antes; `data-testid` intactos.
4. **Test de contrato**
   - Given el componente
   - When corre el unit test
   - Then valida 4 cards, formato de precio, fail-soft, y que el botón monta el modal.

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: alquilame, f1, home, fleet, pricing, engine-preserve
- **Required Skills**: Vue 3, @nuxt/ui v4, logic pricing utils
- **Related Tasks**: Blocked-By step 1
- **Step**: 02 of 11
- **Files to Modify**: `app/components/home/Fleet.vue` (nuevo), `app/pages/index.vue`, `app/components/home/__tests__/Fleet.test.ts` (nuevo)
- **Files to Read**: `app/pages/index.vue`, `packages/logic/src/utils/pickRepresentativeDailyPrice.ts`, `packages/logic/src/composables/useCityProductSchema.ts`, `/tmp/alqui_f1_design/dist/index.html`
- **Context Estimate**: M
- **Scenario-Strategy**: required
