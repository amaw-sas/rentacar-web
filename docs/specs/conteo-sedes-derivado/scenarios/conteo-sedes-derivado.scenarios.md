---
name: conteo-sedes-derivado
created_by: diego
created_at: 2026-08-14T00:00:00Z
---

# El conteo de sedes deja de estar escrito a mano

Auditoría del 2026-08-14: siete textos de las tres marcas anuncian menos sedes de
las que hay. El peor está vivo en la home de alquilatucarro.com ("27 sedes",
cuando son 31) y otro en el blog de Supabase dice "19 sedes", que además confunde
sedes con ciudades.

La causa no es que alguien se equivocara al escribir 27: es que el número está
escrito. `useCityCount` ya resolvió lo mismo para las ciudades y
`ui-alquilame/app/pages/blog/index.vue` ya aplica el patrón con un test que lo
sostiene (`SCEN-BLOG-01`). Esto replica ese precedente para las sedes.

Números reales al 2026-08-14: **31 sedes**, **19 ciudades** (Pereira está inactiva
unos días por reparación, según el dueño; vuelve).

## SCEN-001: la home de alquilatucarro anuncia las sedes que hay
**Given**: alquilatucarro.com con los datos actuales (31 sedes)
**When**: se carga la home y se lee el párrafo bajo el buscador
**Then**: dice "Contamos con **31** sedes a nivel nacional"; el número sale de los
datos, no de un literal en el markup
**Evidence**: texto renderizado en el DOM; `Hero/Description.vue` sin cifra escrita

## SCEN-002: el conteo sigue a los datos sin tocar código
**Given**: el composable de conteo de sedes
**When**: cambia el número de sucursales en `rentacar-data`
**Then**: todos los textos que lo consumen cambian con él en el siguiente render,
sin editar ningún fichero
**Evidence**: test que alimenta el composable con listas de distinto tamaño y
observa el conteo

## SCEN-003: nunca se anuncia "0 sedes"
**Given**: `rentacar-data` sin resolver (SSR antes del plugin, o fetch fallido) y
por tanto `branches: []`
**When**: se renderiza cualquier texto que anuncia sedes
**Then**: se muestra el respaldo (31), nunca "0 sedes" ni una frase vacía
**Evidence**: test del composable con lista vacía y con estado ausente

## SCEN-004: ningún texto de las tres marcas deja el número escrito
**Given**: el código de las tres marcas
**When**: se buscan cifras pegadas a "sedes" o "ciudades" en páginas y componentes
**Then**: no queda ninguna; los siete sitios auditados interpolan el conteo
**Evidence**: guarda de source sobre los ficheros afectados, al estilo de
`SCEN-BLOG-01` de alquilame

## SCEN-005: los dos textos de ciudades pasados de fecha quedan corregidos
**Given**: `/gana` de alquicarros y alquilatucarro, y la bio del autor en el blog
de alquicarros y alquilame
**When**: se leen
**Then**: ninguno dice "más de 20 ciudades" ni "más de 27 ciudades"; los cuatro
anuncian el conteo real de ciudades (19), interpolado
**Evidence**: texto renderizado; guarda de source

## SCEN-006: sedes y ciudades dejan de confundirse
**Given**: los textos corregidos
**When**: se lee cada uno
**Then**: el que habla de sedes dice "sedes" con el conteo de sedes, y el que
habla de ciudades dice "ciudades" con el conteo de ciudades — ninguno cruza el
número de una cosa con el sustantivo de la otra
**Evidence**: revisión del texto renderizado de los siete sitios

## SCEN-007: las tres marcas siguen verdes
**Given**: el repo con los cambios
**When**: se corren las suites de las tres marcas y el typecheck
**Then**: todo pasa, incluido `blog-brand.test.ts` de alquilame, que ya prohibía
quemar estos números
**Evidence**: salida de vitest y de typecheck

## SCEN-008: sin errores en runtime
**Given**: las páginas tocadas cargadas en el navegador
**When**: se revisan consola y red
**Then**: cero errores y cero peticiones fallidas
**Evidence**: consola y red del navegador de Orca
