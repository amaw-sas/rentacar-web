<script setup lang="ts">
definePageMeta({
  layout: 'seo',
  middleware: ['seo-auth']
})

const { data: keywordsData, pending, error } = await useFetch('/api/seo/keywords', {
  key: 'seo-keywords',
  default: () => null
})

// Debug: log data state on client
if (import.meta.client) {
  console.log('[SEO Keywords] Data loaded:', {
    hasData: !!keywordsData.value,
    pending: pending.value,
    error: error.value
  })
}

// Tracked keywords
const trackedKeywords = computed(() => keywordsData.value?.tracked || [])

// Target keywords (opportunities)
const targetKeywords = computed(() => keywordsData.value?.targets || [])

// Position distribution
const distribution = computed(() => keywordsData.value?.distribution || {
  top3: 0,
  top10: 0,
  top20: 0,
  top50: 0,
  beyond50: 0
})

// Total keywords
const totalKeywords = computed(() => {
  const d = distribution.value
  return d.top3 + d.top10 + d.top20 + d.top50 + d.beyond50
})

// Get position change indicator
const getPositionChange = (current: number, previous: number | null) => {
  if (previous === null) return { change: 0, icon: 'i-heroicons-minus', color: 'gray' }
  const change = previous - current // positive = improved (lower position is better)
  if (change > 0) return { change, icon: 'i-heroicons-arrow-up', color: 'green' }
  if (change < 0) return { change: Math.abs(change), icon: 'i-heroicons-arrow-down', color: 'red' }
  return { change: 0, icon: 'i-heroicons-minus', color: 'gray' }
}

// Get position color
const getPositionColor = (position: number) => {
  if (position <= 3) return 'text-green-400'
  if (position <= 10) return 'text-emerald-400'
  if (position <= 20) return 'text-yellow-400'
  if (position <= 50) return 'text-orange-400'
  return 'text-red-400'
}

// Get difficulty color
const getDifficultyColor = (difficulty: number | null) => {
  if (difficulty === null) return 'text-gray-500'
  if (difficulty <= 30) return 'text-green-400'
  if (difficulty <= 50) return 'text-yellow-400'
  if (difficulty <= 70) return 'text-orange-400'
  return 'text-red-400'
}

