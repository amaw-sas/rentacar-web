<script setup lang="ts">
definePageMeta({
  layout: 'seo',
  middleware: ['seo-auth']
})

const { data: tasksData, pending: tasksPending, error: tasksError } = await useFetch('/api/seo/tasks', {
  key: 'seo-tasks',
  default: () => null
})
const { data: activityData, pending: activityPending, error: activityError } = await useFetch('/api/seo/activity', {
  key: 'seo-activity',
  default: () => null
})

// Debug: log data state on client
if (import.meta.client) {
  console.log('[SEO Tasks] Data loaded:', {
    hasTasksData: !!tasksData.value,
    hasActivityData: !!activityData.value,
    errors: { tasks: tasksError.value, activity: activityError.value }
  })
}

const pending = computed(() => tasksPending.value || activityPending.value)

// Current month key
const currentMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})

// Monthly task data
const monthData = computed(() => {
  return tasksData.value?.months?.[currentMonth.value] || {
    goal: 100,
    completed: 0,
    percentage: 0,
    categories: {}
  }
})

// Activity data for current month
const monthActivity = computed(() => {
  return activityData.value?.[currentMonth.value] || {
    backlinks: { outreachSent: 0, outreachGoal: 50, responsesReceived: 0, linksAcquired: 0, linksGoal: 100 },
    blog: { articlesPlanned: 0, articlesWritten: 0, articlesPublished: 0, articlesGoal: 4 },
    internalLinking: { linksAdded: 0, linksGoal: 50 },
    ctrOptimization: { pagesOptimized: 0, pagesGoal: 5 },
    contentRefresh: { articlesUpdated: 0, articlesGoal: 2 },
    landingPages: { pagesCreated: 0, pagesGoal: 1 },
    lastActivityDate: null,
    consecutiveDaysActive: 0,
    bestStreak: 0,
    activityLog: []
  }
})

