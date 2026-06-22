# Issue #129 — Búsqueda usa la sucursal de la URL sin validar la ciudad

**Fecha:** 2026-06-22
**Branch:** `fix/issue-129-city-branch-validation`
**Estado:** spec aprobado (reviewer + usuario) → pendiente plan + implementación (SDD)

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
que ambos existen) y **antes** del redirect legacy-code→slug. `searchBranchBySlugOrCode` ya se
desestructura arriba (`:38`); el bloque solo añade `searchBranchByCity`.

```ts
const { searchBranchByCity } = useStoreAdminData(); // searchBranchBySlugOrCode ya viene de :38
// ... pickupBranch / returnBranch resueltos arriba (ambos no-nulos) ...

// Issue #129: el branch de recogida DEBE ser de la ciudad de la página.
if (pickupBranch.city !== cityContext) {
  const cityBranch = searchBranchByCity(cityContext); // primer branch de la ciudad (mismo city tier de useSearch:243)
  // Guard: slug es opcional en BranchData y la ciudad podría no tener sucursales (ver Riesgo #2).
  // Sin sede de la ciudad no hay corrección segura → se deja pasar (degradado, no loop, no crash).
  if (cityBranch?.slug) {
    to.params.lugar_recogida = cityBranch.slug;
    // pickup foráneo ⇒ URL corrupta: si el return también era ajeno a la ciudad, alinearlo.
    if (returnBranch.city !== cityContext) to.params.lugar_devolucion = cityBranch.slug;

    createMessage({
      type: "info",
      message: "La sede de recogida no corresponde a la ciudad; se ajustó a la sede por defecto.",
    });

    return navigateTo({ name: to.name, params: to.params, query: to.query });
  }
}
```

**Decisiones:**
- **Solo el primer tier (`searchBranchByCity(cityContext)`), NO la cadena completa de `useSearch.ts:243`.**
  El default real de `useSearch` es `searchBranchByCity(city) ?? searchBranchByCode(...) ?? searchBranchByCity('bogota')`.
  Aquí se usa **solo el tier de ciudad** a propósito: garantiza que el branch resultante cumple
  `.city === cityContext`, así que tras el redirect el bloque **no re-entra** → loop-safe por construcción.
  El fallback a `bogota` *causaría loop infinito* (`bogota`.city ≠ cityContext → re-entra cada pasada).
- **`searchBranchByCity(...).slug`** (lookup real) en vez de `useDefaultRouteParams`
  (`${city}-aeropuerto`, convención de string que asume aeropuerto en toda ciudad). Se guarda con
  `?.slug` porque `slug` es opcional en `BranchData` (computado en runtime desde `name`).
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

> **Alcance del re-disparo:** `searchLinkName`/`searchLinkParams` (`useSearch.ts:258-286`) **nunca**
> incluyen el segmento `categoria`. En la página `/categoria/[categoria]`, el botón siempre apunta a
> la ruta base → `target.href !== route.fullPath` siempre → NuxtLink navega (descartando el filtro de
> categoría) y re-dispara al montar. Por eso el "botón muerto" solo ocurre en la **página base de
> resultados**, y ahí aplica el `@click` (de ahí el scope explícito de SCEN-4).

## Escenarios observables (holdout SDD)

