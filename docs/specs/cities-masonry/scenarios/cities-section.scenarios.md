---
name: cities-section
created_by: pablo
created_at: 2026-06-27T00:00:00Z
supersedes: cities-masonry.scenarios.md (marquesina/masonry rechazado en review — 4 fotos no llenan tiles)
---

# Cities — mosaico editorial + listado de cobertura (alquicarros)

ESTE archivo es el contrato VIGENTE. Reemplaza a `cities-masonry.scenarios.md` (marquesina de 4
lanes), rechazada en review: con solo 4 fotos reales no se puede simular un tile de imagen por
ciudad. Diseño nuevo: las ciudades con foto van en un **mosaico estático asimétrico** ("ciudades
destacadas"); TODAS las ciudades van debajo como **listado de enlaces tipográficos con pin**
("cobertura nacional"). Sin marquesina ni animación de scroll. Convención del repo para `home/*`:
aserciones static-source + verificación visual en navegador.

## SCEN-CITIES-01: todas las ciudades activas son alcanzables
**Given**: `useData().cities` devuelve N ciudades activas
**When**: la sección `#cities` renderiza
**Then**: cada ciudad aparece en el listado de cobertura como link interno a `/{city.id}`;
count driven por `cities`, sin `slice` ni hardcode
**Evidence**: fuente con `v-for="city in cities"` + `:to="`/${city.id}`"`; DOM con un
`a[href="/{slug}"]` por ciudad.

## SCEN-CITIES-02: el heading refleja el count vivo
**Given**: `useCityCount()` devuelve el número de ciudades activas
**When**: la sección renderiza
**Then**: el `h2` dice "Presentes en más de {{ cityCount }} Ciudades"
**Evidence**: fuente referencia `cityCount`; texto del `h2` en el DOM.

## SCEN-CITIES-03: mosaico con las fotos disponibles (estático)
**Given**: solo existen 4 fotos (`/images/cities/{bogota,medellin,cali,cartagena}.jpg`)
**When**: el mosaico renderiza
**Then**: solo las ciudades FEATURED activas aparecen como tile-foto (`<NuxtImg>`) enlazado a su
página; el número de tiles del mosaico == número de fotos disponibles (no se inventan tiles).
Es estático: sin tracks animados ni duplicación
**Evidence**: el mosaico tiene exactamente `featuredCities.length` `NuxtImg`; FEATURED define las
4 ciudades con `/images/cities/`.

## SCEN-CITIES-04: listado de cobertura tipográfico (no bloques de color)
**Given**: las ciudades sin foto (la mayoría)
**When**: la sección renderiza
**Then**: el listado muestra cada ciudad como enlace de texto con un ícono de pin, NO como bloque
de fondo sólido de marca (se prohíbe el tile-nombre naranja del intento anterior)
**Evidence**: el listado usa `i-lucide-map-pin`; la fuente NO contiene
`bg-linear-to-br from-brand-500 to-brand-700` (el tile-nombre rechazado).

## SCEN-CITIES-05: sin marquesina ni auto-scroll
**Given**: el rediseño
**When**: la sección renderiza
**Then**: no hay marquesina: ni lanes animadas, ni `@keyframes`, ni duplicación de tiles para
loop. Cada ciudad aparece una sola vez en el DOM del listado (sin copias aria-hidden)
**Evidence**: la fuente NO contiene `cities-lane`, `@keyframes`, `animation-play-state`, ni
`[...` (spread de duplicación).

## SCEN-CITIES-06: sin ciudades inventadas
**Given**: una ciudad FEATURED no está activa en los datos
**When**: el mosaico renderiza
**Then**: esa ciudad NO aparece como tile-foto; el set featured es la intersección de FEATURED
con las ciudades activas
**Evidence**: `featuredCities` se computa con `FEATURED.flatMap` + `cities.find` (drop si no existe).

## SCEN-CITIES-07: invariantes de reskin intactos
**Given**: el componente reescrito
**When**: corren los tests de reskin
**Then**: sin literal "Alquilame", sin rojos (hex ni `*-red-N`), usa `bg-linear-to-*` (nunca
`bg-gradient-to-`), heading con `.heading-*`/`font-heading`, y usa tokens `brand-*`
**Evidence**: `reskin-invariants.test.ts` y `presentational.test.ts` verdes.
