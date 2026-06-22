# Issue #129 — Búsqueda usa la sucursal de la URL sin validar la ciudad

**Fecha:** 2026-06-22
**Branch:** `fix/issue-129-city-branch-validation`
**Estado:** diseño aprobado → pendiente plan + implementación (SDD)

## Problema

Una URL `/barranquilla/buscar-vehiculos/lugar-recogida/armenia-aeropuerto/...` renderiza la
página de Barranquilla pero con el formulario y los **vehículos de Armenia**. El flujo de búsqueda
resuelve la sucursal desde el slug de la URL sin comprobar que pertenezca a la ciudad de la página.
El usuario cree que reserva en Barranquilla cuando ve inventario de otra ciudad — defecto de
integridad de datos visible.

### Causa raíz confirmada (código)

`useSearchByRouteParams.ts` resuelve la sucursal **solo por el slug** (`searchBranchBySlug`, `:44`),
la asigna al store (`:48`, asignación incondicional) y dispara `doSearch()` (`:73`) sin comparar
`branch.city` contra `route.params.city`. El default por ciudad de `useSearch.ts:253`
(`lugarRecogida.value = lugarRecogida.value ?? default`) no corrige nada porque el valor ya es
no-nulo. **No depende del store stale por SPA**: basta visitar la URL directa para reproducirlo.

### Bug secundario

El botón `BUSCAR VEHÍCULOS` es un `<u-button :to>` → `NuxtLink`. La búsqueda la dispara
`useSearchByRouteParams.doSearch()` al montar la página destino, no el click. Si el `href` generado
es idéntico a la URL actual (reintentar con los mismos parámetros tras un error), el router no
navega → no se vuelve a buscar.

## Invariante de diseño

> El branch de **recogida** DEBE pertenecer a `route.params.city`. El branch de **devolución**
> puede ser de otra ciudad (one-way / traslado es válido por diseño — `useSearch.ts:146` muestra la
> "Tarifa adicional por traslado: Devolverlo en otra sede o ciudad").

Corolario: un one-way legítimo *siempre* tiene pickup válido (en la ciudad de la página).
Si el **pickup** es foráneo, la URL entera está corrupta (caso del reporte: pickup=return=Armenia
bajo Barranquilla) → se resetean ambos extremos al default de la ciudad. La validación nunca toca
un one-way legítimo porque ese caso no entra al bloque.

## Solución

### 1. Validación ciudad↔branch (bug primario) — middleware existente

**Dónde:** `packages/ui-{alquilatucarro,alquilame,alquicarros}/app/middleware/validateSearchParams.ts`
(funcionalmente idénticos: difieren solo en whitespace/imports/un comentario). **No** se crea
middleware nuevo: el existente ya resuelve `pickupBranch`/`returnBranch`, ya tiene `cityContext`, y
ya hace `navigateTo` con defaults.

**Ubicación del bloque nuevo:** tras el reset de `if (!pickupBranch || !returnBranch)` (que garantiza
que ambos existen) y **antes** del redirect legacy-code→slug.

```ts
const { searchBranchBySlugOrCode, searchBranchByCity } = useStoreAdminData();
// ... pickupBranch / returnBranch resueltos arriba ...

// Issue #129: el branch de recogida debe ser de la ciudad de la página.
if (pickupBranch.city !== cityContext) {
  const cityBranch = searchBranchByCity(cityContext); // lookup real = default de useSearch:243
  if (cityBranch) {
    to.params.lugar_recogida = cityBranch.slug;
    // pickup foráneo ⇒ URL corrupta: si el return también era ajeno a la ciudad, alinearlo.
    if (returnBranch.city !== cityContext) to.params.lugar_devolucion = cityBranch.slug;

    createMessage({
      type: "info",
      message: "La sede de recogida no corresponde a la ciudad; se ajustó a la sede por defecto.",
    });

    return navigateTo({ name: to.name, params: to.params, query: to.query });
  }
  // cityBranch undefined (ciudad sin sucursales) → no rompemos: validateCityParams ya 404 las
  // ciudades desconocidas, así que una ciudad válida tiene ≥1 sucursal; si no, se deja pasar.
}
```

**Decisiones:**
- **`searchBranchByCity(cityContext).slug`** (lookup real) en vez de `useDefaultRouteParams`
  (`${city}-aeropuerto`, convención de string que asume que toda ciudad tiene aeropuerto). El lookup
  coincide con el default que ya usa `useSearch.ts:243`.
