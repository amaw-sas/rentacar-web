<template>
  <div class="bg-white min-h-screen">
    <!-- Header -->
    <div class="text-center pt-9 pb-3 px-6 md:pt-12">
      <h1 class="text-2xl md:text-3xl font-extrabold uppercase text-[#0B1A2E]">
        Tarifas <span class="text-red-600">Mensuales</span>
      </h1>
      <span class="inline-block mt-2 text-gray-500 text-sm">
        {{ tarifasConfig.period.label }}
      </span>
    </div>

    <!-- Intro -->
    <p class="max-w-[700px] mx-auto text-center text-gray-600 text-sm leading-relaxed px-6 mt-4">
      Arriendos mensuales para persona natural. Todas las tarifas incluyen IVA, seguro de protección y mantenimiento preventivo.
    </p>

    <!-- Plan toggle -->
    <div class="flex justify-center gap-1 mx-auto mt-5 mb-4 bg-gray-200 rounded-[10px] p-1 w-fit">
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

    <!-- Table -->
    <div class="max-w-[900px] mx-auto px-5 pb-10 overflow-x-auto">
      <table class="w-full border-separate border-spacing-0 rounded-xl overflow-hidden text-sm bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
        <thead>
          <tr>
            <th class="bg-gray-50 text-gray-400 text-[0.7rem] font-semibold uppercase tracking-wider px-2.5 sm:px-4 py-3 text-left border-b border-gray-100">Gama</th>
            <th class="bg-gray-50 text-gray-400 text-[0.7rem] font-semibold uppercase tracking-wider px-2.5 sm:px-4 py-3 text-right border-b border-gray-100">Tarifa / día</th>
            <th class="bg-gray-50 text-gray-400 text-[0.7rem] font-semibold uppercase tracking-wider px-2.5 sm:px-4 py-3 text-right border-b border-gray-100">Total mes</th>
            <th class="bg-gray-50 text-gray-400 text-[0.7rem] font-semibold uppercase tracking-wider px-2.5 sm:px-4 py-3 text-center border-b border-gray-100">Km extra</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="gama in tarifasConfig.gamas"
            :key="gama.code"
            class="transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
          >
            <!-- Gama -->
            <td class="px-2.5 sm:px-4 py-3 align-middle">
              <div class="flex items-center gap-2.5">
                <span
                  class="w-2 h-2 rounded-full shrink-0"
                  :class="tierDotClass(gama.kmExtra)"
                />
                <div>
                  <div class="font-bold text-[0.95rem] text-gray-900">{{ gama.code }}</div>
                  <div class="text-[0.7rem] text-gray-400 font-medium">{{ gama.name }}</div>
                </div>
              </div>
            </td>
            <!-- Tarifa/día -->
            <td class="px-2.5 sm:px-4 py-3 align-middle text-right font-extrabold text-[1.05rem] text-[#0B1A2E] whitespace-nowrap">
              {{ formatCOP(planData(gama).daily) }}
            </td>
            <!-- Total mes -->
            <td class="px-2.5 sm:px-4 py-3 align-middle text-right font-medium text-gray-400 text-[0.85rem] whitespace-nowrap">
              {{ formatCOP(planData(gama).monthly) }}
            </td>
            <!-- Km extra -->
            <td class="px-2.5 sm:px-4 py-3 align-middle text-center">
              <span class="inline-block bg-gray-100 px-2.5 py-0.5 rounded-md text-[0.78rem] font-semibold text-gray-500 whitespace-nowrap">
                {{ formatCOP(gama.kmExtra) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Availability note -->
    <div class="max-w-[900px] mx-auto px-5 pb-6">
      <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900">
        <p class="font-semibold mb-1">Gama GR — Camioneta 7 Puestos</p>
        <p class="text-amber-800 leading-relaxed">
          Sujeta a disponibilidad. Debe solicitarse con anticipación.
          Disponible solo en <strong>Bogotá</strong>, <strong>Cali</strong>, <strong>Cartagena</strong>, <strong>Rionegro</strong> y <strong>Medellín</strong>.
        </p>
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
import { tarifasConfig } from '@rentacar-main/logic/config';
import type { TarifaGama } from '@rentacar-main/logic/config';

const { franchise } = useAppConfig();

const activePlan = ref<'1k' | '2k'>('1k');

function planData(gama: TarifaGama) {
  return activePlan.value === '1k' ? gama.plan1k : gama.plan2k;
}

function formatCOP(value: number): string {
  return '$ ' + value.toLocaleString('es-CO');
}

function tierDotClass(kmExtra: number): string {
  if (kmExtra <= 700) return 'bg-green-500';
  if (kmExtra <= 900) return 'bg-amber-500';
  return 'bg-blue-500';
}

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

useSeoMeta({
  description: `Tarifas mensuales para alquiler de carros en Colombia desde $${tarifasConfig.gamas[0].plan1k.monthly.toLocaleString('es-CO')}/mes. Planes de 1.000 y 2.000 kms con IVA y seguro incluidos.`,
  ogTitle: 'Tarifas Mensuales Alquiler de Carros | Alquilatucarro',
  ogDescription: `Arriendos mensuales desde $${tarifasConfig.gamas[0].plan1k.monthly.toLocaleString('es-CO')}/mes. Compara precios de 12 categorías de vehículos.`,
});
</script>
