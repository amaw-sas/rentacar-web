<script setup lang="ts">
definePageMeta({
  layout: 'seo',
  middleware: ['seo-auth']
})

const { data: competitorsData, pending, error } = await useFetch('/api/seo/competitors', {
  key: 'seo-competitors',
  default: () => null
})

// Get us vs competitors
const usData = computed(() => {
  return competitorsData.value?.competitors?.find((c: any) => c.isUs) || null
})

const competitors = computed(() => {
  return competitorsData.value?.competitors?.filter((c: any) => !c.isUs) || []
})

// Threat level colors
const threatColors: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-red-900', text: 'text-red-300' },
  medium: { bg: 'bg-yellow-900', text: 'text-yellow-300' },
  low: { bg: 'bg-green-900', text: 'text-green-300' },
  minimal: { bg: 'bg-gray-700', text: 'text-gray-300' }
}

// Get DA color
const getDaColor = (da: number | null) => {
  if (da === null) return 'text-gray-500'
  if (da >= 50) return 'text-green-400'
  if (da >= 30) return 'text-yellow-400'
  if (da >= 20) return 'text-orange-400'
  return 'text-red-400'
}

// Format number
const formatNumber = (num: number | null) => {
  if (num === null) return '-'
  return num.toLocaleString()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Competidores</h1>
        <p class="text-gray-400 text-sm mt-1">
          Última actualización: {{ competitorsData?.lastUpdated || 'N/A' }}
        </p>
      </div>
      <SeoExportButton
        v-if="competitorsData"
        :data="competitorsData"
        filename="competitors-report"
        label="Exportar"
      />
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <template v-else>
      <!-- Our Site Card -->
      <div v-if="usData" class="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-6 border border-blue-700">
        <div class="flex items-center gap-3 mb-4">
          <UIcon name="i-heroicons-star" class="w-6 h-6 text-yellow-400" />
          <h2 class="text-xl font-bold text-white">{{ usData.domain }}</h2>
          <span class="px-2 py-1 rounded text-xs font-medium bg-blue-700 text-blue-200">
            Nuestro sitio
          </span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="text-center">
            <p class="text-3xl font-bold" :class="getDaColor(usData.da)">{{ usData.da }}</p>
            <p class="text-sm text-gray-400">DA</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-white">{{ formatNumber(usData.totalLinks) }}</p>
            <p class="text-sm text-gray-400">Total Links</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-white">{{ formatNumber(usData.linkingDomains) }}</p>
            <p class="text-sm text-gray-400">Linking Domains</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-green-400">{{ usData.followPercent }}%</p>
            <p class="text-sm text-gray-400">Follow</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-cyan-400">{{ usData.internalLinks }}</p>
            <p class="text-sm text-gray-400">Internal Links</p>
          </div>
        </div>
      </div>

      <!-- Comparison Table -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-700">
          <h2 class="text-lg font-semibold text-white">Comparación de Competidores</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-750">
              <tr class="text-left text-sm text-gray-400">
                <th class="px-6 py-3">Dominio</th>
                <th class="px-6 py-3">DA</th>
                <th class="px-6 py-3">Total Links</th>
                <th class="px-6 py-3">Linking Domains</th>
                <th class="px-6 py-3">Follow %</th>
                <th class="px-6 py-3">Internal Links</th>
                <th class="px-6 py-3">Spam Score</th>
                <th class="px-6 py-3">Amenaza</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              <!-- Our site row -->
              <tr v-if="usData" class="text-sm bg-blue-900/20">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-star" class="w-4 h-4 text-yellow-400" />
                    <span class="text-white font-medium">{{ usData.domain }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-xl font-bold" :class="getDaColor(usData.da)">{{ usData.da }}</span>
                </td>
                <td class="px-6 py-4 text-white">{{ formatNumber(usData.totalLinks) }}</td>
                <td class="px-6 py-4 text-white">{{ formatNumber(usData.linkingDomains) }}</td>
                <td class="px-6 py-4 text-green-400">{{ usData.followPercent || '-' }}%</td>
                <td class="px-6 py-4 text-cyan-400">{{ usData.internalLinks }}</td>
                <td class="px-6 py-4 text-gray-400">{{ usData.spamScore || '-' }}</td>
                <td class="px-6 py-4">-</td>
              </tr>
              <!-- Competitor rows -->
              <tr
                v-for="comp in competitors"
                :key="comp.domain"
                class="text-sm"
              >
                <td class="px-6 py-4 text-white font-medium">{{ comp.domain }}</td>
                <td class="px-6 py-4">
                  <span class="text-xl font-bold" :class="getDaColor(comp.da)">{{ comp.da || '-' }}</span>
                </td>
                <td class="px-6 py-4 text-gray-300">{{ formatNumber(comp.totalLinks) }}</td>
                <td class="px-6 py-4 text-gray-300">{{ formatNumber(comp.linkingDomains) }}</td>
                <td class="px-6 py-4 text-gray-300">{{ comp.followPercent || '-' }}%</td>
                <td class="px-6 py-4 text-gray-300">{{ formatNumber(comp.internalLinks) }}</td>
                <td class="px-6 py-4">
                  <span
                    v-if="comp.spamScore !== null"
                    :class="{
                      'text-green-400': comp.spamScore <= 3,
                      'text-yellow-400': comp.spamScore > 3 && comp.spamScore <= 10,
                      'text-red-400': comp.spamScore > 10
                    }"
                  >
                    {{ comp.spamScore }}%
                  </span>
                  <span v-else class="text-gray-500">-</span>
                </td>
                <td class="px-6 py-4">
                  <span
                    v-if="comp.threatLevel"
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="[threatColors[comp.threatLevel]?.bg, threatColors[comp.threatLevel]?.text]"
                  >
                    {{ comp.threatLevel.toUpperCase() }}
                  </span>
                  <span v-else class="text-gray-500">-</span>
                </td>
              </tr>
              <tr v-if="competitors.length === 0">
                <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                  No hay competidores registrados
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Competitor Notes -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="comp in competitors.filter((c: any) => c.notes)"
          :key="comp.domain"
          class="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div class="flex items-center gap-2 mb-2">
            <span
              v-if="comp.threatLevel"
              class="w-3 h-3 rounded-full"
              :class="{
                'bg-red-500': comp.threatLevel === 'high',
                'bg-yellow-500': comp.threatLevel === 'medium',
                'bg-green-500': comp.threatLevel === 'low',
                'bg-gray-500': comp.threatLevel === 'minimal'
              }"
            />
            <span class="text-white font-medium">{{ comp.domain }}</span>
          </div>
          <p class="text-sm text-gray-400">{{ comp.notes }}</p>
        </div>
      </div>

      <!-- Quick Insights -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 class="text-lg font-semibold text-white mb-4">Insights Rápidos</h2>
        <div class="space-y-3">
          <div v-if="usData" class="flex items-start gap-3">
            <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-yellow-400 mt-0.5" />
            <p class="text-gray-300 text-sm">
              <strong class="text-white">Internal Linking Gap:</strong>
              RentingColombia tiene {{ formatNumber(competitors.find((c: any) => c.domain === 'rentingcolombia.com')?.internalLinks || 0) }} internal links
              vs nuestros {{ usData.internalLinks }}. Priorizar estructura de enlaces internos.
            </p>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-blue-400 mt-0.5" />
            <p class="text-gray-300 text-sm">
              <strong class="text-white">DA Leadership:</strong>
              Lideramos con DA {{ usData?.da || 0 }} vs el competidor más cercano
              ({{ competitors.reduce((max: any, c: any) => (c.da || 0) > (max?.da || 0) ? c : max, { da: 0 })?.domain || 'N/A' }}
              con DA {{ competitors.reduce((max: number, c: any) => Math.max(max, c.da || 0), 0) }}).
            </p>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-link" class="w-5 h-5 text-green-400 mt-0.5" />
            <p class="text-gray-300 text-sm">
              <strong class="text-white">Backlink Volume:</strong>
              RentingColombia tiene 8x más backlinks. Enfocarse en calidad sobre cantidad.
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
