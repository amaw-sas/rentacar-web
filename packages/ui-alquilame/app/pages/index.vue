<template>
  <!--
    F1 home — full-bleed landing assembled from app/components/home/* in the
    design's section order. Each section owns its own max-width; engine pieces
    (SelectBranch inside Hero/Fleet) are preserved. The FAB lives in the layout
    (LazyChatWidget), the footer is the F0 chrome.
  -->
  <div>
    <HomeAnnouncementBar />
    <HomeHero />
    <HomeFleet />
    <HomeHowItWorks />
    <HomeValueProps />
    <HomeCities />
    <HomeReviews />
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
