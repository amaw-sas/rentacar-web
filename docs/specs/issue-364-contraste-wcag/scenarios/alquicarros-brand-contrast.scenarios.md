---
name: alquicarros-brand-contrast
created_by: pabloandi
created_at: 2026-07-22T14:41:43Z
---

Holdout de la issue #364. Diseño: `docs/specs/2026-07-22-alquicarros-contraste-wcag-design.md`.

Todos los ratios se miden sobre el color efectivamente pintado (estilo computado),
nunca sobre la clase declarada. El mínimo aplicable sale de WCAG 2.1: 3:1 para
texto grande (>=24px, o >=18.66px en negrita) y para objetos gráficos (1.4.11),
4.5:1 para el resto. El tamaño se lee del estilo computado porque un `text-3xl`
puede venir sobrescrito por un `md:` posterior.

## SCEN-364-01: el hero de la home es legible

**Given**: la home de alquicarros servida en 1440x900
**When**: se mide el contraste del `<h1>`, del párrafo bajo él y de la CTA "Ver Precios" contra el color de fondo que cada uno tiene pintado detrás
**Then**: los tres alcanzan su mínimo aplicable. Hoy dan 2.20:1, 1.95:1 y 3.74:1
**Evidence**: sonda de estilos computados sobre `/`, tabla ratio + mínimo + veredicto por elemento

## SCEN-364-02: el hero de ciudad es legible

**Given**: la landing `/bogota` en 1440x900, en modo `landing` (sin motor de búsqueda)
**When**: se mide el `<h1>`, el párrafo, el badge "4.9 reviews" y la CTA "Reservar ahora"
**Then**: los cuatro alcanzan su mínimo aplicable. Hoy el h1 da 2.20:1 y la CTA 2.20:1
**Evidence**: sonda de estilos computados sobre `/bogota`

## SCEN-364-03: el precio del vehículo se lee

**Given**: la sección de flota de la home, con precios reales resueltos
**When**: se mide el precio, la palabra "Desde", el "+ IVA" y el "IVA incluido" del plan mensual
**Then**: los cuatro alcanzan su mínimo. Hoy dan 2.13:1, 4.44:1, 2.33:1 y 3.46:1
**Evidence**: sonda sobre `/`, nodos de la card que contiene `[data-testid=fleet-card-cta-test]`

Es el dato por el que la gente entra al sitio. Si algo de esta issue tiene que
quedar bien, es esto.

## SCEN-364-04: los aliados se leen en todo el gradiente

**Given**: la sección "Empresas Aliadas", cuyo fondo va de `#ff8a00` a `#e35d0a`
**When**: se mide el título, el párrafo y los nombres de aliados, cada uno contra el punto del gradiente que tiene detrás
**Then**: todos alcanzan su mínimo, también los que caen en el extremo oscuro. Hoy dan 1.90:1
**Evidence**: sonda sobre `/`, sección `#partners`, con el color de fondo resuelto por posición

El extremo del gradiente importa: `gray-800` pasa a 6.21:1 al principio y cae a
4.08:1 al final. Medir solo el inicio daría un falso verde.

## SCEN-364-05: el paso 1 del wizard es legible

**Given**: `/reservas` en el paso de búsqueda, cuyo hero usa el mismo gradiente naranja
**When**: se mide el `heading-label`, el `heading-page` y el `body-lg` sobre el hero
**Then**: los tres alcanzan su mínimo
**Evidence**: sonda sobre `/reservas`

Estas tres clases toman color de `--ctx-text-*`, así que el escenario también
comprueba que el contexto resuelve y no que alguien puso un `text-` encima.

## SCEN-364-06: ningún naranja ilegible sobre fondo claro

**Given**: las 11 rutas de alquicarros
**When**: se recorre cada nodo cuyo color de texto sea un tono de la escala `brand`, clasificándolo en texto normal, texto grande u objeto gráfico
**Then**: ninguno queda por debajo de su mínimo. En particular no queda ningún `brand-600` sobre fondo claro (2.13:1) ni ningún `brand-700` haciendo de texto normal (3.43:1)
**Evidence**: barrido runtime con la clasificación por nodo y el ratio de cada uno

La clasificación tiene que ser runtime. El emparejamiento estático de clases da
falsos positivos: `VehicleSegmentTile.vue:24` parece `brand-700` sobre `brand-600`
(1.61:1) y en realidad son las dos ramas de un ternario.

## SCEN-364-07: el naranja de marca no se movió

**Given**: la home y la landing de ciudad después del arreglo
**When**: se lee el color de fondo pintado del hero y el valor de los tokens en `theme.css`
**Then**: sigue siendo `#ff9500` en `--color-hero-from` y `#ef9600` en `--color-brand-600`, y el gradiente pintado arranca en `rgb(255, 149, 0)`
**Evidence**: `tests/f0-foundation.test.ts` en verde + color de fondo computado del `#hero`

Este escenario existe para que el arreglo de accesibilidad no se convierta en un
cambio de marca por la puerta de atrás.

## SCEN-364-08: mover un token naranja rompe la suite

**Given**: `theme.css` con `--color-on-brand: #111827` y los tokens de superficie naranja
**When**: alguien cambia `--color-hero-from` a un valor cuyo contraste contra `--color-on-brand` baje de 4.5:1 — por ejemplo `#5a3200` — y corre `pnpm --filter ui-alquicarros test`
**Then**: la suite falla, y el mensaje nombra el token concreto y el ratio medido, no un "expected true to be false"
**Evidence**: salida de vitest con el nombre del token y el ratio

Es el único guard que sobrevive a un cambio futuro de paleta. Se verifica en
rojo-verde: se mueve el token a mano, se observa el fallo, se restaura.

## SCEN-364-09: no se rompió nada por el camino

**Given**: las rutas tocadas por el arreglo
**When**: se cargan en 1440x900 y en 390x844
**Then**: cero errores de consola y cero peticiones de red fallidas, igual que la línea base de la auditoría
**Evidence**: consola y red completas por carga

## SCEN-364-10: pasar el ratón por un aliado no lo empeora

**Given**: la sección de aliados
**When**: el puntero se posa sobre un nombre y el estado `hover` toma el control
**Then**: el contraste sigue cumpliendo. Hoy `hover:text-white` da 2.36:1 sobre `#ff8a00` y 3.60:1 sobre `#e35d0a`, peor que el estado en reposo
**Evidence**: estilo computado del nodo con el puntero encima

Este salió de revisar el spec, no del issue. La tabla original midió el estado en
reposo y nunca pasó el ratón.
