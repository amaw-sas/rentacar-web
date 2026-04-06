<script setup lang="ts">
interface Props {
  data: unknown
  filename?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  filename: 'export',
  label: 'Exportar'
})

const exportFormat = ref<'json' | 'csv'>('json')
const isOpen = ref(false)

const downloadFile = (content: string, extension: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.filename}-${new Date().toISOString().split('T')[0]}.${extension}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  isOpen.value = false
}

const exportJSON = () => {
  const content = JSON.stringify(props.data, null, 2)
  downloadFile(content, 'json', 'application/json')
}

const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
  const result: Record<string, unknown> = {}
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key] as Record<string, unknown>, newKey))
    } else {
      result[newKey] = obj[key]
    }
  }
  return result
}

const exportCSV = () => {
  const dataArray = Array.isArray(props.data) ? props.data : [props.data]
  if (dataArray.length === 0) return

  const flatData = dataArray.map((item) => flattenObject(item as Record<string, unknown>))
  const headers = [...new Set(flatData.flatMap((item) => Object.keys(item)))]

  const csvRows = [
    headers.join(','),
    ...flatData.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          if (value === null || value === undefined) return ''
          const str = String(value)
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(',')
    )
  ]

  downloadFile(csvRows.join('\n'), 'csv', 'text/csv')
}

const handleExport = () => {
  if (exportFormat.value === 'json') {
    exportJSON()
  } else {
    exportCSV()
  }
}
</script>

<template>
  <div class="relative">
    <button
      class="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition"
      @click="isOpen = !isOpen"
    >
      <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
      {{ label }}
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10"
    >
      <div class="p-3 space-y-3">
        <div class="space-y-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="exportFormat"
              type="radio"
              value="json"
              class="text-blue-500 focus:ring-blue-500"
            />
            <span class="text-sm text-white">JSON</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="exportFormat"
              type="radio"
              value="csv"
              class="text-blue-500 focus:ring-blue-500"
            />
            <span class="text-sm text-white">CSV</span>
          </label>
        </div>
        <button
          class="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white transition"
          @click="handleExport"
        >
          Descargar
        </button>
      </div>
    </div>

    <!-- Overlay to close -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-0"
      @click="isOpen = false"
    />
  </div>
</template>