- **Redirect `navigateTo` default (302)**, consistente con los hermanos del mismo archivo. 301 sería
  SEO-óptimo (corrección permanente) pero se cachea duro en browser → riesgo si la data de sucursales
  cambia. Se mantiene 302.
- **Reset de ambos extremos** cuando el pickup es foráneo (ver invariante). Un one-way legítimo no
  entra al bloque.

### 2. Botón re-dispara con params idénticos (bug secundario) — Searcher.vue

**Dónde:** `packages/ui-{alquilatucarro,alquilame,alquicarros}/app/components/Searcher.vue` (×3).

**Restricción descubierta:** `searchComposable = useSearch()` se crea **dentro de `onMounted`**
(`:455`), por lo que `searchComposable.doSearch` no es accesible desde el template. El fix requiere
hoistear un handler a scope top-level de `<script setup>`:

```ts
// top-level
const doSearchFn = ref<(() => void) | null>(null);
const route = useRoute();
const router = useRouter();

function onSearchClick(e: MouseEvent) {
  const target = router.resolve({ name: searchLinkName.value, params: searchLinkParams.value });
  if (target.href === route.fullPath) {     // NuxtLink no navegaría → re-disparamos a mano
    e.preventDefault();
    doSearchFn.value?.();
  }
  // si difiere, NuxtLink navega normal y la página destino dispara doSearch al montar
}

// dentro de onMounted, tras crear searchComposable:
doSearchFn.value = searchComposable.doSearch;
```

```vue
<u-button :to="..." @click="onSearchClick" ...>
```

> alquilame usa `:to="searchDestination"` (computed) en vez del objeto inline; el handler resuelve
> el mismo `searchDestination`/params según marca. Detalle a confirmar en planning.

## Escenarios observables (holdout SDD)

| ID | Given | When | Then |
|----|-------|------|------|
| **SCEN-1** | URL con pickup foráneo: `/barranquilla/.../lugar-recogida/armenia-aeropuerto/lugar-devolucion/armenia-aeropuerto/...` | el middleware corre | redirect a `…/barranquilla-aeropuerto/…/barranquilla-aeropuerto/…`; banner "En Barranquilla"; selector de recogida = sede de Barranquilla |
| **SCEN-2** | one-way legítimo: pickup de la ciudad, return de otra: `/barranquilla/.../barranquilla-aeropuerto/lugar-devolucion/medellin-aeropuerto/...` | el middleware corre | **sin** redirect; pickup Barranquilla y return Medellín intactos |
| **SCEN-3** | URL ya consistente (pickup y return de la ciudad) | el middleware corre | sin redirect, sin cambios de params |
| **SCEN-4** | en la página de resultados, params sin cambios (p. ej. tras un error) | click en `BUSCAR VEHÍCULOS` | se dispara una nueva request de availability aunque la URL no cambie |
| **SCEN-5** | slug inexistente / legacy code | el middleware corre | sigue cayendo al default (bloque existente) / legacy code→slug sigue redirigiendo — sin regresión |

## Blast radius

- **Modificados:**
  - `packages/ui-{alquilatucarro,alquilame,alquicarros}/app/middleware/validateSearchParams.ts` — bloque de validación (×3)
  - `packages/ui-{alquilatucarro,alquilame,alquicarros}/app/components/Searcher.vue` — handler `@click` + hoist (×3)
- **Sin cambios en `packages/logic`** (`searchBranchByCity` ya existe).
- **Consumidores:** páginas `[city]/buscar-vehiculos/**` — 4 rutas (con/sin `referido`, con/sin `categoria`) × 3 marcas.
- **Tests:** unit de middleware en `packages/ui-*/tests/`; e2e Playwright multi-marca (`BRAND=...`) cubriendo SCEN-1..4.

## Riesgos

- **`branch.city` vs slug de ciudad:** la comparación `pickupBranch.city === cityContext` asume que
  `branch.city` es el slug de ciudad. Confirmado: `searchBranchByCity(city)` (`useStoreAdminData:28`)
  compara `branch.city == city` con `route.params.city` en producción. Validar con data real en QA.
- **Doble redirect:** el bloque nuevo precede a los redirects existentes; cada uno hace `return
  navigateTo`, así que a lo sumo encadenan un redirect por corrección (idempotentes: la segunda
  pasada ya cumple el invariante).
- **Botón cross-brand:** alquilame diverge en el `:to`; el handler debe resolver el destino correcto
  por marca.
