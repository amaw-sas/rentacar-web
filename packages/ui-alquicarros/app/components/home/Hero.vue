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
    class="relative isolate flex items-center overflow-hidden min-h-[560px] lg:min-h-[600px]"
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
      <div class="grid items-center gap-10 lg:grid-cols-2">
        <!-- Tarjeta de precio flotante -->
        <div class="flex justify-center lg:justify-start">
          <div class="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl shadow-black/40">
            <div class="aspect-4/3 overflow-hidden rounded-xl">
              <!-- NuxtImg como en FleetCard: un <img> a pelo aquí rompía la
                   hidratación (el cliente esperaba el src reescrito y el
                   servidor mandaba el crudo). -->
              <NuxtImg
                src="/images/vehicles/economico.jpg"
                :alt="`${CATEGORY_NAME} para alquilar en Colombia`"
                class="h-full w-full object-cover"
                width="400"
                height="300"
                sizes="100vw lg:400px"
                loading="eager"
                decoding="async"
              />
            </div>
            <p
              class="mt-4 font-heading text-xs font-semibold tracking-widest text-brand-800 uppercase"
            >
              {{ CATEGORY_BADGE }}
            </p>
            <p class="mt-1 font-heading text-lg font-bold text-gray-900">
              {{ CATEGORY_NAME }}
            </p>
            <p class="mt-2 flex items-baseline gap-1.5">
              <span class="text-xs font-medium tracking-wide text-gray-500 uppercase">desde</span>
              <span class="font-heading text-3xl font-extrabold text-gray-900">
                {{ dailyPriceLabel }}/día
              </span>
            </p>
            <p class="mt-1 text-sm text-gray-500">tarifa diaria en plan de 30 días</p>
          </div>
        </div>

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

          <div class="mt-6 flex flex-row items-stretch justify-center gap-3 lg:justify-start">
            <a
              href="#fleet"
              class="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3.5 text-base font-semibold text-on-brand shadow-lg shadow-black/25 transition-all duration-200 hover:bg-brand-500 hover:shadow-xl sm:px-7"
            >
              Ver Precios
            </a>
            <a
              :href="franchise.whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contáctanos por WhatsApp"
              class="inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3.5 text-base font-semibold text-black shadow-lg shadow-black/25 transition-all duration-200 hover:bg-whatsapp-hover hover:shadow-xl sm:px-7"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>

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

const TRUST_CHIPS = [
  'Paga al recoger',
  'Sin pago anticipado',
  'Cancelación gratis',
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
