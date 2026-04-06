<script setup lang="ts">
definePageMeta({
  layout: 'seo',
  middleware: ['seo-auth']
})

const route = useRoute()
const toast = useToast()

// Check for OAuth callback result
onMounted(() => {
  const success = route.query.success as string
  const error = route.query.error as string

  if (success === 'gsc_connected') {
    toast.add({
      title: 'GSC Conectado',
      description: 'Google Search Console se ha conectado correctamente',
      color: 'success'
    })
    // Refresh GSC status
    refreshGscStatus()
    // Clean URL
    navigateTo('/seo/herramientas', { replace: true })
  } else if (error) {
    toast.add({
      title: 'Error de conexión',
      description: `No se pudo conectar GSC: ${error}`,
      color: 'error'
    })
    navigateTo('/seo/herramientas', { replace: true })
  }
})

const { data: toolsData, pending } = await useFetch('/api/seo/tools', {
  key: 'seo-tools',
  default: () => null
})

// GSC connection status (real OAuth status)
const { data: gscStatus, refresh: refreshGscStatus } = await useFetch('/api/auth/gsc/status', {
  key: 'gsc-status',
  default: () => ({ connected: false })
})

// Tools
const moz = computed(() => toolsData.value?.moz || {})
const gsc = computed(() => toolsData.value?.gsc || {})
const pagespeed = computed(() => toolsData.value?.pagespeed || {})

// Real GSC connection status
const isGscConnected = computed(() => gscStatus.value?.connected || false)

// Connect GSC
const connectingGsc = ref(false)
const connectGsc = () => {
  connectingGsc.value = true
  window.location.href = '/api/auth/gsc/authorize'
}

// Get usage percentage
const getUsagePercent = (used: number, limit: number) => {
  if (limit === 0) return 0
  return Math.round((used / limit) * 100)
}

