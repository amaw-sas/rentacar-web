<template>
  <!-- Herramienta del asesor (?asesor): el visitante nunca la ve. Copia al portapapeles
       la cotización de todas las gamas del Paso 2. -->
  <div
    v-if="canCopy"
    class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2"
    data-testid="copy-quote-panel"
  >
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 body-sm font-semibold text-brand-800 hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/50"
      data-testid="copy-quote-button"
      @click="onCopy"
    >
      <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-clipboard-copy'" class="size-4" />
      {{ copied ? 'Copiada' : 'Copiar cotización' }}
    </button>
    <span v-if="advisorName" class="body-sm font-semibold text-gray-700" data-testid="copy-quote-advisor">Asesor: {{ advisorName }}</span>
    <label class="inline-flex items-center gap-2 body-sm text-gray-700">
      <input
        v-model="totalCoverage"
        type="checkbox"
        class="size-4 rounded border-gray-300 accent-brand-800"
        data-testid="copy-quote-total"
      />
      Con Seguro Total
    </label>
    <label class="inline-flex items-center gap-2 body-sm text-gray-700">
      <input
        v-model="babySeat"
        type="checkbox"
        class="size-4 rounded border-gray-300 accent-brand-800"
        data-testid="copy-quote-seat"
      />
      Con silla de bebé
    </label>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, toRef } from 'vue'
import useCopyQuote from '@rentacar-main/logic/composables/useCopyQuote'
import type { CategoryAvailabilityData } from '@rentacar-main/logic/utils'

const props = defineProps<{ rows: CategoryAvailabilityData[]; advisorName?: string }>()

const { canCopy, copy } = useCopyQuote(toRef(props, 'rows'))

const totalCoverage = ref(false)
const babySeat = ref(false)
const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function onCopy() {
  const ok = await copy({ totalCoverage: totalCoverage.value, babySeat: babySeat.value })
  if (!ok) return
  copied.value = true
  clearTimeout(resetTimer)
  resetTimer = setTimeout(() => { copied.value = false }, 2000)
}

onBeforeUnmount(() => clearTimeout(resetTimer))
</script>
