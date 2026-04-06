<script setup lang="ts">
interface Props {
  data: number[]
  color?: string
  height?: number
  width?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: '#10b981',
  height: 40,
  width: 120
})

const pathData = computed(() => {
  if (!props.data || props.data.length < 2) return ''

  const max = Math.max(...props.data)
  const min = Math.min(...props.data)
  const range = max - min || 1

  const points = props.data.map((value, index) => {
    const x = (index / (props.data.length - 1)) * props.width
    const y = props.height - ((value - min) / range) * (props.height - 4) - 2
    return `${x},${y}`
  })

  return `M${points.join(' L')}`
})

const trend = computed(() => {
  if (!props.data || props.data.length < 2) return 0
  const first = props.data[0]
  const last = props.data[props.data.length - 1]
  return first === 0 ? 0 : Math.round(((last - first) / first) * 100)
})
</script>

<template>
  <div class="flex items-center gap-2">
    <svg :width="width" :height="height" class="overflow-visible">
      <path
        :d="pathData"
        fill="none"
        :stroke="color"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span
      v-if="trend !== 0"
      class="text-xs font-medium"
      :class="trend > 0 ? 'text-green-400' : 'text-red-400'"
    >
      {{ trend > 0 ? '+' : '' }}{{ trend }}%
    </span>
  </div>
</template>
