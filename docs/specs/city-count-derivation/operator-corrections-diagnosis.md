# Diagnóstico: correcciones reportadas por operación

## Separación de fuente de verdad (SoT)

| Capa | Responsable | Dónde se edita |
|------|-------------|----------------|
| Datos: categorías, modelos, sucursales, precios | **rentacar-dashboard / Supabase** | Panel admin (dashboard) → tablas Supabase |
| Presentación: render del catálogo, home, JSON-LD | **rentacar-web (este repo)** | Solo muestra lo que llega vía `/api/rentacar-data` y el proxy de disponibilidad |

La web es una capa de display pura. Las correcciones de datos (#1, #2, #4, #5, #6) se aplican **en el dashboard/Supabase**, no en este repo. La web las recoge automáticamente en ≤1h (cache Nitro SWR). Solo #7 y el acoplamiento de copia (#4/#5) tocan código web.

Las queries Supabase que alimentan la web están en `packages/logic/server/utils/rentacarDataFetch.ts`; el mapeo de campos en `packages/logic/server/utils/transformers.ts`.

---

## #1 — Quitar Suzuki S-presso de Gama C

**Tipo:** dato (dashboard/Supabase). **No editable en web.**

| Campo | Valor |
|-------|-------|
| Tabla | `category_models` |
| Fila objetivo | Modelo `name = 'Suzuki S-presso'` (o variante) cuya categoría padre es `vehicle_categories.code = 'C'` (Gama C / Económico) |
| Acción | Borrar la fila **o** poner `status = 'inactive'` |

**Por qué.** El S-presso NO existe en el código web. `transformCategories` (transformers.ts:73-80) construye `models` filtrando `category_models` por `status === 'active'`; el modelo aparece en la web solo porque está activo en Supabase. Inactivarlo/borrarlo lo retira del listado de Gama C sin ningún cambio de código.

---

## #2 — Agregar sucursal Rionegro

**Tipo:** dato (dashboard/Supabase). **No editable en web.**

| Campo | Valor |
|-------|-------|
| Tabla | `locations` |
| Acción | `INSERT` de una fila con `status = 'active'` |

**Columnas que la web lee** (select en rentacarDataFetch.ts:39-44 — `id, code, name, city, slug, schedule, status, cities(slug)`):

| Columna | Notas |
|---------|-------|
| `code` | Identificador de sucursal |
| `name` | Nombre visible (ej. "Rionegro") |
| `city` | Texto legacy de ciudad (fallback) |
| `slug` | Slug de la sucursal |
| `schedule` | Horario estructurado (contract v2, issue #47); `{}` = sin configurar (permisivo) |
| `status` | **Debe ser `'active'`** — la query filtra `.eq('status','active')` |
| relación `cities` | FK a `cities`; la web prefiere `cities.slug` sobre `locations.city` (transformBranches, transformers.ts:136) — convén que apunte a la fila de ciudad correcta (Rionegro) |

**Por qué.** `transformBranches` mapea cada fila activa de `locations` a una sucursal. La web la recoge automáticamente dentro del cache ≤1h. Sin cambio de código.

---

## #4 — Mover Suzuki Swift Dzire a Sedán Automático

**Tipo:** dato (dashboard/Supabase). **No editable en web.**

| Campo | Valor |
|-------|-------|
| Tabla | `category_models` |
| Fila objetivo | Modelo `name = 'Suzuki Swift Dzire'` (o "Suzuki Dzire") |
| Acción | Reasignar su FK de categoría a la categoría de **sedán automático** (`vehicle_categories.code = 'FX'` — Sedán Automático) |

**Por qué.** La membresía categoría↔modelo vive en `category_models` en Supabase. La web no clasifica modelos; solo renderiza el `name` bajo la categoría que el dashboard le asigne.

**Acoplamiento:** ver sección final — el nombre "Suzuki Dzire" también está hardcodeado en la copia JSON-LD de la web.

---

## #5 — Quitar Hyundai Accent AT y Kia Rio AT de Sedán Automático

**Tipo:** dato (dashboard/Supabase). **No editable en web.**

| Campo | Valor |
|-------|-------|
| Tabla | `category_models` |
| Filas objetivo | `Hyundai Accent AT` y `Kia Rio AT`, bajo la categoría sedán automático (`code = 'FX'`) |
| Acción | Borrar las dos filas **o** `status = 'inactive'` |

**Por qué.** Igual que #1: `transformCategories` filtra por `status === 'active'`. Inactivar/borrar las retira del sedán automático sin tocar código.

**Acoplamiento:** "Kia Rio" y "Hyundai Accent" también están hardcodeados en la copia JSON-LD — ver sección final.

---

## #6 — Precio Compacto Manual $220.000 → $180.000

**Tipo:** dato (dashboard/Supabase). **No editable en web.**

| Campo | Valor |
|-------|-------|
| Tabla | `category_pricing` |
| Fila objetivo | Fila de pricing de Gama C (`vehicle_categories.code = 'C'`) con `status = 'active'` y rango de vigencia que cubre las fechas buscadas (la fila activa 2026-04 lleva hoy `one_day_price = 220000`) |
| Columna | `one_day_price` (la web la mapea desde `monthly_one_day_price`, transformers.ts:95) → poner `180000` |

**Verificaciones antes de editar:**

1. **Fila activa vs legacy.** `transformCategories` pasa filas activas e inactivas (transformers.ts:82-97); la inactiva sirve de fallback cuando la fecha de pickup queda fuera de todo rango activo. Asegurarse de editar la fila **activa** (la 2026-04 con 220000), no una legacy inactiva.
2. **Cobertura de fechas.** Confirmar que el rango `valid_from` / `valid_until` de la fila activa cubre las fechas que el operador prueba; si no, el cliente usaría otra fila y el precio nuevo no se vería.

**La web NO puede sobrescribir este precio.** El checkout y el JSON-LD leen el `one_day_price` de `category_pricing` vía SSR (rentacar-data). El cambio se refleja al actualizar Supabase, dentro del cache ≤1h.

---

## #7 — Botón "Ver reseñas de Google" remontado en desktop

**Tipo:** bug de código (CSS) en `main` actual. **ARREGLADO en este PR.**

**Hallazgo.** El botón "Ver reseñas en Google" y el bloque de rating ("5,0", "43 reseñas verificadas en Google") están **vivos** en `home/Reviews.vue` — re-introducidos en la PR #182 ("home visual parity with golden design") para igualar el mockup aprobado. (Los valores "5,0/43" son golden sancionados por directiva — perfil real de Google Business, cid confirmado; no se tocan.) El screenshot del operador es **actual**, no obsoleto.

**Root cause.** La sección `#google-reviews` usa la clase utilitaria **`section-padding`, que no está definida en ningún CSS** → `padding: 0` en los cuatro lados. Sin padding vertical, el contenido pega a los bordes y el botón CTA del fondo queda a ras del borde inferior, "remontando" sobre la siguiente sección (banda Stats blanca). Todas las demás secciones del home usan `py-12 md:py-16` explícito.

**Fix aplicado.** `Reviews.vue` — reemplazar `class="section-padding bg-gray-100"` por `class="py-12 md:py-16 bg-gray-100"` (la convención de ritmo del resto de secciones).

**Verificado en navegador (1280px):** padding vertical `0 → 64px`; gap botón↔siguiente-sección `0 → 64px`; CTA centrado; rating y 3 tarjetas intactos; cero errores de consola.

---

## #4/#5 — Acoplamiento de copia en la web (DIFERIDO)

**Tipo:** código web. **Diferido** hasta que el lineup del dashboard esté final.

**Archivo:** `packages/logic/src/composables/useCityProductSchema.ts`

El composable hardcodea nombres de modelos representativos en la copia de marketing del JSON-LD (`description`) de las landing por ciudad. Líneas exactas encontradas (useCityProductSchema.ts:11-32):

```
code 'C'  (Económico):        'Vehículos compactos perfectos para ciudad. Fiat Mobi, Kia Picanto, Renault Kwid.'
code 'FX' (Sedán Automático): 'Sedanes cómodos con transmisión automática. Kia Rio, Hyundai Accent, Suzuki Dzire.'
code 'GC' (Camioneta SUV):    'Camionetas compactas ideales para familias. Suzuki Vitara, Hyundai Creta, Fiat Pulse.'
code 'LE' (Camioneta Premium):'SUVs de lujo con todas las comodidades. Kia Sportage, Hyundai Tucson, Renault Koleos.'
```

**Conflicto.** La línea `FX` (Sedán Automático) nombra **"Kia Rio, Hyundai Accent, Suzuki Dzire"**. Tras aplicar #4 y #5 en el dashboard:

- #4 mueve "Suzuki Dzire" **hacia** FX → coherente con la copia.
- #5 saca "Kia Rio" y "Hyundai Accent" **de** FX → la copia hardcodeada los seguiría nombrando como representativos del sedán automático, **contradiciendo el lineup real**.

Nota: solo cambia la copia (`description`); el **precio** ya NO está hardcodeado — se lee de `category_pricing` vía `pickRepresentativeDailyPrice` (useCityProductSchema.ts:53, issue #68). El riesgo aquí es desincronización de nombres de modelo en el texto SEO.

**Recomendación.**

1. **Mínimo:** tras finalizar el lineup en el dashboard, sincronizar manualmente la línea `FX` (quitar "Kia Rio, Hyundai Accent", reflejar los modelos reales).
2. **Mejor (robusto):** derivar estos nombres representativos desde `category_models` en vivo (ya disponible en `vehicleCategories[code].modelos`, transformers.ts:250-256) en vez de la lista hardcodeada, para que la copia nunca se desincronice del catálogo real.

**Estado: DIFERIDO** — ejecutar esta edición web solo cuando el lineup del dashboard esté final, para no sincronizar contra datos en movimiento.

---

## #3 — Nota de datos: el conteo real es 19, no 20

**Arreglado en este PR** (código). Los textos del home/footers de las 3 marcas ya **derivan** el conteo de la lista viva de ciudades activas (`useCityCount`, desde Supabase) en vez de un literal.

**Hallazgo de datos:** la API del propio app (`/api/rentacar-data`) devuelve **19 ciudades activas** hoy — la #20 **no está activa** en Supabase. Ciudades activas: armenia, barranquilla, bogota, bucaramanga, cali, cartagena, cucuta, floridablanca, ibague, manizales, medellin, monteria, neiva, palmira, pereira, santa-marta, soledad, valledupar, villavicencio.

**Implicación:** los textos muestran 19 hoy y **saltarán a 20 automáticamente** cuando se active la ciudad #20 en Supabase — sin cambio de código. La #20 probablemente está ligada a **#2 (Rionegro)**: agregar Rionegro como **ciudad** (`cities`), no solo como sucursal (`locations`), elevaría el conteo a 20. Dos literales build-time que no pueden leer datos runtime (la meta-description SEO de alquilatucarro y `FALLBACK_CITY_COUNT`) quedan en **19** y se suben a mano cuando eso ocurra.

---

## Hallazgos adicionales — otros números de cobertura desincronizados (FUERA DE ALCANCE)

Durante la revisión aparecieron **otros literales de cobertura hardcodeados** que NO se tocaron en este PR (números distintos e inconsistentes entre sí; varios necesitan el número canónico del operador). Recomendado: follow-up dedicado.

| Ubicación | Literal actual | Métrica | Tipo |
|-----------|----------------|---------|------|
| `ui-alquilatucarro` + `ui-alquicarros` `app/components/Hero/Description.vue:3` | "27 sedes" | sucursales (≠ ciudades) | runtime, home |
| `*/app/pages/blog/index.vue` | "27 sedes" | sucursales | runtime, blog |
| `*/app/pages/blog/[...slug].vue` | "más de 27 ciudades" | ciudades (27 ≠ 19) | runtime, blog |
| `*/app/app.config.ts` (meta) | "Cali y 16 ciudades más" (=19) | ciudades | build-time SEO |
| `*/nuxt.config.ts` (route descriptions) | "Cali y 14 ciudades más" (=17) | ciudades | build-time SEO |
| `*/app/pages/gana/index.vue` (meta) | "más de 20 ciudades" | ciudades | build-time SEO |

**Notas:**
- "27 sedes" es la cuenta de **sucursales** (`locations`), una métrica distinta — necesita el número real del operador (¿son 27 sedes hoy?). Idealmente derivar de `sortedBranches.length`.
- Los literales de ciudades runtime (blog) podrían derivar de `useCityCount` igual que el home.
- Los build-time (app.config, nuxt.config, gana) no pueden derivar — requieren un número canónico y mantenimiento manual.

**Estado: FUERA DE ALCANCE de #3** — surface para decidir si se agrupan en un follow-up. Pendiente de confirmación del número canónico de sedes y ciudades.
