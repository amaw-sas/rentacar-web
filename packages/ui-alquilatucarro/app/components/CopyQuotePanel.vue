<template>
  <div
    v-if="canCopy"
    data-testid="copy-quote-panel"
    class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-3 text-white"
  >
    <UButton
      data-testid="copy-quote-button"
      size="md"
      color="success"
      :icon="copied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
      :label="copied ? 'Copiada' : 'Copiar cotización'"
      @click="onCopy"
    />
    <span v-if="advisorName" class="text-sm font-semibold" data-testid="copy-quote-advisor">Asesor: {{ advisorName }}</span>
    <UCheckbox
      v-model="totalCoverage"
      data-testid="copy-quote-total"
      color="success"
      label="Con Seguro Total"
      :ui="{ label: 'text-white' }"
    />
  </div>
</template>

<script setup lang="ts">
import type { CategoryAvailabilityData } from '@rentacar-main/logic/utils'

const props = defineProps<{ rows: CategoryAvailabilityData[]; advisorName?: string }>()

const { canCopy, copy } = useCopyQuote(toRef(props, 'rows'))

const totalCoverage = ref(false)
const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

const onCopy = async () => {
  const ok = await copy({ totalCoverage: totalCoverage.value, babySeat: false })
  if (!ok) return
  copied.value = true
  clearTimeout(resetTimer)
  resetTimer = setTimeout(() => { copied.value = false }, 2000)
}

onBeforeUnmount(() => clearTimeout(resetTimer))
</script>
