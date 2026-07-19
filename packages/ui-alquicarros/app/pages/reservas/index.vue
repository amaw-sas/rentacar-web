<template>
  <!--
    /reservas (alquicarros) — página del WIZARD de reserva acompañada.

    El wizard reemplaza el hero+Searcher+grid anterior: es la experiencia completa
    de 5 pasos (Búsqueda → Vehículo → Seguro → Adicionales → Datos) con resumen
    persistente. La barra de pasos y el resumen viven dentro de <ReservationWizard>.

    SEO preservado (SCEN-W-01/01b): /reservas limpio es indexable y arranca en
    Paso 1 sin disparar búsqueda; /reservas?lugar_recogida=… entra en Paso 2 y
    emite robots noindex,follow. Las secciones de confianza F1 se muestran solo en
    la vista limpia (sin query de resultados), gateadas por route.query
    (SSR-estable, sin flash/CLS). HomeContact se mantiene (su CTA ancla a #hero).
  -->
  <div>
    <ReservationWizard />

    <HomeHowItWorks v-if="!hasResultsQuery" />
    <HomeRequirements v-if="!hasResultsQuery" />
    <HomeStats v-if="!hasResultsQuery" />
    <HomeContact reserve-anchor="#hero" />
  </div>
</template>

<script setup lang="ts">
// Internal components
import ReservationWizard from '~/components/wizard/ReservationWizard.vue'

const { franchise } = useAppConfig()
const route = useRoute()

/**
 * Results-query flag. SSR-stable (route.query disponible en SSR), así el gate de
 * las secciones de confianza y el robots meta son correctos en el HTML servido
 * (sin flash/CLS). "results query" = /reservas con params de búsqueda
 * (lugar_recogida es la clave load-bearing).
 */
/** Pickup presente (trimeado): un `?lugar_recogida=%20` NO cuenta como resultados —
 *  consistente con deriveStepFromRoute / el shell del wizard (evita noindex + ocultar
 *  el marketing con un param en blanco). */
function hasPickup(v: unknown): boolean {
  const raw = Array.isArray(v) ? v[0] : v
  return typeof raw === 'string' ? raw.trim() !== '' : raw != null
}
const hasResultsQuery = computed(() => hasPickup(route.query.lugar_recogida))

// Keep the HTTP robots directive coherent with the query-aware HTML meta.
// A static routeRule would incorrectly noindex the clean /reservas landing.
const robotsResponseHeader = useResponseHeader('X-Robots-Tag')
if (import.meta.server && hasResultsQuery.value) {
  robotsResponseHeader.value = 'noindex, follow'
}

const title = 'Reserva tu carro | Alquiler de vehículos'
const description =
  'Reserva tu carro de alquiler en Colombia: elige sucursal, fechas y horarios y consulta disponibilidad y precios al instante, paso a paso. Sin anticipos.'
const canonical = `${franchise.website}/reservas`

/**
 * SEO propio de /reservas. useBaseSEO aporta los schemas de marca; aquí se
 * sobrescriben title/description + canonical + og. NO se emite Product/FAQPage de
 * ciudad (viven en las páginas de ciudad, #68).
 */
useBaseSEO()
useBreadcrumbs([
  { name: 'Inicio', path: '/' },
  { name: 'Reservas', path: '/reservas' },
])

useSeoMeta({
  // El estado con params de resultados (/reservas?lugar_recogida=…) es
  // noindex,follow — duplicaría las páginas de ciudad crawlables; la /reservas
  // limpia (sin query) queda indexable. SSR-estable.
  robots: () => (hasResultsQuery.value ? 'noindex, follow' : undefined),
  title,
  description,
  ogType: 'website',
  ogTitle: title,
  ogDescription: description,
  ogImage: franchise.ogImage,
  ogImageUrl: franchise.ogImage,
  ogImageType: 'image/jpeg',
  ogImageWidth: '1200',
  ogImageHeight: '630',
  ogUrl: canonical,
  ogLocale: 'es_CO',
  ogSiteName: franchise.shortname,
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: franchise.ogImage,
})

useHead({
  link: [{ rel: 'canonical', href: canonical }],
})

definePageMeta({
  colorMode: 'light',
  middleware: ['rentacar-data'],
})
</script>
