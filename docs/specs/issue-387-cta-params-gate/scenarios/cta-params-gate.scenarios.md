---
name: cta-params-gate
created_by: orchestrator
created_at: 2026-07-23T00:00:00Z
---

# CTA "BUSCAR VEHÍCULOS" — deshabilitado que se explica + halo atado al estado usable (issue #387)

Derivado de #363 (epic #372). El CTA principal del embudo de alquicarros vive en
`packages/ui-alquicarros/app/components/Searcher.vue`. Dos defectos que #363 dejó fuera
por acotarse a CSS:

1. El `:disabled` incluía `!searchDisabledGuardSatisfied` sin ninguna explicación en
   pantalla. Como las fechas siempre traen default, ese guard solo falla cuando **la
   sucursal de recogida no resuelve** (datos de sucursales aún cargando, `sortedBranches`
   vacío tras un fallo de red, o un slug desconocido en un deep-link). El click moría en
   `ULinkBase.onClickWrapper` (`preventDefault()`) sin toast ni mensaje.
2. El halo (`search-button-glow`) se ataba solo a `animateSearchButton`, no al estado
   habilitado real; con el `forwards` de #363 el halo falso quedó congelado, y en un
   deep-link que monta deshabilitado el pulso no volvía cuando el CTA se hacía usable.

El gate de horario ya resolvió su gemelo (SCEN-322-X03): `<p id="schedule-gate-message">`
+ `aria-describedby`. Estos escenarios replican ese patrón para el params gate y acoplan
el halo a un `canSearch` que es la negación exacta de la condición `disabled`.

---

## SCEN-387-01: el params gate dice por qué está deshabilitado

**Given**: `/reservas` de alquicarros con la sucursal de recogida sin resolver
(`sortedBranches` vacío tras un fallo de red o aún cargando), el buscador hidratado.

**When**: el usuario mira el CTA "BUSCAR VEHÍCULOS".

**Then**: el botón está deshabilitado, su `classList` **no** contiene `search-button-glow`,
y debajo aparece un `<p id="params-gate-message">` con el texto exacto "No pudimos cargar
las sucursales disponibles. Recarga la página para volver a buscar."; el botón lo referencia
vía `aria-describedby="params-gate-message"`.

**Evidence**: DOM — atributo `disabled`/`aria-disabled` del botón, ausencia de
`search-button-glow` en su `classList`, `id` y `textContent` del `<p>`, valor de
`aria-describedby` del botón.

---

## SCEN-387-02: el halo solo viste al botón que se puede usar

**Given**: el CTA en un estado deshabilitado — el params guard falla, o la selección está
fuera de horario, o hay una búsqueda en curso (`pendingSearching`).

**When**: se lee la `classList` del botón en ese estado, y otra vez con todo satisfecho.

**Then**: deshabilitado ⟹ sin `search-button-glow`; habilitado (`canSearch` verdadero) ⟹
con `search-button-glow`. El halo nunca aparece sobre un botón que no navega.

**Evidence**: `classList` del botón en el estado deshabilitado y en el habilitado.

---

## SCEN-387-03: el pulso vuelve justo cuando el CTA se vuelve usable

**Given**: `/reservas` montada con el CTA deshabilitado (sucursal de recogida sin resolver);
el pulso no debe gastarse en el botón inerte.

**When**: la causa se resuelve — las sucursales cargan o el usuario elige una válida — y
`canSearch` transiciona `false → true`.

**Then**: el botón se habilita, se remonta (`:key="`cta-${canSearch}`"`), recupera
`search-button-glow`, su `box-shadow` computado **varía** entre muestras consecutivas (la
animación corrió de nuevo) y se detiene antes de 5 s (WCAG 2.2.2). Antes del arreglo el
pulso no volvía porque `animateSearchButton` no transicionaba `false → true`.

**Evidence**: `classList` + `disabled` del botón antes y después; serie de valores de
`boxShadow` con marcas de tiempo tras la transición.

---

## SCEN-387-04: no se rompe #363 ni el gate de horario

**Given**: la remediación de #387 aplicada sobre `Searcher.vue`.

**When**: se corre `pnpm --filter ui-alquicarros test` y se inspecciona el estado
fuera-de-horario del CTA.

**Then**: el brand guard de #363 (`tests/search-button-brand.test.ts`) sigue en verde
(relleno `--color-brand-*`, contraste ≥3:1 contra el hero, pulso acotado <5 s), y el gate
de horario sigue vivo: `<p id="schedule-gate-message">` presente cuando la selección está
fuera de horario y el botón lo referencia vía `aria-describedby="schedule-gate-message"`.

**Evidence**: salida de vitest de la suite de ui-alquicarros; DOM/source del schedule gate
(id del `<p>`, `aria-describedby` del botón).

---

## SCEN-387-05: las otras dos marcas quedan intactas

**Given**: la rama de #387.

**When**: `git diff --stat main...HEAD`.

**Then**: cero líneas modificadas bajo `packages/ui-alquilame` y `packages/ui-alquilatucarro`;
los cambios viven solo en `packages/ui-alquicarros` (más el doc de specs).

**Evidence**: salida de `git diff --stat main...HEAD`.
