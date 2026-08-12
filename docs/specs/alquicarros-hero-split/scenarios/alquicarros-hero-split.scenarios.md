---
name: alquicarros-hero-split
created_by: diego
created_at: 2026-08-11T00:00:00Z
---

# Hero split — index de alquicarros

Sección `#hero` del home de alquicarros
(`packages/ui-alquicarros/app/components/home/Hero.vue`). Se sustituye el hero de
degradado naranja por el hero split del satélite `alquilercarrosmonteria.com`: foto a
sangre + overlay, tarjeta de precio flotante a la izquierda, copy + CTAs + chips a la
derecha.

Decisiones del dueño (2026-08-11):
- El hero es **estático**: no consulta Supabase. El precio y el número de ciudades quedan
  escritos en el código.
- El precio sale de la **mensualidad**, no de la tarifa diaria.
- Chips: "Paga al recoger", "Sin pago anticipado", "Cancelación gratis", "Vehículos nuevos".
  Se descarta "Km ilimitado" porque contradice al plan mensual (1.000 km/mes).
- La foto de fondo es la misma del satélite (`hero-alquicarros.webp`).

## SCEN-001: composición split en desktop
**Given**: usuario en `/` de alquicarros con viewport ≥ 1280px
**When**: carga la página
**Then**: el hero ocupa el ancho completo con una **fotografía de fondo** (no el degradado
naranja); sobre ella, una **tarjeta blanca** con la foto del carro y el precio queda en la
mitad izquierda, y el bloque de copy (eyebrow "Alquiler de carros", h1, subtítulo, 2 CTAs,
4 chips) en la mitad derecha; ambas columnas son legibles y no se solapan
**Evidence**: screenshot ≥1280px; DOM: `section#hero` sin `from-hero-from`, con `<img>`/NuxtImg de fondo posicionado absoluto

## SCEN-002: el precio mostrado es el de la mensualidad más barata, dividido entre 30
**Given**: la tarjeta flotante del hero
**When**: se lee el precio
**Then**: muestra **"$126.867/día"** con la aclaración **"tarifa diaria en plan de 30 días"**
visible junto al número; ese valor es exactamente `3.806.000 / 30`, donde 3.806.000 es la
tarifa `1k_kms` activa positiva más barata de la Gama C — la misma regla que aplica
`Fleet.vue` en la pestaña "Mensualidad"
**Evidence**: texto renderizado en el DOM; test que compara la constante del hero contra
`pickRepresentativeMonthlyPrice` sobre los datos reales

## SCEN-003: el hero no dispara ninguna consulta de datos
**Given**: el hero renderizado
**When**: se inspecciona su código y las peticiones de red de la página
**Then**: `Hero.vue` no invoca `useCityCount()`, `useFetchRentacarData()` ni ningún
composable de datos; el número de ciudades ("19") y el precio son literales en el source
**Evidence**: source de `Hero.vue` sin llamadas a composables de datos; panel de red sin petición
originada por el hero

## SCEN-004: el texto sobre la foto cumple contraste AA
**Given**: el hero con la foto de fondo y el overlay
**When**: se mide el contraste del h1, del subtítulo y de los 4 chips contra el píxel de
fondo más claro que tienen debajo
**Then**: el subtítulo y los chips alcanzan **≥ 4.5:1**; el h1 (texto grande) alcanza
**≥ 3:1**, y en la práctica también ≥ 4.5:1
**Evidence**: medición de ratio sobre el screenshot renderizado, no estimación

## SCEN-005: los 4 chips son los aprobados, sin "Km ilimitado"
**Given**: el bloque de copy del hero
**When**: se leen los chips de confianza
**Then**: aparecen exactamente "Paga al recoger", "Sin pago anticipado", "Cancelación gratis"
y "Vehículos nuevos"; **no** aparece "Km ilimitado" en el hero
**Evidence**: texto renderizado; test de source

## SCEN-006: apilado sin desbordamiento en móvil
**Given**: viewport de 375px de ancho
**When**: se carga `/`
**Then**: la tarjeta de precio y el bloque de copy se apilan verticalmente, el h1 no se
corta, los 4 chips fluyen a varias líneas y **no hay scroll horizontal** en el documento
**Evidence**: screenshot 375px; `document.documentElement.scrollWidth <= innerWidth`

## SCEN-007: la foto de fondo es el elemento LCP y no provoca salto de layout
**Given**: carga en frío de `/`
**When**: el navegador pinta el hero
**Then**: la imagen de fondo se solicita con prioridad alta (`preload` + `fetchpriority=high`)
y la sección reserva su altura antes de que la imagen llegue, de modo que el contenido de
debajo ("Cómo funciona") no se desplaza al cargar
**Evidence**: atributos en el DOM; sin CLS atribuible al hero en la carga observada

## SCEN-008: la página sigue limpia en runtime
**Given**: `/` cargada en el navegador
**When**: se revisan consola y red
**Then**: **cero errores** de consola y **cero peticiones fallidas**
**Evidence**: consola y panel de red del navegador de Orca

## SCEN-009: las tres marcas siguen verdes
**Given**: el repo con el hero nuevo
**When**: se ejecuta la suite de las tres marcas y el typecheck
**Then**: todo pasa; en particular siguen satisfechas las invariantes de
`reskin-invariants.test.ts` (el hero no referencia vídeo de alquilame, sí referencia
`/images/vehicles/`) y de `presentational.test.ts` (sin `bg-gradient-to-`, con utilidad
`heading-*`/`font-heading`)
**Evidence**: salida de vitest y de typecheck
