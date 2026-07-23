<template>
  <!--
    /reservas — RESULTS surface (PATH params). Mounted by the
    pages/reservas/lugar-recogida/.../ tree (+ categoria / referido variants).
    Mirrors reservas/index.vue's hero visual language but drives the search from
    route.params (useSearchByRouteParams) instead of the query string, and the
    category grid is ALWAYS rendered (params present ⇒ a search runs). This is the
    surface the old /{city}/buscar-vehiculos/... route provided, moved under
    /reservas without the [city] segment (routing independence, directiva).

    SEO: these parameterized result URLs are noindex,follow with canonical to the
    clean /reservas hub — they duplicate the crawlable city pages and must not
    cannibalize them. Only the clean /reservas (pages/reservas/index.vue) stays
    indexable.
  -->
  <div>
    <section
      id="hero"
      class="relative flex items-center overflow-hidden bg-linear-to-br from-hero-from to-hero-to [--ctx-text-primary:#fff]"
    >
      <div id="searcher" aria-hidden="true" class="absolute scroll-mt-20" />

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 w-full">
        <div class="grid lg:grid-cols-2 gap-10 items-center">
          <div class="text-center lg:text-left">
            <h1 class="font-heading font-extrabold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-white leading-[1.1]">
              Reserva tu carro
            </h1>
            <p class="mt-4 text-base md:text-lg text-white/85 max-w-2xl mx-auto lg:mx-0">
              Elige sucursal de recogida, fechas y horarios y consulta
              disponibilidad y precios al instante. Renta un vehículo por días,
              semanas o el tiempo que necesites — sin anticipos.
            </p>
          </div>

          <div class="flex items-center justify-center">
            <div class="w-full max-w-lg mx-auto">
              <div class="hidden lg:block h-[410px]">
                <ClientOnly>
                  <Searcher />
                  <template #fallback>
                    <PlaceholdersSearcher />
                  </template>
                </ClientOnly>
              </div>
              <div class="lg:hidden h-[360px]">
                <ClientOnly>
                  <Searcher />
                  <template #fallback>
                    <PlaceholdersSearcher />
                  </template>
                </ClientOnly>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!--
      Results — always mounted on a PATH results URL (params drive the search).
      resultsActive gates on the store (pending / categories / error), exactly
      like reservas/index.vue, so the block persists while pending, on success,
      and on error (error UX still surfaces).
    -->
    <UPageSection
      id="seleccion-categorias"
      v-if="resultsActive"
      :ui="{ container: 'pt-0' }"
    >
      <CategorySelectionSection />
    </UPageSection>

    <HomeContact reserve-anchor="#hero" />
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const { franchise } = useAppConfig()

/**
 * Drive the in-place search from the PATH params (lugar_recogida slug, dates,
 * 12h times, optional referido). Shared logic composable — reused untouched from
 * the old buscar-vehiculos pages; it reads route.params and fires doSearch().
 */
useSearchByRouteParams()

/**
 * Results gating, mirroring reservas/index.vue: lazy store init (onMounted) to
 * avoid SSR Pinia errors; the block stays mounted while pending, when categories
 * are present, or on a search error.
 */
const pendingSearch = ref(false)
const filteredCategories = ref<unknown[]>([])
const searchError = ref<unknown>(null)

onMounted(() => {
  const storeSearch = useStoreSearchData()
  const refs = storeToRefs(storeSearch)
  watch(() => refs.pending.value, (val) => (pendingSearch.value = val), { immediate: true })
  watch(() => refs.filteredCategories.value, (val) => (filteredCategories.value = val), { immediate: true })
  watch(() => refs.error.value, (val) => (searchError.value = val), { immediate: true })
})

const resultsActive = computed(
  () => pendingSearch.value || filteredCategories.value.length > 0 || !!searchError.value,
)

const Searcher = defineAsyncComponent(() => import('../Searcher.vue'))
const PlaceholdersSearcher = defineAsyncComponent(
  () => import('../Placeholders/Searcher.vue'),
)

const title = 'Reserva tu carro | Alquiler de vehículos'
const description =
  'Reserva tu carro de alquiler en Colombia: elige sucursal, fechas y horarios y consulta disponibilidad y precios al instante. Sin anticipos.'
const canonical = `${franchise.website}/reservas`

/**
 * SEO for the parameterized results state. useBaseSEO provides the brand-wide
 * schemas; here we force noindex,follow (this URL duplicates the crawlable city
 * pages) and canonicalize to the clean /reservas hub. No city Product/FAQPage
 * schema (those live on the city pages, #68).
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
