<template>
  <!-- Solo para asesores (?asesor=1). `canCopy` ya exige que la búsqueda
       coincida con el formulario, así que nunca se copian fechas nuevas con
       precios viejos. flex-wrap + min-w-0: a 360px las casillas bajan de línea
       en vez de desbordar. -->
  <div
    v-if="canCopy"
    class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-3 max-w-full"
    data-testid="copy-quote-panel"
  >
    <UButton
      color="neutral"
      variant="outline"
      size="sm"
      :icon="copied ? 'i-lucide-check' : 'i-lucide-clipboard'"
      :label="copied ? 'Copiada' : 'Copiar cotización'"
      data-testid="copy-quote-button"
      @click="onCopy"
    />
    <span v-if="advisorName" class="text-sm text-muted" data-testid="copy-quote-advisor">Asesor: {{ advisorName }}</span>
    <UCheckbox
      v-model="totalCoverage"
      color="success"
      label="Con Seguro Total"
      class="min-w-0"
      data-testid="copy-quote-total"
    />
  </div>
</template>

<script setup lang="ts">
import type { CategoryAvailabilityData } from '@rentacar-main/logic/utils';

const props = defineProps<{ rows: CategoryAvailabilityData[]; advisorName?: string }>();

const { canCopy, copy } = useCopyQuote(toRef(props, 'rows'));

const totalCoverage = ref(false);
const copied = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | undefined;

async function onCopy() {
  const ok = await copy({ totalCoverage: totalCoverage.value, babySeat: false });
  if (!ok) return;
  copied.value = true;
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => { copied.value = false; }, 2000);
}

onBeforeUnmount(() => clearTimeout(resetTimer));
</script>