// Get usage color
const getUsageColor = (percent: number) => {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 70) return 'bg-yellow-500'
  return 'bg-green-500'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-white">Herramientas SEO</h1>
      <p class="text-gray-400 text-sm mt-1">
        Última actualización: {{ toolsData?.lastUpdated || 'N/A' }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <template v-else>
      <!-- Moz Pro -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              M
            </div>
            <div>
              <h2 class="text-lg font-semibold text-white">Moz Pro</h2>
              <p class="text-sm text-gray-400">{{ moz.plan }} - {{ moz.cost }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="px-2 py-1 rounded text-xs font-medium"
              :class="moz.mcp?.installed ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'"
            >
              MCP: {{ moz.mcp?.installed ? 'Instalado' : 'Pendiente' }}
            </span>
            <a
              :href="moz.dashboardUrl"
              target="_blank"
              class="text-blue-400 hover:text-blue-300 transition"
            >
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-5 h-5" />
            </a>
          </div>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-400 mb-4">Cuenta: {{ moz.account }}</p>

          <!-- Quotas -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Domain Overview -->
            <div class="bg-gray-900/50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-white font-medium">Domain Overview</span>
                <span class="text-sm text-gray-400">
                  {{ moz.quotas?.domainOverview?.used }}/{{ moz.quotas?.domainOverview?.limit }}
                </span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div
                  class="h-2 rounded-full transition-all"
                  :class="getUsageColor(getUsagePercent(moz.quotas?.domainOverview?.used || 0, moz.quotas?.domainOverview?.limit || 1))"
                  :style="{ width: `${getUsagePercent(moz.quotas?.domainOverview?.used || 0, moz.quotas?.domainOverview?.limit || 1)}%` }"
                />
              </div>
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>Costo: {{ moz.quotas?.domainOverview?.costPerQuery }}</span>
                <span>Reset: {{ moz.quotas?.domainOverview?.resetsAt }}</span>
              </div>
            </div>

            <!-- Link Explorer -->
            <div class="bg-gray-900/50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-white font-medium">Link Explorer</span>
                <span class="text-sm text-gray-400">
                  {{ moz.quotas?.linkExplorer?.used }}/{{ moz.quotas?.linkExplorer?.limit }}
                </span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div
                  class="h-2 rounded-full transition-all"
                  :class="getUsageColor(getUsagePercent(moz.quotas?.linkExplorer?.used || 0, moz.quotas?.linkExplorer?.limit || 1))"
                  :style="{ width: `${getUsagePercent(moz.quotas?.linkExplorer?.used || 0, moz.quotas?.linkExplorer?.limit || 1)}%` }"
                />
              </div>
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>Costo: {{ moz.quotas?.linkExplorer?.costPerQuery }}</span>
                <span>Reset: {{ moz.quotas?.linkExplorer?.resetsAt }}</span>
              </div>
            </div>
          </div>

          <!-- MCP Setup -->
          <div v-if="!moz.mcp?.installed" class="mt-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
            <div class="flex items-start gap-2">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p class="text-sm text-yellow-300">MCP no instalado</p>
                <p class="text-xs text-yellow-300/70 mt-1">
                  Repo: <a :href="moz.mcp?.repo" target="_blank" class="underline">{{ moz.mcp?.repo }}</a>
                </p>
                <p class="text-xs text-yellow-300/70">
                  Guía: {{ moz.mcp?.setupGuide }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Google Search Console -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">
              G
            </div>
            <div>
              <h2 class="text-lg font-semibold text-white">Google Search Console</h2>
              <p class="text-sm text-gray-400">{{ gsc.type }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="px-2 py-1 rounded text-xs font-medium"
              :class="isGscConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'"
            >
              {{ isGscConnected ? 'Conectado' : 'No conectado' }}
            </span>
            <a
              :href="gsc.dashboardUrl"
              target="_blank"
              class="text-blue-400 hover:text-blue-300 transition"
            >
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-5 h-5" />
            </a>
          </div>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-400 mb-4">Property: {{ gsc.property }}</p>

          <!-- Quotas -->
          <div class="bg-gray-900/50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-white font-medium">API Queries</span>
              <span class="text-sm text-green-400">{{ gsc.quotas?.queriesPerDay?.limit?.toLocaleString() }}/día</span>
            </div>
            <p class="text-xs text-gray-500">{{ gsc.quotas?.queriesPerDay?.note }}</p>
          </div>

          <!-- Connected Info -->
          <div v-if="isGscConnected" class="mt-4 p-3 bg-green-900/20 border border-green-800 rounded-lg">
            <div class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p class="text-sm text-green-300">OAuth conectado correctamente</p>
                <p v-if="gscStatus?.expiresAt" class="text-xs text-green-300/70 mt-1">
                  Token válido hasta: {{ new Date(gscStatus.expiresAt).toLocaleString() }}
                </p>
              </div>
            </div>
          </div>

          <!-- OAuth Setup -->
          <div v-else class="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-start gap-2">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p class="text-sm text-red-300">OAuth no configurado</p>
                  <p class="text-xs text-red-300/70 mt-1">
                    Conecta tu cuenta de Google para obtener datos reales de Search Console
                  </p>
                </div>
              </div>
              <button
                @click="connectGsc"
                :disabled="connectingGsc"
                class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                <UIcon v-if="connectingGsc" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                <UIcon v-else name="i-heroicons-link" class="w-4 h-4" />
                Conectar GSC
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- PageSpeed Insights -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold">
              P
            </div>
            <div>
              <h2 class="text-lg font-semibold text-white">PageSpeed Insights</h2>
              <p class="text-sm text-gray-400">API gratuita de Google</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="px-2 py-1 rounded text-xs font-medium"
              :class="pagespeed.enabled ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'"
            >
              {{ pagespeed.enabled ? 'Habilitado' : 'Deshabilitado' }}
            </span>
            <a
              :href="pagespeed.testUrl"
              target="_blank"
              class="text-blue-400 hover:text-blue-300 transition"
            >
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-5 h-5" />
            </a>
          </div>
        </div>
        <div class="p-6">
          <!-- Quotas -->
          <div class="bg-gray-900/50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-white font-medium">API Queries</span>
              <span class="text-sm text-green-400">{{ pagespeed.quotas?.queriesPerDay?.limit?.toLocaleString() }}/día</span>
            </div>
            <p class="text-xs text-gray-500">{{ pagespeed.quotas?.queriesPerDay?.note }}</p>
          </div>

          <!-- MCP Note -->
          <div class="mt-4 p-3 bg-gray-700/30 border border-gray-600 rounded-lg">
            <div class="flex items-start gap-2">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-gray-400 mt-0.5" />
              <p class="text-sm text-gray-400">{{ pagespeed.mcp?.note }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 class="text-lg font-semibold text-white mb-4">Enlaces Rápidos</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            :href="moz.apiDocs"
            target="_blank"
            class="flex items-center gap-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            <UIcon name="i-heroicons-book-open" class="w-5 h-5 text-blue-400" />
            <span class="text-sm text-white">Moz API Docs</span>
          </a>
          <a
            :href="gsc.dashboardUrl"
            target="_blank"
            class="flex items-center gap-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-red-400" />
            <span class="text-sm text-white">Search Console</span>
          </a>
          <a
            :href="moz.dashboardUrl"
            target="_blank"
            class="flex items-center gap-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            <UIcon name="i-heroicons-link" class="w-5 h-5 text-blue-400" />
            <span class="text-sm text-white">Moz Pro</span>
          </a>
          <a
            :href="pagespeed.testUrl"
            target="_blank"
            class="flex items-center gap-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            <UIcon name="i-heroicons-bolt" class="w-5 h-5 text-green-400" />
            <span class="text-sm text-white">PageSpeed Test</span>
          </a>
        </div>
      </div>

      <!-- Cost Summary -->
      <div class="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-6 border border-purple-700">
        <h2 class="text-lg font-semibold text-white mb-4">Resumen de Costos</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <p class="text-3xl font-bold text-white">{{ moz.cost }}</p>
            <p class="text-sm text-gray-400">Moz Pro</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-green-400">$0</p>
            <p class="text-sm text-gray-400">Search Console</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-green-400">$0</p>
            <p class="text-sm text-gray-400">PageSpeed API</p>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-700 text-center">
          <p class="text-sm text-gray-400">Total mensual:</p>
          <p class="text-2xl font-bold text-white">{{ moz.cost }}</p>
        </div>
      </div>
    </template>
  </div>
</template>
