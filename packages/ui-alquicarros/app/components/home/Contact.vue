<template>
  <!--
    contact — CTA "Reserva tu Carro Hoy". Rediseño "doble ruta": en vez de la
    banda full-bleed con SUV (heredada del port de la marca hermana), la sección
    ofrece dos tiles de acción parejos sobre fondo crema, uno por CTA. Diferencia
    visual de marca sin cambiar el tono (cierre-CTA, NO formulario). Conserva los
    links reales:
      - "Reserva Ahora" → motor interno; el destino es configurable por página
        host vía reserveAnchor (home: #hero / city results: #searcher /
        city landing: /reservas ruta / página reservas: #hero). Se bindea
        VERBATIM → funciona igual para ancla in-page y para ruta completa.
      - WhatsApp → franchise.whatsapp (URL completa, jamás re-envuelta).
    Iconografía: UIcon lucide, alineada a ValueProps. Botón WhatsApp = bg-[#090]
    (único verde legítimo de marca). El conteo de ciudades sale de useCityCount.
  -->
  <section
    id="contact"
    class="py-16 md:py-24 bg-linear-to-b from-[#fff7ee] to-[#fdeede] [--ctx-text-primary:#7c2d12]"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Encabezado centrado -->
      <div class="text-center mb-10 md:mb-12">
        <div class="h-1 w-10 rounded-full bg-brand-600 mx-auto mb-4" aria-hidden="true" />
        <h2 class="font-heading text-3xl md:text-4xl font-extrabold text-brand-900">
          Reserva tu Carro Hoy
        </h2>
        <p class="mt-3 text-base md:text-lg text-brand-900/70">
          Sin anticipos. Sin cargos ocultos. Cancela gratis hasta 24 horas antes.
        </p>
      </div>

      <!-- Dos rutas de acción -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
        <!-- Ruta 1: reserva online → motor interno -->
        <div
          class="rounded-2xl p-7 md:p-8 text-center text-white shadow-[0_16px_34px_rgba(124,45,18,0.28)] flex flex-col items-center"
          :style="onlineTileStyle"
        >
          <div class="w-14 h-14 rounded-2xl bg-white/18 flex items-center justify-center mb-4">
            <UIcon name="i-lucide-car" class="size-7" aria-hidden="true" />
          </div>
          <h3 class="font-heading text-lg font-bold">Reserva online</h3>
          <p class="mt-1.5 mb-6 text-sm text-white/85">
            Cotiza y confirma en 2 minutos, sin llamadas.
          </p>
          <a
            :href="reserveAnchor"
            data-testid="contact-reserve-test"
            class="mt-auto w-full inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-full bg-white text-brand-700 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Reserva Ahora
          </a>
        </div>

        <!-- Ruta 2: hablar con un asesor → WhatsApp (franchise.whatsapp verbatim) -->
        <div
          class="rounded-2xl p-7 md:p-8 text-center bg-white border border-[#f0e0cf] shadow-[0_16px_34px_rgba(124,45,18,0.10)] flex flex-col items-center"
        >
          <div class="w-14 h-14 rounded-2xl bg-[#e9f9ec] text-[#090] flex items-center justify-center mb-4">
            <UIcon name="i-lucide-message-circle" class="size-7" aria-hidden="true" />
          </div>
          <h3 class="font-heading text-lg font-bold text-gray-900">¿Prefieres hablar?</h3>
          <p class="mt-1.5 mb-6 text-sm text-gray-500">
            Un asesor te ayuda a elegir y reservar al instante.
          </p>
          <a
            :href="franchise.whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Habla con un asesor por WhatsApp"
            data-testid="contact-whatsapp-test"
            class="mt-auto w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded-full bg-[#090] text-white hover:brightness-110 shadow-lg shadow-black/15 hover:shadow-xl transition-all duration-200"
          >
            <WhatsappIcon cls="size-5" />
            Habla con un Asesor
          </a>
        </div>
      </div>

      <!-- Trust badges (fila única, iconos lucide) -->
      <ul class="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
        <li
          v-for="badge in badges"
          :key="badge.label"
          class="flex items-center gap-2 text-sm font-medium text-brand-900/75"
        >
          <UIcon :name="badge.icon" class="size-5 text-brand-600" aria-hidden="true" />
          {{ badge.label }}
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IconsWhatsappIcon as WhatsappIcon } from '#components'

// "Reserva Ahora" target. Default = home's city-selector hero (#hero); hosts may
// pass an in-page anchor (#searcher) or a full route (/reservas). Bound verbatim
// on :href so both anchor and route values work unchanged.
withDefaults(defineProps<{ reserveAnchor?: string }>(), { reserveAnchor: '#hero' })

const { franchise } = useAppConfig()

// Live active-city count → the coverage badge, never a hardcoded number.
const cityCount = useCityCount()

interface Badge {
  icon: string
  label: string
}

// computed so the coverage badge tracks cityCount; the rest is static copy.
const badges = computed<Badge[]>(() => [
  { icon: 'i-lucide-wallet', label: 'Sin anticipos' },
  { icon: 'i-lucide-shield-check', label: 'Cancela gratis 24h' },
  { icon: 'i-lucide-headset', label: 'Soporte 24/7' },
  { icon: 'i-lucide-map-pinned', label: `+${cityCount.value} ciudades` },
])

// Tile A background: warm radial glow over a linear orange→amber-dark base. The
// dark lower stop (#c2410c) keeps the white text/labels above WCAG AA. Radials
// aren't Tailwind utilities → bound inline as a real CSS `linear-gradient`, not
// the broken v3 gradient utility alias.
const onlineTileStyle =
  'background:' +
  'radial-gradient(70% 120% at 50% 0%, rgba(255,146,96,0.55) 0%, rgba(255,107,28,0) 60%),' +
  'linear-gradient(160deg, #ff8a00 0%, #e35d0a 60%, #c2410c 100%);'
</script>
