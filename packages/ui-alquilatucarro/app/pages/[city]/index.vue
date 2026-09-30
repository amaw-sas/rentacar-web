<template>
  <CityPage v-if="city" :city />
</template>

<script lang="ts" setup>
// Import explicito: el auto-import de Nuxt no cubre funciones sueltas de utils
// (misma trampa documentada en CityPage.vue — sin esta linea, 500 en SSR).
import { cityLookupError } from '@rentacar-main/logic/utils'

definePageMeta({ middleware: ['rentacar-data'] })

const { city } = useCityPageSEO()
const { cities } = useData()

// `fatal: true` es necesario para que la página de error (error.vue) también
// se muestre en navegación client-side. 404 SOLO con catálogo poblado: con el
// catálogo vacío el mismo lookup fallido es un fallo de datos y responder
// «Página no encontrada» para una URL válida fue el 404 fantasma de producción
// (SCEN-005, docs/specs/2026-09-30-hydration-stale-catalog-race).
const lookupError = cityLookupError(Boolean(city), cities.value.length)
if (lookupError) {
  throw createError(lookupError)
}
</script>