// Status config
const statusConfig: Record<string, { label: string; color: string }> = {
  planned: { label: 'Planeado', color: 'bg-blue-900 text-blue-300' },
  'in-progress': { label: 'En Progreso', color: 'bg-yellow-900 text-yellow-300' },
  live: { label: 'Activo', color: 'bg-green-900 text-green-300' }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Keywords</h1>
        <p class="text-gray-400 text-sm mt-1">
          Última actualización: {{ keywordsData?.lastUpdated || 'N/A' }}
        </p>
      </div>
      <SeoExportButton
        v-if="keywordsData"
        :data="keywordsData"
        filename="keywords-report"
        label="Exportar"
      />
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <template v-else>
      <!-- Distribution Cards -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 class="text-lg font-semibold text-white mb-4">Distribución de Posiciones</h2>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="text-center p-4 rounded-lg bg-green-900/20 border border-green-800">
            <p class="text-3xl font-bold text-green-400">{{ distribution.top3 }}</p>
            <p class="text-sm text-gray-400">Top 3</p>
          </div>
          <div class="text-center p-4 rounded-lg bg-emerald-900/20 border border-emerald-800">
            <p class="text-3xl font-bold text-emerald-400">{{ distribution.top10 }}</p>
            <p class="text-sm text-gray-400">Top 10</p>
          </div>
          <div class="text-center p-4 rounded-lg bg-yellow-900/20 border border-yellow-800">
            <p class="text-3xl font-bold text-yellow-400">{{ distribution.top20 }}</p>
            <p class="text-sm text-gray-400">Top 20</p>
          </div>
          <div class="text-center p-4 rounded-lg bg-orange-900/20 border border-orange-800">
            <p class="text-3xl font-bold text-orange-400">{{ distribution.top50 }}</p>
            <p class="text-sm text-gray-400">Top 50</p>
          </div>
          <div class="text-center p-4 rounded-lg bg-red-900/20 border border-red-800">
            <p class="text-3xl font-bold text-red-400">{{ distribution.beyond50 }}</p>
            <p class="text-sm text-gray-400">+50</p>
          </div>
        </div>
        <p class="text-center text-gray-500 text-sm mt-4">
          Total: {{ totalKeywords }} keywords trackeadas
        </p>
      </div>

      <!-- Tracked Keywords Table -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-700">
          <h2 class="text-lg font-semibold text-white">Keywords Trackeadas</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-750">
              <tr class="text-left text-sm text-gray-400">
                <th class="px-6 py-3">Keyword</th>
                <th class="px-6 py-3">Posición</th>
                <th class="px-6 py-3">Cambio</th>
                <th class="px-6 py-3">Volumen</th>
                <th class="px-6 py-3">Dificultad</th>
                <th class="px-6 py-3">URL</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              <tr
                v-for="kw in trackedKeywords"
                :key="kw.keyword"
                class="text-sm"
              >
                <td class="px-6 py-4">
                  <span class="text-white font-medium">{{ kw.keyword }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-xl font-bold" :class="getPositionColor(kw.position)">
                    {{ kw.position }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-1">
                    <UIcon
                      :name="getPositionChange(kw.position, kw.previousPosition).icon"
                      class="w-4 h-4"
                      :class="{
                        'text-green-400': getPositionChange(kw.position, kw.previousPosition).color === 'green',
                        'text-red-400': getPositionChange(kw.position, kw.previousPosition).color === 'red',
                        'text-gray-400': getPositionChange(kw.position, kw.previousPosition).color === 'gray'
                      }"
                    />
                    <span
                      v-if="getPositionChange(kw.position, kw.previousPosition).change !== 0"
                      :class="{
                        'text-green-400': getPositionChange(kw.position, kw.previousPosition).color === 'green',
                        'text-red-400': getPositionChange(kw.position, kw.previousPosition).color === 'red'
                      }"
                    >
                      {{ getPositionChange(kw.position, kw.previousPosition).change }}
                    </span>
                    <span v-else class="text-gray-500">-</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-gray-300">
                  {{ kw.volume?.toLocaleString() || '-' }}
                </td>
                <td class="px-6 py-4">
                  <span :class="getDifficultyColor(kw.difficulty)">
                    {{ kw.difficulty || '-' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <a
                    :href="`https://alquilatucarro.com${kw.url}`"
                    target="_blank"
                    class="text-blue-400 hover:underline truncate block max-w-[200px]"
                  >
                    {{ kw.url }}
                  </a>
                </td>
              </tr>
              <tr v-if="trackedKeywords.length === 0">
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                  No hay keywords trackeadas
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Target Keywords (Opportunities) -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
          <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-yellow-400" />
          <h2 class="text-lg font-semibold text-white">Oportunidades de Keywords</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-750">
              <tr class="text-left text-sm text-gray-400">
                <th class="px-6 py-3">Keyword</th>
                <th class="px-6 py-3">Volumen</th>
                <th class="px-6 py-3">Dificultad</th>
                <th class="px-6 py-3">URL Sugerida</th>
                <th class="px-6 py-3">Estado</th>
                <th class="px-6 py-3">Notas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              <tr
                v-for="kw in targetKeywords"
                :key="kw.keyword"
                class="text-sm"
              >
                <td class="px-6 py-4">
                  <span class="text-white font-medium">{{ kw.keyword }}</span>
                </td>
                <td class="px-6 py-4 text-gray-300">
                  {{ kw.volume?.toLocaleString() || '-' }}
                </td>
                <td class="px-6 py-4">
                  <span :class="getDifficultyColor(kw.difficulty)">
                    {{ kw.difficulty || 'N/A' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-blue-400">
                  {{ kw.suggestedUrl }}
                </td>
                <td class="px-6 py-4">
                  <span
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="statusConfig[kw.status]?.color || 'bg-gray-700 text-gray-300'"
                  >
                    {{ statusConfig[kw.status]?.label || kw.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-gray-400 text-sm max-w-[200px] truncate">
                  {{ kw.notes || '-' }}
                </td>
              </tr>
              <tr v-if="targetKeywords.length === 0">
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                  No hay oportunidades de keywords registradas
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
