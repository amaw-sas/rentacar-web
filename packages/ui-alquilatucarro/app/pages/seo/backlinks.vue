<script setup lang="ts">
definePageMeta({
  layout: 'seo',
  middleware: ['seo-auth']
})

const { data: backlinksData, pending, error } = await useFetch('/api/seo/backlinks', {
  key: 'seo-backlinks',
  default: () => null
})

// Debug: log data state on client
if (import.meta.client) {
  console.log('[SEO Backlinks] Data loaded:', {
    hasData: !!backlinksData.value,
    pending: pending.value,
    error: error.value,
    summary: backlinksData.value?.summary
  })
}

// Filters
const filterType = ref<'all' | 'follow' | 'nofollow'>('all')
const filterDaMin = ref(0)

const filteredBacklinks = computed(() => {
  if (!backlinksData.value?.topBacklinks) return []

  return backlinksData.value.topBacklinks.filter((link: any) => {
    if (filterType.value === 'follow' && !link.follow) return false
    if (filterType.value === 'nofollow' && link.follow) return false
    if (link.pa < filterDaMin.value) return false
    return true
  })
})

const summary = computed(() => backlinksData.value?.summary || {
  totalFollow: 0,
  totalNofollow: 0,
  gained60d: 0,
  lost60d: 0,
  netBalance60d: 0
})

const spamDistribution = computed(() => backlinksData.value?.spamScoreDistribution || {})
const errors404 = computed(() => backlinksData.value?.errors404WithBacklinks || [])
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Backlinks</h1>
        <p class="text-gray-400 text-sm mt-1">
          Última actualización: {{ backlinksData?.lastUpdated || 'N/A' }}
        </p>
      </div>
      <SeoExportButton
        v-if="backlinksData"
        :data="backlinksData"
        filename="backlinks-report"
        label="Exportar"
      />
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p class="text-gray-400 text-sm">Follow</p>
          <p class="text-2xl font-bold text-green-400">{{ summary.totalFollow?.toLocaleString() }}</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p class="text-gray-400 text-sm">Nofollow</p>
          <p class="text-2xl font-bold text-gray-300">{{ summary.totalNofollow?.toLocaleString() }}</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p class="text-gray-400 text-sm">Ganados (60d)</p>
          <p class="text-2xl font-bold text-green-400">+{{ summary.gained60d }}</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p class="text-gray-400 text-sm">Perdidos (60d)</p>
          <p class="text-2xl font-bold text-red-400">-{{ summary.lost60d }}</p>
        </div>
      </div>

      <!-- Net Balance Alert -->
      <div
        v-if="summary.netBalance60d < 0"
        class="flex items-center gap-3 p-4 rounded-lg bg-red-900/30 border border-red-700"
      >
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400" />
        <span class="text-red-300 text-sm">
          Balance neto negativo: {{ summary.netBalance60d }} backlinks en 60 días
        </span>
      </div>

      <!-- Spam Score Distribution -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 class="text-lg font-semibold text-white mb-4">Distribución por Spam Score</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <p class="text-3xl font-bold text-green-400">{{ spamDistribution.low_1_10 || 0 }}</p>
            <p class="text-sm text-gray-400">Bajo (1-10%)</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-yellow-400">{{ spamDistribution.medium_11_30 || 0 }}</p>
            <p class="text-sm text-gray-400">Medio (11-30%)</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-orange-400">{{ spamDistribution.high_31_70 || 0 }}</p>
            <p class="text-sm text-gray-400">Alto (31-70%)</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-red-400">{{ spamDistribution.spam_71_100 || 0 }}</p>
            <p class="text-sm text-gray-400">Spam (71-100%)</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div class="flex flex-wrap items-center gap-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Tipo</label>
            <select
              v-model="filterType"
              class="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="all">Todos</option>
              <option value="follow">Solo Follow</option>
              <option value="nofollow">Solo Nofollow</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">PA Mínimo</label>
            <input
              v-model.number="filterDaMin"
              type="number"
              min="0"
              max="100"
              class="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm w-24"
            />
          </div>
        </div>
      </div>

      <!-- Backlinks Table -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-700">
          <h2 class="text-lg font-semibold text-white">Top Backlinks</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-750">
              <tr class="text-left text-sm text-gray-400">
                <th class="px-6 py-3">Fuente</th>
                <th class="px-6 py-3">Anchor</th>
                <th class="px-6 py-3">PA</th>
                <th class="px-6 py-3">Tipo</th>
                <th class="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              <tr
                v-for="link in filteredBacklinks"
                :key="link.url"
                class="text-sm"
              >
                <td class="px-6 py-4">
                  <a
                    :href="link.url"
                    target="_blank"
                    class="text-blue-400 hover:underline truncate block max-w-xs"
                  >
                    {{ link.url }}
                  </a>
                </td>
                <td class="px-6 py-4 text-gray-300">{{ link.anchorText }}</td>
                <td class="px-6 py-4">
                  <span
                    class="font-medium"
                    :class="{
                      'text-green-400': link.pa >= 40,
                      'text-yellow-400': link.pa >= 20 && link.pa < 40,
                      'text-gray-400': link.pa < 20
                    }"
                  >
                    {{ link.pa }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="link.follow ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'"
                  >
                    {{ link.follow ? 'Follow' : 'Nofollow' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="{
                      'bg-green-900 text-green-300': link.status === 'active',
                      'bg-red-900 text-red-300': link.status === 'lost',
                      'bg-blue-900 text-blue-300': link.status === 'new'
                    }"
                  >
                    {{ link.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredBacklinks.length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                  No hay backlinks que coincidan con los filtros
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 404 Errors with Backlinks -->
      <div v-if="errors404.length > 0" class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
          <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-yellow-400" />
          <h2 class="text-lg font-semibold text-white">URLs 404 con Backlinks</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-750">
              <tr class="text-left text-sm text-gray-400">
                <th class="px-6 py-3">URL</th>
                <th class="px-6 py-3">Linking Domains</th>
                <th class="px-6 py-3">PA</th>
                <th class="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              <tr v-for="error in errors404" :key="error.url" class="text-sm">
                <td class="px-6 py-4 text-gray-300">{{ error.url }}</td>
                <td class="px-6 py-4 text-white font-medium">{{ error.linkingDomains }}</td>
                <td class="px-6 py-4 text-gray-300">{{ error.pa }}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded text-xs font-medium bg-yellow-900 text-yellow-300">
                    {{ error.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
