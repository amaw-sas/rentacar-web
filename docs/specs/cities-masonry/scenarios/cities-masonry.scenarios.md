---
name: cities-masonry
created_by: pablo
created_at: 2026-06-27T00:00:00Z
---

# Cities — masonry horizontal de 4 lanes (alquicarros)

Rediseño de `packages/ui-alquicarros/app/components/home/Cities.vue`: la marquesina de una
sola fila se reemplaza por un masonry horizontal estilo Pinterest de 4 lanes auto-desplazables.
Convención del repo para `home/*`: el contrato observable se codifica como aserciones
static-source (leer el `.vue` como texto) y la verificación visual/runtime se hace en
navegador (agent-browser + dogfood) sobre el dev server.

## SCEN-CITIES-01: todas las ciudades activas son alcanzables
**Given**: `useData().cities` devuelve N ciudades activas (Supabase-dynamic)
**When**: la home renderiza la sección `#cities`
**Then**: cada ciudad aparece como link interno a `/{city.id}`; el count nunca se hardcodea ni
se hace `slice` del array. El grid de pills inferior se conserva como índice estable de todas
las ciudades.
**Evidence**: fuente con `v-for ... in cities`; DOM con un `a[href="/{slug}"]` por ciudad.

## SCEN-CITIES-02: el heading refleja el count vivo
**Given**: `useCityCount()` devuelve el número de ciudades activas
**When**: la sección renderiza
**Then**: el `h2` dice "Presentes en más de {{ cityCount }} Ciudades"
**Evidence**: fuente referencia `cityCount` en el heading; texto del `h2` en el DOM.

## SCEN-CITIES-03: 4 fotos reales, el resto tiles de marca
**Given**: solo existen 4 fotos (`/images/cities/{bogota,medellin,cali,cartagena}.jpg`)
**When**: el masonry renderiza
**Then**: las 4 ciudades FEATURED activas se muestran como tile-foto (`<NuxtImg>`); las demás
ciudades activas se muestran como tile de gradiente de marca con su nombre (sin `<img>`)
**Evidence**: exactamente 4 `NuxtImg` dentro del masonry; los tiles de nombre usan
`bg-linear-to-*` con un token `brand-*`.

## SCEN-CITIES-04: masonry de exactamente 4 lanes
**Given**: la sección de ciudades
**When**: el masonry renderiza
**Then**: se renderizan exactamente 4 lanes (filas) horizontales
**Evidence**: 4 tracks de lane en el DOM (`v-for` sobre un arreglo de 4 lanes).

## SCEN-CITIES-05: auto-scroll seamless y seguro para accesibilidad
**Given**: cada lane se auto-desplaza en loop
**When**: el track se anima
**Then**: cada lane contiene 2 copias de su set de tiles (loop sin costura por `translateX(-50%)`);
la segunda copia va `aria-hidden="true"` y `tabindex="-1"`, de modo que lectores de pantalla y
navegación por teclado visitan cada ciudad una sola vez
**Evidence**: links enfocables del masonry == nº de tiles (no duplicado); los tiles duplicados
llevan `aria-hidden="true"` y `tabindex="-1"`.

## SCEN-CITIES-06: sin ciudades inventadas
**Given**: una ciudad listada en FEATURED no está activa en los datos
**When**: el masonry renderiza
**Then**: esa ciudad NO aparece como tile-foto; el set featured es la intersección de FEATURED
con las ciudades activas
**Evidence**: `featuredCities` se computa con `flatMap`/`find` sobre `cities` (drop si no existe).

## SCEN-CITIES-07: reduced motion detiene la animación
**Given**: el usuario tiene `prefers-reduced-motion: reduce`
**When**: la sección renderiza
**Then**: los tracks quedan estáticos y centrados, y las copias duplicadas no se muestran
**Evidence**: `<style scoped>` incluye `@media (prefers-reduced-motion: reduce)` con
`animation: none` y oculta los tiles duplicados.

## SCEN-CITIES-08: pausa al hover
**Given**: el masonry se está desplazando
**When**: el cursor entra al área del masonry
**Then**: todas las lanes pausan su animación
**Evidence**: regla CSS con `:hover` + `animation-play-state: paused`.

## SCEN-CITIES-09: invariantes de reskin intactos
**Given**: el componente reescrito
**When**: corren los tests de reskin
**Then**: sin literal "Alquilame", sin rojos (hex ni `*-red-N`), usa `bg-linear-to-*` (nunca
`bg-gradient-to-`), el heading adopta `.heading-*`/`font-heading`, y usa tokens `brand-*`
**Evidence**: `reskin-invariants.test.ts` y `presentational.test.ts` verdes.