| ID | Given | When | Then |
|----|-------|------|------|
| **SCEN-1** | URL con pickup foráneo: `/barranquilla/.../lugar-recogida/armenia-aeropuerto/lugar-devolucion/armenia-aeropuerto/...` | el middleware corre | redirect a `…/barranquilla-aeropuerto/…/barranquilla-aeropuerto/…`; banner "En Barranquilla"; selector de recogida = sede de Barranquilla |
| **SCEN-2** | one-way legítimo: pickup de la ciudad, return de otra: `/barranquilla/.../barranquilla-aeropuerto/lugar-devolucion/medellin-aeropuerto/...` | el middleware corre | **sin** redirect; pickup Barranquilla y return Medellín intactos |
| **SCEN-3** | URL ya consistente (pickup y return de la ciudad) | el middleware corre | sin redirect, sin cambios de params |
| **SCEN-4** | en la **página base de resultados** (no `/categoria/...`), params sin cambios (p. ej. tras un error) | click en `BUSCAR VEHÍCULOS` | se registra **una nueva POST a `/api/reservations/availability`** (observable en Network) y `useStoreSearchData.pending` pasa a `true`, aunque la URL no cambie |
| **SCEN-5a** | slug de sucursal inexistente | el middleware corre | cae al default de la ciudad (bloque existente `!pickupBranch||!returnBranch`) — sin regresión |
| **SCEN-5b** | legacy branch *code* en vez de slug | el middleware corre | redirige a la URL slug-based (bloque existente legacy→slug) — sin regresión |

## Blast radius

- **Modificados:**
  - `packages/ui-{alquilatucarro,alquilame,alquicarros}/app/middleware/validateSearchParams.ts` — bloque de validación (×3)
  - `packages/ui-{alquilatucarro,alquilame,alquicarros}/app/components/Searcher.vue` — handler `@click` + hoist (×3)
- **Sin cambios en `packages/logic`** (`searchBranchByCity` ya existe).
- **Consumidores:** páginas `[city]/buscar-vehiculos/**` — 4 rutas (con/sin `referido`, con/sin `categoria`) × 3 marcas.
- **Tests:** unit de middleware en `packages/ui-*/tests/`; e2e Playwright multi-marca (`BRAND=...`) cubriendo SCEN-1..4.

## Riesgos

- **#1 — `branch.city` vs slug de ciudad:** la comparación `pickupBranch.city === cityContext` asume que
  `branch.city` es el slug de ciudad. Confirmado: `useSearch.ts:243/277` ya usa
  `searchBranchByCity(route.params.city)` y `city: route.params.city` en producción — equivalencia
  establecida por convención. Bajo riesgo; validar con data real en QA.
- **#2 — orden de middleware + ciudad sin sucursales (relevante):** los search pages declaran
  `middleware: ['validate-search-params', 'validate-city-params']` → **search-params corre PRIMERO**,
  la ciudad aún no está 404-validada cuando corre nuestro bloque. Además `validateCityParams` valida
  contra el dataset `cities` (con `id`), **no** contra `branches` — son arrays distintos en
  `rentacar-data`. Una ciudad presente en `cities` pero sin sucursales haría `searchBranchByCity`
  devolver `undefined` → el guard `cityBranch?.slug` deja pasar el pickup foráneo (bug #129 persiste
  para esa ciudad, sin crash ni loop). **Asunción de datos:** toda ciudad servida tiene ≥1 sucursal.
  **Acción QA:** enumerar `cities` sin `branches` en data real; si existen, escalar upstream
  (no listar la ciudad) — fuera del alcance de este PR.
- **#3 — `slug` opcional:** `BranchData.slug` es `string | undefined` (computado en runtime). El guard
  `cityBranch?.slug` cubre el caso type-level; en runtime el slug está poblado server-side (el redirect
  legacy→slug existente ya depende de ello).
- **Doble redirect / loop:** el bloque nuevo precede a los redirects existentes; cada uno hace `return
  navigateTo`. Loop-safe **por construcción**: `searchBranchByCity(cityContext)` devuelve un branch con
  `.city === cityContext`, así que tras el redirect el bloque no re-entra. (El fallback a `bogota`
  *sí* haría loop — por eso se excluye; ver Decisiones.)
- **#7 — `cityContext = pathSegments[0]`:** todas las rutas `buscar-vehiculos/**` (con/sin `referido`,
  con/sin `categoria`) empiezan con `[city]` → el primer segmento siempre es la ciudad. Verificado en
  el árbol de rutas; safe para las rutas que cargan este middleware.
- **Botón cross-brand:** alquilame diverge en el `:to` (`searchDestination` computed); el handler debe
  resolver el destino correcto por marca.
