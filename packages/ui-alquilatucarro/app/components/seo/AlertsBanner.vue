<script setup lang="ts">
interface Alert {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  date?: string
}

interface Props {
  alerts: Alert[]
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 3
})

const visibleAlerts = computed(() => props.alerts.slice(0, props.maxVisible))

const alertStyles = {
  success: {
    bg: 'bg-green-900/30 border-green-700',
    icon: 'i-heroicons-check-circle',
    iconColor: 'text-green-400'
  },
  warning: {
    bg: 'bg-yellow-900/30 border-yellow-700',
    icon: 'i-heroicons-exclamation-triangle',
    iconColor: 'text-yellow-400'
  },
  error: {
    bg: 'bg-red-900/30 border-red-700',
    icon: 'i-heroicons-x-circle',
    iconColor: 'text-red-400'
  },
  info: {
    bg: 'bg-blue-900/30 border-blue-700',
    icon: 'i-heroicons-information-circle',
    iconColor: 'text-blue-400'
  }
}
</script>

<template>
  <div v-if="visibleAlerts.length > 0" class="space-y-2">
    <div
      v-for="alert in visibleAlerts"
      :key="alert.id"
      class="flex items-start gap-3 p-3 rounded-lg border"
      :class="alertStyles[alert.type].bg"
    >
      <UIcon
        :name="alertStyles[alert.type].icon"
        class="w-5 h-5 mt-0.5 flex-shrink-0"
        :class="alertStyles[alert.type].iconColor"
      />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-white">{{ alert.title }}</p>
        <p class="text-xs text-gray-400 mt-0.5">{{ alert.message }}</p>
      </div>
      <span v-if="alert.date" class="text-xs text-gray-500 flex-shrink-0">
        {{ alert.date }}
      </span>
    </div>
    <p
      v-if="alerts.length > maxVisible"
      class="text-xs text-gray-500 text-center"
    >
      +{{ alerts.length - maxVisible }} alertas más
    </p>
  </div>
  <div v-else class="text-center py-4 text-gray-500 text-sm">
    No hay alertas pendientes
  </div>
</template>
