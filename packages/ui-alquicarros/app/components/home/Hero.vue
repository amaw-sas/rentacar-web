<template>
  <!--
    Hero split — portado del satélite alquilercarrosmonteria.com (decisión del
    dueño, 2026-08-11). Sustituye al hero de degradado naranja: foto a sangre +
    overlay, tarjeta de precio flotante a la izquierda, copy a la derecha.

    ESTÁTICO POR DECISIÓN. El hero no consulta Supabase: ni useCityCount() ni
    useFetchRentacarData(). El precio y el número de ciudades son literales. La
    contrapartida es que envejecen en silencio — de ahí la constante fechada de
    abajo y su guarda en __tests__/hero.test.ts.

    Contraste (issue #364 dejó la lección con el degradado naranja: el blanco
    daba 2.20:1). Aquí el texto va sobre fotografía, que es peor caso: lo que
    garantiza AA es el overlay opaco de la capa 2, no la foto. Medido sobre el
    render, no estimado. Si alguien aclara el overlay, vuelve a medirlo.

    LCP: la foto de fondo es el elemento más grande, así que va con preload +
    fetchpriority alto. La sección declara min-height antes de que la imagen
    llegue, de modo que el contenido de abajo no salta (CLS).

    "Km ilimitado" NO aparece aquí a propósito: el precio mostrado es el del plan
    mensual, y ese plan trae 1.000 km/mes (ver FleetCard.vue). El satélite pone
    ese chip junto al precio mensual y se contradice.
  -->
  <section
    id="hero"
    class="relative isolate flex items-center overflow-hidden min-h-[392px] lg:min-h-[420px]"
  >
    <!-- Capa 1 — fotografía de fondo (elemento LCP).
         NuxtImg y no un <img> a pelo: en esta app el cliente reescribe el src
         relativo (espera `/&/images/...`) y un <img> crudo rompe la hidratación.
         El srcset "1w, 2w" que se ve en local es artefacto del proveedor vercel,
         que no existe fuera de Vercel; en producción genera los anchos de
         `image.screens`. `preload` emite el <link rel=preload>. -->
    <NuxtImg
      src="/images/hero/carretera.webp"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 -z-20 h-full w-full object-cover"
      width="1306"
      height="816"
      sizes="100vw"
      preload
      loading="eager"
      fetchpriority="high"
    />

    <!-- Capa 2 — overlay. Es lo que sostiene el contraste AA del texto.
         El gradiente va CLARO→OSCURO de izquierda a derecha, no al revés: la
         mitad izquierda la ocupa una tarjeta blanca que contrasta contra
         cualquier cosa, así que ahí conviene dejar ver la foto; la derecha lleva
         el texto blanco y necesita el negro. Con el gradiente invertido el
         subtítulo se quedaba en 3.07:1 porque el asfalto asomaba justo debajo. -->
    <div
      class="absolute inset-0 -z-10 bg-linear-to-r from-black/55 via-black/70 to-black/85"
      aria-hidden="true"
    />

    <div class="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <div class="max-w-2xl">
        <!-- Copy + CTAs + chips -->
        <div class="text-center lg:text-left">
          <p class="font-heading text-sm font-semibold tracking-widest text-brand-300 uppercase">
            Alquiler de carros
          </p>
          <h1
            class="mt-3 font-heading text-3xl leading-[1.1] font-extrabold text-white sm:text-4xl xl:text-5xl"
          >
            Alquiler de Carros en Colombia al Mejor Precio
          </h1>
          <p class="mt-4 max-w-2xl text-base text-white/90 md:text-lg">
            Sin anticipos, sin fila. Flota con menos de 2 años y mantenimiento incluido. Reserva
            por WhatsApp en {{ CITY_COUNT }} ciudades.
          </p>

          <ul
            class="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start"
            aria-label="Condiciones de la reserva"
          >
            <li
              v-for="chip in TRUST_CHIPS"
              :key="chip"
              class="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/25"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-brand-300"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {{ chip }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { franchise } = useAppConfig()

// La foto de fondo es el LCP: se pide antes de que el parser llegue al <img>.
useHead({
  link: [{ rel: 'preload', as: 'image', href: '/images/hero/carretera.webp', fetchpriority: 'high' }],
})

/**
 * Tarifa mensual (plan de 1.000 km) activa más barata de la Gama C, en COP.
 *
 * Fuente: `category_pricing`, leída el 2026-08-11 con la misma regla que aplica
 * Fleet.vue en la pestaña "Mensualidad" (`pickRepresentativeMonthlyPrice`: la
 * `1k_kms` activa positiva más barata). Se congela aquí porque el dueño quiso el
 * hero sin consultas.
 *
 * Cuando cambien las tarifas este número miente. El despertador es
 * `node scripts/check-hero-pricing.mjs`, que lo compara contra los datos reales.
 */
const MONTHLY_1K_KMS_COP = 3_806_000

/** Días del plan mensual — el divisor que convierte la mensualidad en tarifa diaria. */
const MONTHLY_PLAN_DAYS = 30

const CATEGORY_BADGE = 'Económico'
const CATEGORY_NAME = 'Gama C Compacto Mecánico'

/** Ciudades activas al 2026-08-11. Literal: el hero no consulta el conteo en vivo. */
const CITY_COUNT = 19

/** MAQUETA — cotizaciones reales congeladas. Las fechas las calcula la regla del bloque. */
const SLOTS = [
  { k: 'Hoy', when: 'mié 26 ago · 1 día', price: '$207.400', hot: false },
  { k: 'Fin de semana', when: 'vie 28 → lun 31 ago · 3 días', price: '$186.700', hot: true },
  { k: 'Una semana', when: 'mié 26 ago → mié 2 sep · 7 días', price: '$180.400', hot: false },
] as const

const TRUST_CHIPS = [
  'Paga al recoger',
  'Sin pago anticipado',
  'Vehículos nuevos',
] as const

/**
 * Miles con punto, al estilo colombiano, sin depender de Intl: SSR y cliente
 * tienen que producir el mismo string o la hidratación se queja.
 */
function formatCop(value: number): string {
  return `$${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

// Se redondea al alza (126.866,67 -> 126.867) para no anunciar menos de lo que se cobra.
const dailyPriceLabel = formatCop(Math.ceil(MONTHLY_1K_KMS_COP / MONTHLY_PLAN_DAYS))
</script>
