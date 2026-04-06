<script setup lang="ts">
definePageMeta({
  layout: 'seo',
  middleware: ['seo-auth']
})

const { data: contentData, pending, error } = await useFetch('/api/seo/content', {
  key: 'seo-content',
  default: () => null
})

// Internal links
const internalLinks = computed(() => contentData.value?.internalLinks || {
  current: 0,
  goal: 500,
  orphanPages: [],
  opportunities: []
})

// Blog articles
const publishedArticles = computed(() => contentData.value?.blog?.published || [])
const plannedArticles = computed(() => contentData.value?.blog?.planned || [])

// Landing pages pipeline
const landingPages = computed(() => contentData.value?.landingPagesPipeline || [])

// 404 errors
const errors404 = computed(() => contentData.value?.errors404 || [])

// Content freshness
const freshness = computed(() => contentData.value?.contentFreshness || [])

// Get progress percentage
const getProgressPercent = (current: number, goal: number) => {
  if (goal === 0) return 0
  return Math.min(100, Math.round((current / goal) * 100))
}

// Status config for landing pages
const statusConfig: Record<string, { label: string; color: string }> = {
  proposed: { label: 'Propuesto', color: 'bg-blue-900 text-blue-300' },
  'in-progress': { label: 'En Progreso', color: 'bg-yellow-900 text-yellow-300' },
  live: { label: 'Activo', color: 'bg-green-900 text-green-300' }
}

// Article status config
const articleStatusConfig: Record<string, { label: string; color: string }> = {
  idea: { label: 'Idea', color: 'bg-gray-700 text-gray-300' },
  draft: { label: 'Borrador', color: 'bg-yellow-900 text-yellow-300' },
  review: { label: 'Revisión', color: 'bg-blue-900 text-blue-300' },
  scheduled: { label: 'Programado', color: 'bg-purple-900 text-purple-300' }
}

