# Planning Summary: Issue #112 — F3 (Funcional)

**Date**: 2026-06-12
**Goal**: Centralizar la búsqueda de alquilame en una página nueva `/reservas`, sacar el motor de los heroes (home + city landing → CTA "Reservar"), preservar las URLs profundas `buscar-vehiculos` y todo el SEO, y reskinear la grilla de resultados + el slideover de reserva + las páginas de estado. Blog → F4.

## Artifacts Created
- `docs/specs/2026-06-12-issue-112-f3-functional-design.md` — diseño (spec) aprobado (spec-review 2 iter + user).
- `implementation/plan.md` — plan de 9 pasos SDD + file-structure map (plan-review 2 iter, aprobado).
- `summary.md` — este documento.

## Key Decisions
1. **`/reservas` = página de búsqueda, NO de resultados.** Submit navega a las URLs profundas existentes → SEO programático intacto, sin redirects, sin colapsar URLs.
2. **Único toque al motor**: derivar ciudad de la sucursal de recogida (`route.params.city ?? storeAdminData.searchBranchByCode(lugarRecogida).city`), local a `Searcher.vue` de alquilame → `packages/logic` y otras 2 marcas intactas.
3. **Hero por modo** (`landing | results`, prop explícito por page file): landing sin Searcher + CTA `<NuxtLink to="/reservas">`; results conserva el engine + `#searcher` + #109. CityPage reenvía el modo (default `results`).
4. **Verde = confirmar.** Los CTAs verdes de la grilla/slideover ("Solicitar reserva" + avanzar) se conservan verdes como semántica de confirmar (distinta de los CTAs rojos navegacionales); el reskin de marca aplica al chrome, no al color de la acción de confirmar. Contrato de loading preservado.
5. **Tests existentes → mode-aware sin debilitar** (Parte D): `home/Hero.test.ts` + `city/Hero.test.ts` reescritos al comportamiento nuevo; el resto del inventario (26 archivos) confirmado verde.
6. **Cierre de #112**: F3 abre PR `Refs #112`; F4 (blog) cierra `Closes #112`.

## Complexity Estimate
- **Overall**: L (9 pasos, ~M cada uno)
- **Duration**: ~1–1.5 días de implementación + verificación runtime en preview
- **Risk Level**: Medium — el riesgo real es SEO (mitigado: resultados se quedan en las URLs profundas, sin redirects) y el green-per-step de los tests (mitigado: barrido completo del inventario, mode-aware sin debilitar).

## Recommended Next Steps
1. `sop-task-generator` → convertir los 9 pasos en `.code-task.md` con Blocked-By graph.
2. Implementar con sub-agentes (componentes en paralelo donde no compartan archivo; orquestación de page files + CityPage en el main agent).
3. Verificación runtime en preview Vercel (`agent-browser` + `/dogfood`) + `/verification-before-completion`.
4. PR `Refs #112` (push-gated, autorización explícita del usuario).

## Open Questions
- Color del CTA de confirmar: verde (decisión actual) vs rojo de marca — el usuario puede pedir rojo (cambio acotado documentado en step 6).
- Keyword de cierre de #112: confirmar `Refs` (recomendado) vs `Closes` al abrir el PR.
