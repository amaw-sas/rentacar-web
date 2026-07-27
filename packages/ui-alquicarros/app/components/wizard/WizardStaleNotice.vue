<template>
  <!--
    Aviso de cotización rancia (issue #401). Cuando el tramo vivo deja de coincidir
    con el que pidió la disponibilidad en pantalla, la cotización se descarta: el
    precio ya no aplica y la disponibilidad tampoco. Este bloque SUSTITUYE el
    contenido de los pasos 2-4 (grid de gamas, comparador de seguro, adicionales)
    para no afirmar precios ni disponibilidad que ya no valen; explica por qué y
    ofrece la vía de vuelta a la búsqueda.

    Aparece sobre dos fondos (bg-white en el sidebar, bg-surface-soft en el
    contenedor de pasos): ámbar sobre ambos, texto gray-900/gray-700 — medido AA.
  -->
  <div
    class="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center"
    data-testid="wizard-stale-notice-test"
  >
    <p class="heading-sub text-gray-900">Cambiaste los datos de búsqueda</p>
    <p class="mt-1 body-base text-gray-700">
      Pulsa BUSCAR para ver la disponibilidad y los precios de este nuevo trayecto.
    </p>
    <div class="mt-4">
      <button
        type="button"
        class="body-sm font-bold text-brand-800 underline underline-offset-4 hover:text-brand-900"
        data-testid="wizard-adjust-search-test"
        @click="$emit('adjust-search')"
      >
        Ajustar búsqueda
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  /** El usuario pide volver a la búsqueda (Paso 1 en /reservas, #searcher en city). */
  (e: 'adjust-search'): void
}>()
</script>
