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

useBaseSEO();
useHomeBreadcrumb();

useSeoMeta({
  ogType: "website",
  ogTitle: franchise.title,
  ogDescription: franchise.description,
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
  twitterTitle: franchise.title,
  twitterDescription: franchise.description,
  twitterImage: franchise.ogImage,
  twitterImageAlt: `Familia colombiana disfrutando viaje en carro alquilado - ${franchise.name}`,
});

useSchemaOrg([
  <FAQPage>{
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) =>
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
});

// AggregateRating schema for testimonials (shows stars in Google SERPs).
// Pre-existing behaviour preserved as-is (no regression) — its wiring is known
// debt, out of F1 scope. The #video section + its VideoObject/Promotion schemas
// were removed (F1 step 8): the new design surfaces neither a video nor the 60%
// offer, so those schemas would be orphaned/dishonest.
useHomeAggregateRating();
</script>
