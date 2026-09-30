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
        /* SCEN-006: clic pre-hidratación en SelectBranch — estado de carga
           visible hasta que la hidratación abra el diálogo. La clase vive en
           <html> (fuera del DOM que Vue hidrata) para no crear un mismatch. */
        html.sb-prehydrate-wait [data-select-branch-prehydrate] {
          opacity: 0.65;
          cursor: progress;
          position: relative;
        }
        html.sb-prehydrate-wait [data-select-branch-prehydrate]::after {
          content: "";
          position: absolute;
          right: 2.75rem;
          top: 50%;
          width: 1.1rem;
          height: 1.1rem;
          margin-top: -0.55rem;
          border: 2px solid #9ca3af;
          border-top-color: #dc2626;
          border-radius: 9999px;
          animation: sb-spin 0.7s linear infinite;
        }
        @keyframes sb-spin { to { transform: rotate(360deg); } }
      `,
    },
  ],
  script: [
    {
      // SCEN-006: capturador de clics pre-hidratación para SelectBranch.
      // Corre desde el HTML inicial (antes de descargar el bundle): si el
      // usuario toca «Elige una ciudad» antes de que Vue esté vivo, deja
      // constancia y muestra el estado de carga; SelectBranch lo consume en
      // onMounted y abre el diálogo. Nunca un clic tragado en silencio.
      key: 'sb-prehydrate-capture',
      tagPosition: 'head',
      innerHTML: `(function(){
        document.addEventListener('click', function (event) {
          if (window.__sbHydrated) return;
          var target = event.target && event.target.closest
            ? event.target.closest('[data-select-branch-prehydrate]')
            : null;
          if (!target) return;
          window.__sbPendingOpen = true;
          document.documentElement.classList.add('sb-prehydrate-wait');
          // Watchdog: si la hidratación nunca llega (chunk caído, error de
          // runtime), retirar el estado de carga a los 15 s — un spinner
          // infinito miente peor que un control inerte.
          setTimeout(function () {
            if (!window.__sbHydrated) {
              window.__sbPendingOpen = false;
              document.documentElement.classList.remove('sb-prehydrate-wait');
            }
          }, 15000);
        }, true);
      })();`,
    },
  ],
});
</script>