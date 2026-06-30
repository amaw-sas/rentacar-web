<template>
  <div class="bg-white min-h-screen">
    <!-- Header -->
    <div class="text-center pt-9 pb-3 px-6 md:pt-12">
      <h1 class="text-2xl md:text-3xl font-extrabold uppercase text-[#0B1A2E]">
        Tarifas <span class="text-red-600">Mensuales</span>
      </h1>
      <span v-if="tariffs.period" class="inline-block mt-2 text-gray-500 text-sm">
        {{ tariffs.period.label }}
      </span>
    </div>

    <!-- Intro -->
    <p class="max-w-[700px] mx-auto text-center text-gray-600 text-sm leading-relaxed px-6 mt-4">
      Arriendos mensuales para persona natural. Todas las tarifas incluyen IVA, seguro de protección y mantenimiento preventivo.
    </p>

    <!-- Season toggle -->
    <div class="flex justify-center gap-1 mx-auto mt-5 mb-3 bg-gray-200 rounded-[10px] p-1 w-fit">
      <button
        :class="[
          'px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
          activeSeason === 'baja'
            ? 'bg-green-700 text-white shadow-[0_3px_10px_rgba(21,128,61,0.3)]'
            : 'bg-transparent text-gray-400'
        ]"
        @click="activeSeason = 'baja'"
      >
        Temporada baja
      </button>
      <button
        :class="[
          'px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
          activeSeason === 'alta'
            ? 'bg-green-700 text-white shadow-[0_3px_10px_rgba(21,128,61,0.3)]'
            : 'bg-transparent text-gray-400'
        ]"
        @click="activeSeason = 'alta'"
      >
        Temporada alta
      </button>
    </div>

    <!-- Plan toggle -->
    <div class="flex justify-center gap-1 mx-auto mb-2 bg-gray-200 rounded-[10px] p-1 w-fit">
      <button
        :class="[
          'px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
          activePlan === '1k'
            ? 'bg-green-700 text-white shadow-[0_3px_10px_rgba(21,128,61,0.3)]'
            : 'bg-transparent text-gray-400'
        ]"
        @click="activePlan = '1k'"
      >
        1.000 kms
      </button>
      <button
        :class="[
          'px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
          activePlan === '2k'
            ? 'bg-green-700 text-white shadow-[0_3px_10px_rgba(21,128,61,0.3)]'
            : 'bg-transparent text-gray-400'
        ]"
        @click="activePlan = '2k'"
      >
        2.000 kms
      </button>
    </div>

    <!-- Season hint: which months each season covers -->
    <p class="text-center text-[0.72rem] text-gray-500 mb-4 px-6">
      {{ activeSeason === 'alta' ? 'Temporada alta: junio, julio, octubre y diciembre.' : 'Temporada baja: agosto, septiembre y noviembre.' }}
    </p>

    <!-- Table: 3 columns (photo · gama text · prices) -->
    <div v-if="tariffs.gamas.length > 0" class="max-w-[900px] mx-auto px-5 pb-6">
      <div class="rounded-xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] divide-y divide-gray-100">
        <div
          v-for="gama in tariffs.gamas"
          :key="gama.code"
          class="grid grid-cols-[96px_1fr_auto] sm:grid-cols-[140px_1fr_auto] items-stretch"
        >
          <!-- Col 1: photo -->
          <div class="relative bg-[#0B1A2E] overflow-hidden min-h-[68px]">
            <NuxtImg
              v-if="gama.image"
              :src="gama.image"
              :alt="gama.name"
              width="400"
              height="240"
              sizes="140px"
              loading="lazy"
              decoding="async"
              class="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <!-- Col 2: gama code + name (can wrap to several lines) -->
          <div class="flex flex-col justify-center px-3 sm:px-4 py-3">
            <span class="font-bold text-[0.95rem] leading-tight text-gray-900">{{ gama.code }}</span>
            <span class="text-[0.8rem] text-gray-700 font-medium leading-snug">{{ gama.name }}</span>
          </div>
          <!-- Col 3: day + month price, reacts to plan toggle -->
          <div class="flex flex-col justify-center px-3 sm:px-4 py-3 text-right">
            <div class="font-extrabold text-[1.05rem] text-[#0B1A2E] whitespace-nowrap">
              {{ formatCOP(planData(gama).daily) }}<span class="text-[0.7rem] font-medium text-gray-500"> /día</span>
            </div>
            <div class="text-gray-600 text-[0.85rem] font-medium whitespace-nowrap">
              {{ formatCOP(planData(gama).monthly) }}<span class="text-[0.7rem]"> /mes</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Km extra note (out of rows; values vary by category) -->
      <p v-if="kmExtraGroups.length" class="mt-4 text-center text-xs text-gray-500 leading-relaxed">
        <span class="font-semibold text-gray-600">Km adicional</span> —
        <span v-for="(grp, i) in kmExtraGroups" :key="grp.km">
          {{ grp.types.join(', ') }}: {{ formatCOP(grp.km) }}<span v-if="i < kmExtraGroups.length - 1"> · </span>
        </span>
      </p>
    </div>

    <!-- Empty state when pricing is unavailable -->
    <div v-else class="max-w-[700px] mx-auto px-5 pb-10">
      <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-6 text-center text-gray-600">
        <p class="font-semibold mb-1 text-gray-800">Tarifas temporalmente no disponibles</p>
        <p class="text-sm">Estamos actualizando las tarifas mensuales. Vuelve a intentarlo en unos minutos o cotiza directamente con un asesor.</p>
      </div>
    </div>

    <!-- CTA: branch selector for monthly rental -->
    <div class="max-w-[440px] mx-auto px-5 pb-10">
      <p class="text-center text-black text-lg font-bold mb-3">
        Cotiza tu arriendo mensual
      </p>
      <SelectBranch variant="gray" :rental-days="30" />
    </div>

    <!-- FAQs -->
    <section class="bg-gray-100 py-10 px-4">
      <div class="max-w-[700px] mx-auto">
        <h2 class="text-2xl md:text-3xl font-bold text-center mb-6">
          <span class="text-red-700">Preguntas frecuentes</span> <span class="text-black">sobre mensualidades</span>
        </h2>
        <UAccordion :items="faqs" :ui="faqUI" class="space-y-2">
          <template #default="{ item }">
            <span class="block text-base font-medium text-gray-800 px-4" v-text="item.label" />
          </template>
          <template #content="{ item }">
            <span class="block text-base text-gray-600 py-3 bg-gray-50 px-4 rounded-lg" v-text="item.content" />
          </template>
        </UAccordion>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import useTariffs, { type TariffGama } from '@rentacar-main/logic/composables/useTariffs';

