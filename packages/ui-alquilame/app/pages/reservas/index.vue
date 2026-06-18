<template>
  <!--
    F3 — /reservas (alquilame only): the centralized search page (issue #112).

    This page is the SEARCH page, not the results page. The <Searcher> engine is
    preserved untouched (same component → same data-testid, same navigation): on
    submit it builds the deep `/{city}/buscar-vehiculos/...` URL via the
    Searcher's city-derivation (step01 — when the route has no :city, the city is
    derived from the chosen pickup branch). No redirect, no URL collapse: the
    existing results route + its programmatic SEO stay intact.

    Layout reuses the approved F1/F2 visual language:
      - Red hero (bg-linear-to-br from-hero-from to-hero-to), .heading-hero
        headline, [--ctx-text-primary:#fff] so .heading-* renders white on red.
      - The Searcher engine mirrors city/Hero.vue's results mode EXACTLY: wrapped
        in <ClientOnly> with a fixed-height <PlaceholdersSearcher> fallback
        (h-[410px] desktop / h-[360px] mobile) so hydration causes no layout
        shift and NO current-date call is baked into the SSR/ISR markup
        (issue #109 — the date is computed client-side, after hydration).
      - F1 trust sections reused as-is below the hero.

    Gradient guard (F0/F1 lesson): the red gradient MUST use the v4
    bg-linear-to-* utility from the hero-from/hero-to @theme tokens; the broken
    v3 alias renders background-image:none with custom tokens.

    SEO: own title/description/canonical/og for /reservas + a simple
    Inicio → Reservas breadcrumb. This page does NOT emit the city Product /
    FAQPage schemas — those belong to the city pages (#68); /reservas must not
    duplicate them.
  -->
  <div>
    <section
      id="hero"
      class="relative flex items-center overflow-hidden bg-linear-to-br from-hero-from to-hero-to [--ctx-text-primary:#fff]"
    >
      <!--
        In-page anchor for HomeContact's "Reserva Ahora" CTA (reserveAnchor="#hero")
        and any scroll-to-search affordance. Kept independent from the engine.
      -->
      <div id="searcher" aria-hidden="true" class="absolute scroll-mt-20" />

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 w-full">
        <div class="grid lg:grid-cols-2 gap-10 items-center">
          <!-- Text column -->
          <div class="text-center lg:text-left">
            <h1 class="heading-hero text-3xl sm:text-4xl lg:text-5xl text-white leading-[1.1]">
              Reserva tu carro
            </h1>

            <p class="mt-4 text-base md:text-lg text-white/85 max-w-2xl mx-auto lg:mx-0">
              Elige sucursal de recogida, fechas y horarios y consulta
              disponibilidad y precios al instante. Renta un vehículo por días,
              semanas o el tiempo que necesites — sin anticipos.
            </p>
          </div>

          <!--
            Engine column — preserved untouched (same component → same
            data-testid, same navigation to buscar-vehiculos). CLS guard
            (issue #109): the fixed-height wrappers reserve the Searcher footprint
            so the ClientOnly fallback and the hydrated form occupy the same box —
            no shift, and no current-date call in the SSR/ISR markup. Desktop and
            mobile keep distinct heights matching the form layout.
          -->
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

    <!-- F1 trust sections reused as-is. HomeContact anchors to this page's #hero. -->
    <HomeHowItWorks />
    <HomeRequirements />
    <HomeStats />
    <HomeContact reserve-anchor="#hero" />
  </div>
</template>

<script setup lang="ts">
/** imports */
import { defineAsyncComponent } from 'vue'

const { franchise } = useAppConfig()

const Searcher = defineAsyncComponent(() => import('../../components/Searcher.vue'))
const PlaceholdersSearcher = defineAsyncComponent(
  () => import('../../components/Placeholders/Searcher.vue'),
)

const title = 'Reserva tu carro | Alquiler de vehículos'
const description =
  'Reserva tu carro de alquiler en Colombia: elige sucursal, fechas y horarios y consulta disponibilidad y precios al instante. Sin anticipos.'
const canonical = `${franchise.website}/reservas`

/**
 * Own SEO for /reservas. useBaseSEO provides the brand-wide WebSite/Organization/
 * AutoRental schemas; here we override title/description and add canonical + og.
 * NO city Product/FAQPage schema is emitted — those live on the city pages (#68).
 */
useBaseSEO()
useBreadcrumbs([
  { name: 'Inicio', path: '/' },
  { name: 'Reservas', path: '/reservas' },
])

useSeoMeta({
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
})
</script>
