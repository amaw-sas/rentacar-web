<script setup lang="ts">
definePageMeta({
  layout: 'seo',
  middleware: ['seo-auth']
})

const { data: performanceData, pending, error } = await useFetch('/api/seo/performance', {
  key: 'seo-performance',
  default: () => null
})

// GSC data
const gsc = computed(() => performanceData.value?.gsc || {
  last28d: {},
  previousPeriod: {},
  topPages: [],
  topQueries: [],
  status: 'pending-oauth-setup'
})

// Core Web Vitals
const cwv = computed(() => performanceData.value?.cwv || {
  desktop: {},
  mobile: {},
  history: []
})

// Indexation
const indexation = computed(() => performanceData.value?.indexation || {
  status: 'pending-gsc-setup'
})

// CWV Score color
const getCwvScoreColor = (score: number | null) => {
  if (score === null) return 'text-gray-500'
  if (score >= 90) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

// CWV metric color
const getMetricColor = (value: number | null, thresholds: { good: number; poor: number }) => {
  if (value === null) return 'text-gray-500'
  if (value <= thresholds.good) return 'text-green-400'
  if (value <= thresholds.poor) return 'text-yellow-400'
  return 'text-red-400'
}

// LCP thresholds
const lcpThresholds = { good: 2.5, poor: 4.0 }
// FID thresholds (ms)
const fidThresholds = { good: 100, poor: 300 }
// CLS thresholds
const clsThresholds = { good: 0.1, poor: 0.25 }
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Rendimiento</h1>
        <p class="text-gray-400 text-sm mt-1">
          Core Web Vitals y métricas de Search Console
        </p>
      </div>
      <SeoExportButton
        v-if="performanceData"
        :data="performanceData"
        filename="performance-report"
        label="Exportar"
      />
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <template v-else>
      <!-- GSC Status Alert -->
      <div
        v-if="gsc.status === 'pending-oauth-setup'"
        class="flex items-center gap-3 p-4 rounded-lg bg-yellow-900/30 border border-yellow-700"
      >
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-400" />
        <div>
          <p class="text-yellow-300 text-sm font-medium">Google Search Console no conectado</p>
          <p class="text-yellow-300/70 text-xs mt-1">
            Configura OAuth para ver impresiones, clics y posición promedio.
          </p>
        </div>
      </div>

      <!-- Core Web Vitals -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div class="flex items-center gap-2 mb-6">
          <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-purple-400" />
          <h2 class="text-lg font-semibold text-white">Core Web Vitals</h2>
          <span class="ml-auto text-sm text-gray-400">
            Actualizado: {{ cwv.lastUpdated || 'N/A' }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Desktop -->
          <div class="bg-gray-900/50 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-4">
              <UIcon name="i-heroicons-computer-desktop" class="w-5 h-5 text-gray-400" />
              <h3 class="text-white font-medium">Desktop</h3>
              <span
                class="ml-auto text-2xl font-bold"
                :class="getCwvScoreColor(cwv.desktop?.score)"
              >
                {{ cwv.desktop?.score ?? '-' }}
              </span>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center">
                <p
                  class="text-xl font-bold"
                  :class="getMetricColor(cwv.desktop?.lcp, lcpThresholds)"
                >
                  {{ cwv.desktop?.lcp ?? '-' }}s
                </p>
                <p class="text-xs text-gray-400">LCP</p>
              </div>
              <div class="text-center">
                <p
                  class="text-xl font-bold"
                  :class="getMetricColor(cwv.desktop?.fid, fidThresholds)"
                >
                  {{ cwv.desktop?.fid ?? '-' }}ms
                </p>
                <p class="text-xs text-gray-400">FID</p>
              </div>
              <div class="text-center">
                <p
                  class="text-xl font-bold"
                  :class="getMetricColor(cwv.desktop?.cls, clsThresholds)"
                >
                  {{ cwv.desktop?.cls ?? '-' }}
                </p>
                <p class="text-xs text-gray-400">CLS</p>
              </div>
            </div>
          </div>

          <!-- Mobile -->
          <div class="bg-gray-900/50 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-4">
              <UIcon name="i-heroicons-device-phone-mobile" class="w-5 h-5 text-gray-400" />
              <h3 class="text-white font-medium">Mobile</h3>
              <span
                class="ml-auto text-2xl font-bold"
                :class="getCwvScoreColor(cwv.mobile?.score)"
              >
                {{ cwv.mobile?.score ?? '-' }}
              </span>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center">
                <p
                  class="text-xl font-bold"
                  :class="getMetricColor(cwv.mobile?.lcp, lcpThresholds)"
                >
                  {{ cwv.mobile?.lcp ?? '-' }}s
                </p>
                <p class="text-xs text-gray-400">LCP</p>
              </div>
              <div class="text-center">
                <p
                  class="text-xl font-bold"
                  :class="getMetricColor(cwv.mobile?.fid, fidThresholds)"
                >
                  {{ cwv.mobile?.fid ?? '-' }}ms
                </p>
                <p class="text-xs text-gray-400">FID</p>
              </div>
              <div class="text-center">
                <p
                  class="text-xl font-bold"
                  :class="getMetricColor(cwv.mobile?.cls, clsThresholds)"
                >
                  {{ cwv.mobile?.cls ?? '-' }}
                </p>
                <p class="text-xs text-gray-400">CLS</p>
              </div>
            </div>
          </div>
        </div>

        <!-- CWV History -->
        <div v-if="cwv.history?.length > 0" class="mt-6">
          <h3 class="text-sm text-gray-400 mb-3">Historial de Scores</h3>
          <div class="flex items-end gap-2 h-24">
            <div
              v-for="item in cwv.history"
              :key="item.month"
              class="flex-1 flex flex-col items-center gap-1"
            >
              <div class="w-full flex gap-1 h-16">
                <div
                  class="flex-1 bg-blue-500 rounded-t"
                  :style="{ height: `${item.desktop}%` }"
                  :title="`Desktop: ${item.desktop}`"
                />
                <div
                  class="flex-1 bg-purple-500 rounded-t"
                  :style="{ height: `${item.mobile}%` }"
                  :title="`Mobile: ${item.mobile}`"
                />
              </div>
              <span class="text-xs text-gray-500">{{ item.month }}</span>
            </div>
          </div>
          <div class="flex items-center gap-4 mt-2 justify-center">
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 bg-blue-500 rounded" />
              <span class="text-xs text-gray-400">Desktop</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 bg-purple-500 rounded" />
              <span class="text-xs text-gray-400">Mobile</span>
            </div>
          </div>
        </div>
      </div>

      <!-- GSC Metrics (if connected) -->
      <div v-if="gsc.status !== 'pending-oauth-setup'" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p class="text-gray-400 text-sm">Impresiones (28d)</p>
          <p class="text-2xl font-bold text-white">{{ gsc.last28d?.impressions?.toLocaleString() || '-' }}</p>
          <p v-if="gsc.previousPeriod?.impressions" class="text-xs text-gray-500">
            vs {{ gsc.previousPeriod.impressions.toLocaleString() }} anterior
          </p>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p class="text-gray-400 text-sm">Clics (28d)</p>
          <p class="text-2xl font-bold text-green-400">{{ gsc.last28d?.clicks?.toLocaleString() || '-' }}</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p class="text-gray-400 text-sm">CTR</p>
          <p class="text-2xl font-bold text-yellow-400">{{ gsc.last28d?.ctr ? `${gsc.last28d.ctr}%` : '-' }}</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p class="text-gray-400 text-sm">Posición Promedio</p>
          <p class="text-2xl font-bold text-blue-400">{{ gsc.last28d?.avgPosition || '-' }}</p>
        </div>
      </div>

      <!-- Indexation Status -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div class="flex items-center gap-2 mb-4">
          <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-green-400" />
          <h2 class="text-lg font-semibold text-white">Estado de Indexación</h2>
        </div>
        <div v-if="indexation.status === 'pending-gsc-setup'" class="text-center py-8">
          <UIcon name="i-heroicons-clock" class="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p class="text-gray-400">Conecta Google Search Console para ver el estado de indexación</p>
        </div>
        <div v-else class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <p class="text-3xl font-bold text-green-400">{{ indexation.indexed || '-' }}</p>
            <p class="text-sm text-gray-400">Indexadas</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-white">{{ indexation.total || '-' }}</p>
            <p class="text-sm text-gray-400">Total</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-red-400">{{ indexation.excluded || '-' }}</p>
            <p class="text-sm text-gray-400">Excluidas</p>
          </div>
        </div>
      </div>

      <!-- Quick Guide -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 class="text-lg font-semibold text-white mb-4">Guía de Métricas</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p class="text-white font-medium mb-1">LCP (Largest Contentful Paint)</p>
            <p class="text-gray-400">
              <span class="text-green-400">≤2.5s</span> Bueno |
              <span class="text-yellow-400">≤4.0s</span> Mejorable |
              <span class="text-red-400">&gt;4.0s</span> Pobre
            </p>
          </div>
          <div>
            <p class="text-white font-medium mb-1">FID (First Input Delay)</p>
            <p class="text-gray-400">
              <span class="text-green-400">≤100ms</span> Bueno |
              <span class="text-yellow-400">≤300ms</span> Mejorable |
              <span class="text-red-400">&gt;300ms</span> Pobre
            </p>
          </div>
          <div>
            <p class="text-white font-medium mb-1">CLS (Cumulative Layout Shift)</p>
            <p class="text-gray-400">
              <span class="text-green-400">≤0.1</span> Bueno |
              <span class="text-yellow-400">≤0.25</span> Mejorable |
              <span class="text-red-400">&gt;0.25</span> Pobre
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
