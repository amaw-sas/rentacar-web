<template>
  <!--
    F1 home — full-bleed landing assembled from app/components/home/* in the
    design's section order. Each section owns its own max-width; engine pieces
    (SelectBranch inside Hero/Fleet) are preserved. The FAB lives in the layout
    (LazyChatWidget), the footer is the F0 chrome.

    Reviews omitted by product decision (no Google review data is fabricated), so
    the AggregateRating schema is NOT emitted here — an orphan rating with no
    visible reviews would be an SEO penalty and dishonest.
  -->
  <div>
    <HomeAnnouncementBar />
    <HomeHero />
    <HomeFleet />
    <HomeHowItWorks />
    <HomeValueProps />
    <HomeCities />
    <HomeStats />
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
    // El preload de la imagen hero lo emite <NuxtImg preload> en HomeHero.
  ],
});

definePageMeta({
  colorMode: "light",
  middleware: ["rentacar-data"],
});
</script>