// Days since last activity
const daysSinceActivity = computed(() => {
  if (!monthActivity.value.lastActivityDate) return null
  const lastDate = new Date(monthActivity.value.lastActivityDate)
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - lastDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

// Category labels and icons
const categoryConfig: Record<string, { label: string; icon: string; color: string }> = {
  directories: { label: 'Directorios', icon: 'i-heroicons-folder', color: 'blue' },
  guestPosts: { label: 'Guest Posts', icon: 'i-heroicons-pencil-square', color: 'green' },
  partnerships: { label: 'Partnerships', icon: 'i-heroicons-user-group', color: 'purple' },
  pressPR: { label: 'Press/PR', icon: 'i-heroicons-newspaper', color: 'orange' },
  other: { label: 'Otros', icon: 'i-heroicons-squares-plus', color: 'gray' }
}

// Progress percentage calculation
const getProgressPercent = (completed: number, goal: number) => {
  if (goal === 0) return 0
  return Math.min(100, Math.round((completed / goal) * 100))
}

// Activity metrics cards
const activityMetrics = computed(() => [
  {
    label: 'Outreach Enviado',
    value: monthActivity.value.backlinks?.outreachSent || 0,
    goal: monthActivity.value.backlinks?.outreachGoal || 50,
    icon: 'i-heroicons-paper-airplane'
  },
  {
    label: 'Respuestas',
    value: monthActivity.value.backlinks?.responsesReceived || 0,
    goal: null,
    icon: 'i-heroicons-inbox'
  },
  {
    label: 'Links Adquiridos',
    value: monthActivity.value.backlinks?.linksAcquired || 0,
    goal: monthActivity.value.backlinks?.linksGoal || 100,
    icon: 'i-heroicons-link'
  },
  {
    label: 'Artículos Blog',
    value: monthActivity.value.blog?.articlesPublished || 0,
    goal: monthActivity.value.blog?.articlesGoal || 4,
    icon: 'i-heroicons-document-text'
  }
])
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-white">Tareas y Actividad</h1>
      <p class="text-gray-400 text-sm mt-1">
        Mes actual: {{ currentMonth }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <template v-else>
      <!-- Days Without Activity Alert -->
      <div
        v-if="daysSinceActivity !== null && daysSinceActivity > 2"
        class="flex items-center gap-3 p-4 rounded-lg bg-red-900/30 border border-red-700"
      >
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400" />
        <span class="text-red-300 text-sm">
          Han pasado {{ daysSinceActivity }} días sin actividad registrada
        </span>
      </div>

      <div
        v-else-if="monthActivity.lastActivityDate === null"
        class="flex items-center gap-3 p-4 rounded-lg bg-yellow-900/30 border border-yellow-700"
      >
        <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-yellow-400" />
        <span class="text-yellow-300 text-sm">
          No hay actividad registrada este mes. ¡Comienza hoy!
        </span>
      </div>

      <!-- Main Progress -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">Progreso Mensual de Backlinks</h2>
          <span class="text-2xl font-bold text-white">
            {{ monthData.completed }}/{{ monthData.goal }}
          </span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-4 mb-2">
          <div
            class="h-4 rounded-full transition-all duration-500"
            :class="{
              'bg-green-500': getProgressPercent(monthData.completed, monthData.goal) >= 80,
              'bg-yellow-500': getProgressPercent(monthData.completed, monthData.goal) >= 50 && getProgressPercent(monthData.completed, monthData.goal) < 80,
              'bg-red-500': getProgressPercent(monthData.completed, monthData.goal) < 50
            }"
            :style="{ width: `${getProgressPercent(monthData.completed, monthData.goal)}%` }"
          />
        </div>
        <p class="text-sm text-gray-400 text-right">
          {{ getProgressPercent(monthData.completed, monthData.goal) }}% completado
        </p>
      </div>

      <!-- Activity Metrics -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="metric in activityMetrics"
          :key="metric.label"
          class="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div class="flex items-center gap-2 mb-2">
            <UIcon :name="metric.icon" class="w-4 h-4 text-gray-400" />
            <p class="text-gray-400 text-sm">{{ metric.label }}</p>
          </div>
          <p class="text-2xl font-bold text-white">
            {{ metric.value }}
            <span v-if="metric.goal" class="text-sm font-normal text-gray-500">/ {{ metric.goal }}</span>
          </p>
        </div>
      </div>

      <!-- Streak Card -->
      <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-fire" class="w-6 h-6 text-orange-400" />
            <div>
              <p class="text-white font-medium">Racha de Actividad</p>
              <p class="text-sm text-gray-400">Días consecutivos activo</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-3xl font-bold text-orange-400">{{ monthActivity.consecutiveDaysActive }}</p>
            <p class="text-sm text-gray-500">Mejor: {{ monthActivity.bestStreak }}</p>
          </div>
        </div>
      </div>

      <!-- Categories Progress -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 class="text-lg font-semibold text-white mb-4">Progreso por Categoría</h2>
        <div class="space-y-4">
          <div
            v-for="(config, key) in categoryConfig"
            :key="key"
            class="space-y-2"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon :name="config.icon" class="w-4 h-4 text-gray-400" />
                <span class="text-sm text-gray-300">{{ config.label }}</span>
              </div>
              <span class="text-sm text-gray-400">
                {{ monthData.categories?.[key]?.completed || 0 }}/{{ monthData.categories?.[key]?.goal || 0 }}
              </span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-500"
                :class="{
                  'bg-blue-500': config.color === 'blue',
                  'bg-green-500': config.color === 'green',
                  'bg-purple-500': config.color === 'purple',
                  'bg-orange-500': config.color === 'orange',
                  'bg-gray-500': config.color === 'gray'
                }"
                :style="{ width: `${getProgressPercent(monthData.categories?.[key]?.completed || 0, monthData.categories?.[key]?.goal || 0)}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Other Activity Progress -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Internal Linking -->
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4 text-cyan-400" />
              <span class="text-white font-medium">Internal Linking</span>
            </div>
            <span class="text-sm text-gray-400">
              {{ monthActivity.internalLinking?.linksAdded || 0 }}/{{ monthActivity.internalLinking?.linksGoal || 50 }}
            </span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div
              class="h-2 rounded-full bg-cyan-500 transition-all duration-500"
              :style="{ width: `${getProgressPercent(monthActivity.internalLinking?.linksAdded || 0, monthActivity.internalLinking?.linksGoal || 50)}%` }"
            />
          </div>
        </div>

        <!-- CTR Optimization -->
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-cursor-arrow-rays" class="w-4 h-4 text-pink-400" />
              <span class="text-white font-medium">CTR Optimization</span>
            </div>
            <span class="text-sm text-gray-400">
              {{ monthActivity.ctrOptimization?.pagesOptimized || 0 }}/{{ monthActivity.ctrOptimization?.pagesGoal || 5 }}
            </span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div
              class="h-2 rounded-full bg-pink-500 transition-all duration-500"
              :style="{ width: `${getProgressPercent(monthActivity.ctrOptimization?.pagesOptimized || 0, monthActivity.ctrOptimization?.pagesGoal || 5)}%` }"
            />
          </div>
        </div>

        <!-- Content Refresh -->
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-yellow-400" />
              <span class="text-white font-medium">Content Refresh</span>
            </div>
            <span class="text-sm text-gray-400">
              {{ monthActivity.contentRefresh?.articlesUpdated || 0 }}/{{ monthActivity.contentRefresh?.articlesGoal || 2 }}
            </span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div
              class="h-2 rounded-full bg-yellow-500 transition-all duration-500"
              :style="{ width: `${getProgressPercent(monthActivity.contentRefresh?.articlesUpdated || 0, monthActivity.contentRefresh?.articlesGoal || 2)}%` }"
            />
          </div>
        </div>

        <!-- Landing Pages -->
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-window" class="w-4 h-4 text-emerald-400" />
              <span class="text-white font-medium">Landing Pages</span>
            </div>
            <span class="text-sm text-gray-400">
              {{ monthActivity.landingPages?.pagesCreated || 0 }}/{{ monthActivity.landingPages?.pagesGoal || 1 }}
            </span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div
              class="h-2 rounded-full bg-emerald-500 transition-all duration-500"
              :style="{ width: `${getProgressPercent(monthActivity.landingPages?.pagesCreated || 0, monthActivity.landingPages?.pagesGoal || 1)}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Activity Log -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-700">
          <h2 class="text-lg font-semibold text-white">Registro de Actividad</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-750">
              <tr class="text-left text-sm text-gray-400">
                <th class="px-6 py-3">Fecha</th>
                <th class="px-6 py-3">Tipo</th>
                <th class="px-6 py-3">Descripción</th>
                <th class="px-6 py-3">Resultado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              <tr
                v-for="(log, index) in monthActivity.activityLog"
                :key="index"
                class="text-sm"
              >
                <td class="px-6 py-4 text-gray-300">{{ log.date }}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300">
                    {{ log.type }}
                  </span>
                </td>
                <td class="px-6 py-4 text-gray-300">{{ log.target }}</td>
                <td class="px-6 py-4">
                  <span
                    class="px-2 py-1 rounded text-xs font-medium"
                    :class="{
                      'bg-green-900 text-green-300': log.result === 'success',
                      'bg-red-900 text-red-300': log.result === 'failed',
                      'bg-yellow-900 text-yellow-300': log.result === 'pending'
                    }"
                  >
                    {{ log.result }}
                  </span>
                </td>
              </tr>
              <tr v-if="!monthActivity.activityLog?.length">
                <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                  No hay actividad registrada este mes
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
