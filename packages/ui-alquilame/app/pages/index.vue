<template>
  <!--
    F1 home — full-bleed landing assembled from app/components/home/* in the
    design's section order. Each section owns its own max-width; engine pieces
    (SelectBranch inside Hero/Fleet) are preserved. The FAB lives in the layout
    (LazyChatWidget), the footer is the F0 chrome.
  -->
  <div>
    <!-- The announcement bar moved to layouts/default.vue: it is top chrome and
         must render ABOVE the header, which only the layout owns. -->
    <HomeHero />
    <HomeFleet />
    <!--
      Franjas separadoras: mismo componente y mismo ritmo que las landings de
      ciudad (tras la flota, tras "por que", y tras las resenas). Alla el texto
      sale de la descripcion de cada ciudad; la home no tiene equivalente, asi
      que estas tres frases hablan del pais en general y evitan el tono
      comercial, igual que el util de ciudad descarta las frases de oferta.
    -->
    <CityPullQuote :quote="pullQuotes[0]!" />
    <HomeHowItWorks />
    <!-- Stats sit high — right after "Cómo funciona" and before "¿Por qué?" —
         matching the reference order (was previously buried below Reviews). -->
    <HomeStats />
    <HomeValueProps />
    <CityPullQuote :quote="pullQuotes[1]!" />
    <HomeCities />
    <CityPullQuote :quote="pullQuotes[2]!" :lead="franchise.shortname" />
    <HomeReviews />
    <HomeRequirements />
    <HomeFaq />
    <HomeContact />
    <HomePartners />
  </div>
</template>

<script lang="ts" setup>
/** types */
import type { FAQPage } from "schema-dts";

const { franchise } = useAppConfig();

// Texto de las franjas separadoras. La home habla del pais, no de una ciudad,
// asi que estas frases se escriben aqui (en ciudad salen de su descripcion).
// El numero de ciudades sale de la misma fuente que el footer: escrito a mano
// se desactualiza, como ya paso con "27 sedes" en el blog.
const cityCount = useCityCount();
const pullQuotes = computed(() => [
  'Colombia se ve distinta desde la carretera. Lo bueno suele estar entre una ciudad y otra.',
  'Sin carro dependes del horario de otros. Con carro, del tuyo.',
  `entrega carros en ${cityCount.value} ciudades del pais desde 2015.`,
]);
const { faqs } = useData();
const homeSEO = useHomeSEO();

useBaseSEO({
  title: homeSEO.title,
  description: homeSEO.description,
});
useHomeBreadcrumb();

useSeoMeta({
  ogType: "website",
  ogTitle: homeSEO.title,
  ogDescription: homeSEO.description,
  ogImage: franchise.ogImage,
  ogImageAlt: `Familia colombiana disfrutando viaje en carro alquilado - ${franchise.name}`,
  ogImageType: "image/jpeg",
  ogImageUrl: franchise.ogImage,
  ogImageWidth: "1200",
  ogImageHeight: "630",
  ogUrl: franchise.website,
  ogLocale: "es_CO",
  ogSiteName: franchise.shortname,
  twitterCard: "summary_large_image",
  twitterTitle: homeSEO.title,
  twitterDescription: homeSEO.description,
  twitterImage: franchise.ogImage,
  twitterImageAlt: `Familia colombiana disfrutando viaje en carro alquilado - ${franchise.name}`,
});

useSchemaOrg([
  <FAQPage>{
    "@type": "FAQPage",
    mainEntity: faqs.value.map((faq) =>
      defineQuestion({
        name: faq.label,
        acceptedAnswer: faq.content,
      })
    ),
  },
]);

useHead({
  link: [
    { rel: "canonical", href: franchise.website },
    // Preloads de imagen hero movidos a nuxt.config.ts para estar en HTML inicial
  ],
});

definePageMeta({
  colorMode: "light",
  middleware: ["rentacar-data"],
});

// The aggregate-rating schema was removed site-wide (#312): the ratings were
// fabricated (hardcoded 4,9★ + 5/5 per review) and self-serving review markup
// is ineligible per Google's review-snippet guidelines even with real reviews.
// The #video section + its VideoObject/Promotion schemas were removed earlier
// (F1 step 8): the new design surfaces neither a video nor the 60% offer, so
// those schemas would be orphaned/dishonest.
</script>
