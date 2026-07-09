<template>
  <!--
    /reservas — RESULTS surface del WIZARD por PATH params. Montado por el árbol
    pages/reservas/lugar-recogida/.../ (+ categoria / referido). Hidrata la búsqueda
    desde route.params (useSearchByRouteParams) y monta el wizard; deriveStepFromRoute
    (logic) arranca en Paso 2 (Vehículo) — o Paso 3 (Seguro) con la gama preseleccionada
    cuando el path trae /categoria/X (link del operador). El paso sigue en `?paso=`
    (híbrido). Es la superficie que antes daba /{city}/buscar-vehiculos/..., movida bajo
    /reservas sin el segmento [city] (independencia de enrutamiento, directiva).

    SEO: estas URLs parametrizadas son noindex,follow con canonical a la /reservas
    limpia (duplican las páginas de ciudad crawlables). Solo /reservas limpio
    (pages/reservas/index.vue) queda indexable.
  -->
  <div>
    <ReservationWizard />

    <HomeContact reserve-anchor="#hero" />
  </div>
</template>

<script setup lang="ts">
// Internal components
import ReservationWizard from '~/components/wizard/ReservationWizard.vue'

const { franchise } = useAppConfig()

/**
 * Hidrata la búsqueda desde el PATH (lugar_recogida slug, fechas, horas 12h, referido
 * opcional). Composable compartido de logic — reusado tal cual desde las viejas páginas
 * buscar-vehiculos; lee route.params y dispara doSearch(). El shell del wizard NO lo
 * llama (se mantiene su contrato); la hidratación por path vive aquí, como en CityPage.
 */
useSearchByRouteParams()

const title = 'Reserva tu carro | Alquiler de vehículos'
const description =
  'Reserva tu carro de alquiler en Colombia: elige sucursal, fechas y horarios y consulta disponibilidad y precios al instante, paso a paso. Sin anticipos.'
const canonical = `${franchise.website}/reservas`

/**
 * SEO del estado de resultados parametrizado. useBaseSEO aporta los schemas de marca;
 * aquí forzamos noindex,follow (esta URL duplica las páginas de ciudad crawlables) y
 * canonicalizamos a la /reservas limpia. Sin Product/FAQPage de ciudad (#68).
 */
useBaseSEO()
useBreadcrumbs([
  { name: 'Inicio', path: '/' },
  { name: 'Reservas', path: '/reservas' },
])

useSeoMeta({
  robots: 'noindex, follow',
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
</script>
