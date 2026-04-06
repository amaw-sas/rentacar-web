<template>
  <UApp :locale="es" :toaster>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
<script lang="ts" setup>
import { es } from '@nuxt/ui/locale'
const toaster =  { expand: true, position: "top-center", duration: 10000 }
useBaseSEO();

// Critical CSS inline para prevenir FOUC
// Preconnect movido a nuxt.config.ts para estar en HTML inicial
useHead({
  style: [
    {
      key: "critical-fouc",
      innerHTML: `
        /* Critical CSS - UPageHero h1 (previene FOUC de letter-spacing) */
        h1[data-slot="title"] {
          font-size: 3rem;
          line-height: 1;
          font-weight: 700;
          letter-spacing: -0.025em;
        }
        @media (min-width: 640px) {
          h1[data-slot="title"] {
            font-size: 4.5rem;
          }
        }
        /* Critical CSS - Hero content inside h1 */
        .hero-h1-critical {
          color: white;
          font-size: 2.25rem;
          line-height: 2.5rem;
          text-align: center;
          font-weight: 700;
        }
        .hero-h1-critical .block { display: block; }
        .hero-h1-critical .uppercase { text-transform: uppercase; }
        .hero-h1-critical .tracking-wide { letter-spacing: 0.025em; }
        /* Critical CSS - SelectBranch (previene FOUC de tamaño) */
        .select-branch-critical {
          width: 100%;
          border-radius: 0.75rem;
          color: #1f2937;
          border: 1px solid #9ca3af;
          background-color: white;
          padding: 1.5rem 0.75rem 1.5rem 2.5rem;
          font-size: 1rem;
          min-height: 4.5rem;
        }
      `,
    },
  ],
});
</script>