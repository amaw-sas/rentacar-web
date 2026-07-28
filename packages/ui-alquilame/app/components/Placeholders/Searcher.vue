<template>
    <!--
      Esqueleto del buscador. Se pinta en SSR como #fallback de <ClientOnly>
      (reservas/index.vue, city/Hero.vue, reservas/Results.vue) y el cliente lo
      HIDRATA, así que su marcado tiene que ser idéntico en servidor y cliente.

      Por eso aquí no hay <u-form> ni <u-form-field>: los dos piden su id a
      `useId()` de Vue, y ese contador se bifurca en cada frontera asíncrona que
      haya por encima (`markAsyncBoundary`). <Icon> (NuxtIconCss) es una frontera
      asíncrona en el servidor pero no en el bundle cliente de producción, así que
      el icono del header consumía una bifurcación solo en SSR y los ids salían
      corridos: servidor `v-0-1-*` / `v-0-2-*`, cliente `v-0-0-*` / `v-0-1-*`.
      Resultado en producción (28-jul): 14 avisos de hidratación y el error
      "Hydration completed but contains mismatches" en /reservas.

      El marcado replica clase por clase lo que renderizaba UFormField (root /
      wrapper / labelWrapper / label + contenedor del control), incluidos los
      `data-slot` — base.css engancha selectores en ellos — para que el esqueleto
      siga ocupando exactamente la misma caja y no reaparezca el CLS del #109. La
      etiqueta es un <span> y no un <label>: el esqueleto no tiene ningún control
      al que apuntar, y el `for` anterior señalaba a un id inexistente.
    -->
    <form class="w-full mx-auto grid grid-cols-2 auto-rows-min gap-2 light">
        <div
            v-for="field in fields"
            :key="field.label"
            class="bg-white rounded-xl p-2 shadow-sm"
            :class="{ 'col-span-2': field.wide }"
        >
            <div data-slot="root" class="text-base">
                <div data-slot="wrapper" class="">
                    <div
                        data-slot="labelWrapper"
                        class="flex content-center items-center justify-between"
                    >
                        <span
                            data-slot="label"
                            class="block font-normal text-default text-sm pl-1"
                            >{{ field.label }}</span
                        >
                    </div>
                </div>
                <div class="mt-0.5 relative">
                    <u-progress class="w-full py-3" v-model="progress" />
                </div>
            </div>
        </div>
        <div class="col-span-2">
            <u-button
                type="submit"
                class="search-button"
                size="xl"
                disabled
            >
                BUSCAR VEHÍCULOS
            </u-button>
        </div>
    </form>
</template>

<script setup lang="ts">
const progress = ref(null);

// Mismo orden y mismos anchos que el Searcher real: sede de recogida y de
// devolución a lo ancho, y los cuatro campos de fecha/hora en dos columnas.
const fields = [
    { label: 'Lugar de recogida', wide: true },
    { label: 'Lugar de devolución', wide: true },
    { label: 'Día de recogida', wide: false },
    { label: 'Día de devolución', wide: false },
    { label: 'Hora de recogida', wide: false },
    { label: 'Hora de devolución', wide: false },
];
</script>
