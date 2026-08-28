<template>
  <!--
    FleetCard — presentación de una card estática de flota (catálogo de
    marketing), extraída de Fleet.vue. Recibe `card` (categoría + precios reales
    ya resueltos) y `plan` (diario/mensual). NO contiene lógica de datos: el
    orquestador (Fleet.vue) provee precios reales fail-soft.

    Jerarquía (mockup card-estatica): badge de categoría superpuesto sobre la
    imagen, modelos como título, precio prominente de marca, specs en chips,
    CTA full-width que enlaza directo a /reservas (wizard Paso 1 — Búsqueda).

    Color de marca: #ef9600 = bg-brand-600. Tailwind 4: usar bg-linear-to-*,
    nunca el alias roto v3 (que con tokens @theme renderiza background-image:none).
  -->
  <div
    class="group relative isolate overflow-hidden rounded-2xl shadow-sm ring-1 ring-white/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg min-h-[420px] sm:aspect-[326/196] sm:min-h-0"
  >
    <!-- Capa 1 · foto a sangre. object-left mantiene el carro fuera de la columna de texto. -->
    <NuxtImg
      :src="card.image"
      :alt="card.alt"
      width="760"
      height="380"
      sizes="100vw md:50vw lg:520px"
      loading="lazy"
      decoding="async"
      class="absolute inset-0 -z-20 h-full w-full object-cover object-[18%_45%] sm:object-center transition-transform duration-300 group-hover:scale-105"
    />

    <!-- Capa 2 · el velo va pegado al texto, no a un porcentaje de la tarjeta.
         Cada bloque de contenido lleva su propio degradado, así cubre exactamente
         lo que hay debajo por alto que sea el texto. El centro queda limpio.
         Es esto y no la foto lo que sostiene el contraste: medido, no estimado. -->

    <!-- Contenido · arriba la identidad, abajo lo comercial. El centro queda
         libre para que se vea el carro completo. -->
    <div class="relative flex h-full min-h-[inherit] flex-col justify-between gap-6">
      <div class="bg-[linear-gradient(to_bottom,rgba(0,0,0,.726)_0%,rgba(0,0,0,.711)_38%,rgba(0,0,0,.662)_50%,rgba(0,0,0,.568)_60%,rgba(0,0,0,.443)_69%,rgba(0,0,0,.316)_77%,rgba(0,0,0,.198)_85%,rgba(0,0,0,.102)_91%,rgba(0,0,0,.039)_96%,rgba(0,0,0,.000)_100%)] px-5 pt-5 pb-14">
        <div class="sm:flex sm:items-center sm:gap-3">
          <span
            class="inline-block shrink-0 text-[17px] font-bold text-brand-300"
          >
            {{ card.title }} - {{ card.transmission }}
          </span>
          <h3
            class="mt-2.5 min-w-0 truncate font-heading text-sm leading-snug font-normal text-white sm:mt-0"
            :title="`${card.example} o similar`"
          >
            {{ card.example }} o similar
          </h3>
        </div>
      </div>

      <div class="flex items-end justify-between gap-4 bg-[linear-gradient(to_top,rgba(0,0,0,.750)_0%,rgba(0,0,0,.742)_44%,rgba(0,0,0,.726)_52%,rgba(0,0,0,.679)_60%,rgba(0,0,0,.593)_68%,rgba(0,0,0,.473)_75%,rgba(0,0,0,.346)_82%,rgba(0,0,0,.221)_88%,rgba(0,0,0,.118)_93%,rgba(0,0,0,.048)_97%,rgba(0,0,0,.000)_100%)] px-5 pt-12 pb-5">
        <!-- MAQUETA · precio de la ventana activa -->
        <div class="min-w-0">
          <p class="font-heading text-sm font-semibold tracking-wider text-brand-300 uppercase">
            <span class="font-bold text-white">
              {{ ventana.dias }} {{ ventana.dias === 1 ? 'día' : 'días' }}
            </span>
            · {{ ventana.etiqueta ?? ventana.label }}
          </p>
          <p class="mt-0.5 text-sm text-white/75 tabular-nums">{{ ventana.when }}</p>

          <template v-if="!mockAgotado">
            <p class="mt-1 flex items-baseline gap-2">
              <span class="font-heading text-2xl font-extrabold tabular-nums text-white">
                ${{ moneyFormat(mockDia * ventana.dias) }}
              </span>
              <span class="shrink-0 text-sm font-medium text-emerald-300">IVA incluido</span>
            </p>
            <p v-if="ventana.dias > 1" class="mt-0.5 text-sm text-white/80 tabular-nums">
              ${{ moneyFormat(mockDia) }} por día
            </p>
          </template>

          <template v-else>
            <p class="mt-1 inline-flex items-center rounded-lg bg-rose-950/70 px-3 py-1.5 ring-1 ring-rose-300/50">
              <span class="font-heading text-base font-bold text-rose-200">Agotado en Bogotá</span>
            </p>
            <p class="mt-1 text-sm text-white/80 tabular-nums">
              <s class="text-white/50">${{ moneyFormat(mockDia * ventana.dias) }}</s> ·
              para el <b class="text-white">puente del 12 de octubre</b> quedan
            </p>
          </template>
        </div>

        <!-- CTA. Sigue siendo un <a> SSR (UButton `to`) para evitar la trampa del
             primer-tap perdido de una isla lazy-hidratada. -->
        <UButton
          to="/reservas"
          data-testid="fleet-card-cta-test"
          class="shrink-0 rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-gray-900 uppercase transition-colors hover:bg-brand-700"
        >
          Ver más
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Card = {
  code: string
  title: string
  transmission: string
  example: string
  description: string
  passengers: number
  luggage: number
  image: string
  alt: string
  dailyPrice?: number
  monthlyPrice?: number
}

const props = defineProps<{
  card: Card
  plan: string
  ventana: { label: string; etiqueta?: string; when: string; dias: number; festivos?: string[] }
}>()

// MAQUETA — precio de la ventana «fin de semana» por gama, y una tarjeta agotada
// para enseñar el estado. En el sistema real esto viene de la cotización congelada.
const MOCK_DIA: Record<string, number> = {
  Compacto: 186700,
  'Sedán': 201300,
  Camioneta: 268400,
  'Camioneta Premium': 396800,
}
const ventana = computed(() => props.ventana)
/** Días largos salen más baratos por día — medido: 1d 158k · 3d 143k · 7d 138k. */
const FACTOR: Record<number, number> = { 1: 1.111, 2: 1.071, 3: 1, 4: 0.995, 5: 0.99, 7: 0.966 }
const mockDia = computed(() =>
  Math.round(
    ((MOCK_DIA[props.card.title] ?? 186700) * (FACTOR[ventana.value.dias] ?? 1)) / 100,
  ) * 100,
)
const mockAgotado = computed(
  () => props.card.title === 'Sedán' && props.card.transmission === 'Automática',
)

// Auto-imported layer composable; el card es un objeto plano (no refs), así que
// moneyFormat(card.dailyPrice) opera sobre un number — sin trampa de unwrapping.
const { moneyFormat } = useMoneyFormat()
</script>