const { franchise } = useAppConfig();

const tariffs = useTariffs();

const activePlan = ref<'1k' | '2k'>('1k');

// Default the season toggle to whichever season is in effect this month, so the
// first view matches what a customer would actually pay now. gama.plan1k holds
// the current-month price; compare it to the season levels.
function detectCurrentSeason(): 'baja' | 'alta' {
  const g = tariffs.gamas[0];
  if (!g) return 'alta';
  return g.plan1k.monthly >= g.seasons.alta.plan1k.monthly ? 'alta' : 'baja';
}
const activeSeason = ref<'baja' | 'alta'>(detectCurrentSeason());

function planData(gama: TariffGama) {
  const season = gama.seasons[activeSeason.value];
  return activePlan.value === '1k' ? season.plan1k : season.plan2k;
}

function formatCOP(value: number): string {
  return '$ ' + value.toLocaleString('es-CO');
}

// Km extra varies per category (e.g. $700 económicos/sedanes, $900 camionetas,
// $1.100 SUV). Group gamas by their kmExtra and label each group by vehicle type
// (first word of gama.name) so the footnote stays correct if the DB changes.
const kmExtraGroups = computed(() => {
  const byKm = new Map<number, Set<string>>();
  for (const gama of tariffs.gamas) {
    if (gama.kmExtra === null) continue;
    const type = gama.name.split(' ')[0] || gama.name;
    if (!byKm.has(gama.kmExtra)) byKm.set(gama.kmExtra, new Set());
    byKm.get(gama.kmExtra)!.add(type);
  }
  return [...byKm.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([km, types]) => ({ km, types: [...types] }));
});