// Freshness status
const freshnessStatusConfig: Record<string, { label: string; color: string }> = {
  fresh: { label: 'Fresco', color: 'bg-green-900 text-green-300' },
  'review-needed': { label: 'Revisar', color: 'bg-yellow-900 text-yellow-300' },
  outdated: { label: 'Desactualizado', color: 'bg-red-900 text-red-300' }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-white">Contenido</h1>
      <p class="text-gray-400 text-sm mt-1">
        Última actualización: {{ contentData?.lastUpdated || 'N/A' }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <template v-else>
      <!-- Internal Links Progress -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-arrows-right-left" class="w-5 h-5 text-cyan-400" />
            <h2 class="text-lg font-semibold text-white">Internal Links</h2>
          </div>
          <span class="text-2xl font-bold text-white">
            {{ internalLinks.current }}/{{ internalLinks.goal }}
          </span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-4 mb-2">
          <div
            class="h-4 rounded-full bg-cyan-500 transition-all duration-500"
            :style="{ width: `${getProgressPercent(internalLinks.current, internalLinks.goal)}%` }"
          />
        </div>
        <p class="text-sm text-gray-400 text-right">
          {{ getProgressPercent(internalLinks.current, internalLinks.goal) }}% del objetivo
        </p>
      </div>

      <!-- Blog Articles -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Published Articles -->
        <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
            <UIcon name="i-heroicons-document-check" class="w-5 h-5 text-green-400" />
            <h2 class="text-lg font-semibold text-white">Artículos Publicados</h2>
            <span class="ml-auto text-sm text-gray-400">{{ publishedArticles.length }}</span>
          </div>
          <div class="divide-y divide-gray-700">
            <div
              v-for="article in publishedArticles"
              :key="article.slug"
              class="px-6 py-4"
            >
              <p class="text-white font-medium">{{ article.title }}</p>
              <div class="flex items-center gap-4 mt-2 text-sm text-gray-400">
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                  {{ article.publishedAt }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
                  {{ article.wordCount }} palabras
                </span>
              </div>
              <p class="text-xs text-blue-400 mt-1">
                Keyword: {{ article.targetKeyword }}
              </p>
            </div>
            <div v-if="publishedArticles.length === 0" class="px-6 py-8 text-center text-gray-500">
              No hay artículos publicados
            </div>
          </div>
        </div>

        <!-- Planned Articles -->
        <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
            <UIcon name="i-heroicons-clock" class="w-5 h-5 text-yellow-400" />
            <h2 class="text-lg font-semibold text-white">Artículos Planeados</h2>
            <span class="ml-auto text-sm text-gray-400">{{ plannedArticles.length }}</span>
          </div>
          <div class="divide-y divide-gray-700">
            <div
              v-for="article in plannedArticles"
              :key="article.slug"
              class="px-6 py-4"
            >
              <div class="flex items-center gap-2">
                <p class="text-white font-medium">{{ article.title }}</p>
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="articleStatusConfig[article.status]?.color || 'bg-gray-700 text-gray-300'"
                >
                  {{ articleStatusConfig[article.status]?.label || article.status }}
                </span>
              </div>
              <div class="flex items-center gap-4 mt-2 text-sm text-gray-400">
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                  Target: {{ article.targetDate }}
                </span>
              </div>
              <p class="text-xs text-blue-400 mt-1">
                Keyword: {{ article.targetKeyword }}
              </p>
            </div>
            <div v-if="plannedArticles.length === 0" class="px-6 py-8 text-center text-gray-500">
              No hay artículos planeados
            </div>
          </div>
        </div>
      </div>

      <!-- Content Freshness -->
      <div v-if="freshness.length > 0" class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-orange-400" />
          <h2 class="text-lg font-semibold text-white">Frescura del Contenido</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-750">
              <tr class="text-left text-sm text-gray-400">
                <th class="px-6 py-3">Artículo</th>
                <th class="px-6 py-3">Última Actualización</th>
                <th class="px-6 py-3">Edad</th>
                <th class="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              <tr v-for="item in freshness" :key="item.slug" class="text-sm">
                <td class="px-6 py-4 text-white">{{ item.slug }}</td>
                <td class="px-6 py-4 text-gray-300">{{ item.lastUpdated }}</td>
                <td class="px-6 py-4 text-gray-300">{{ item.ageMonths }} meses</td>
                <td class="px-6 py-4">
                  <span
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="freshnessStatusConfig[item.status]?.color || 'bg-gray-700 text-gray-300'"
                  >
                    {{ freshnessStatusConfig[item.status]?.label || item.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Landing Pages Pipeline -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
          <UIcon name="i-heroicons-window" class="w-5 h-5 text-emerald-400" />
          <h2 class="text-lg font-semibold text-white">Pipeline de Landing Pages</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-750">
              <tr class="text-left text-sm text-gray-400">
                <th class="px-6 py-3">Keyword</th>
                <th class="px-6 py-3">Volumen</th>
                <th class="px-6 py-3">URL Sugerida</th>
                <th class="px-6 py-3">Estado</th>
                <th class="px-6 py-3">Notas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              <tr v-for="page in landingPages" :key="page.keyword" class="text-sm">
                <td class="px-6 py-4 text-white font-medium">{{ page.keyword }}</td>
                <td class="px-6 py-4 text-gray-300">{{ page.volume?.toLocaleString() }}</td>
                <td class="px-6 py-4 text-blue-400">{{ page.suggestedUrl }}</td>
                <td class="px-6 py-4">
                  <span
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="statusConfig[page.status]?.color || 'bg-gray-700 text-gray-300'"
                  >
                    {{ statusConfig[page.status]?.label || page.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-gray-400 text-sm">{{ page.notes || '-' }}</td>
              </tr>
              <tr v-if="landingPages.length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                  No hay landing pages en el pipeline
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 404 Errors -->
      <div v-if="errors404.length > 0" class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400" />
          <h2 class="text-lg font-semibold text-white">Errores 404 con Backlinks</h2>
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