const minMonthly = computed(() => {
  if (tariffs.gamas.length === 0) return null;
  // "desde" = the lowest possible = temporada baja, plan 1.000 kms.
  return Math.min(...tariffs.gamas.map((g) => g.seasons.baja.plan1k.monthly));
});

const faqs = [
  {
    label: '¿Qué documentos necesito para un arriendo mensual?',
    content: 'Necesitas licencia de conducción vigente, tarjeta de crédito a nombre del conductor con cupo disponible, y ser mayor de 18 años. La tarjeta de crédito es obligatoria para el depósito de garantía.',
  },
  {
    label: '¿Qué tipo de seguro incluye la tarifa?',
    content: 'Todas las tarifas incluyen seguro básico contra daños y robo con deducible. El seguro cubre daños al vehículo por accidente y pérdida total. No cubre accesorios removibles (radio, espejos, copas) ni multas de tránsito.',
  },
  {
    label: '¿Qué pasa si me paso del kilometraje contratado?',
    content: 'Se cobra un recargo por cada kilómetro adicional según la gama del vehículo. Puedes ver la tarifa de km extra en la tabla de arriba. También puedes contratar el plan de 2.000 kms si necesitas recorrer más distancia.',
  },
  {
    label: '¿Qué pasa si necesito el vehículo por más de 30 días?',
    content: 'Cada reserva cubre un período máximo de 30 días. Si necesitas más tiempo, puedes hacer reservas adicionales. Por ejemplo, para 45 días puedes hacer una reserva mensual (30 días) y otra por los 15 días restantes, eligiendo tarifa diaria o mensual según te convenga más.',
  },
  {
    label: '¿Puedo renovar mi arriendo mensual?',
    content: 'Sí, al finalizar tu período de 30 días puedes hacer una nueva reserva por otro mes completo o por los días adicionales que necesites.',
  },
  {
    label: '¿Puedo cancelar o devolver antes el vehículo?',
    content: 'Sí, puedes devolver el vehículo antes de la fecha pactada. Ten en cuenta que la tarifa mensual corresponde al período completo de 30 días y no aplican reembolsos por días no utilizados.',
  },
];

const faqUI = {
  item: 'bg-white rounded-lg mb-2 px-2 pb-2 !border-0 !border-b-0',
  body: '!border-none',
  trailingIcon: 'mr-2 transition-transform duration-200',
};

useHead({
  title: 'Tarifas Mensuales Alquiler de Carros',
  link: [
    { rel: 'canonical', href: `${franchise.website}/tarifas` },
  ],
});

const minMonthlyText = computed(() =>
  minMonthly.value !== null ? `$${minMonthly.value.toLocaleString('es-CO')}` : 'precios competitivos'
);
const categoryCount = computed(() => tariffs.gamas.length);

useSeoMeta({
  description: () => `Tarifas mensuales para alquiler de carros en Colombia desde ${minMonthlyText.value}/mes. Planes de 1.000 y 2.000 kms con IVA y seguro incluidos.`,
  ogTitle: 'Tarifas Mensuales Alquiler de Carros | Alquilatucarro',
  ogDescription: () => `Arriendos mensuales desde ${minMonthlyText.value}/mes. Compara precios de ${categoryCount.value} categorías de vehículos.`,
});
</script>
