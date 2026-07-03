<template>
  <!--
    Paso 1 del wizard — Búsqueda. Envuelve el Searcher existente sin tocarlo (mismo
    componente → mismos data-testid, misma navegación). Reusa el patrón CLS del
    /reservas anterior: ClientOnly + PlaceholdersSearcher de altura fija, para que
    la hidratación no cause salto y ninguna llamada a la fecha actual quede en el
    SSR/ISR (issue #109). El hero naranja de marca envuelve el motor.
  -->
  <section
    id="hero"
    class="relative overflow-hidden bg-linear-to-br from-hero-from to-hero-to [--ctx-text-primary:#fff]"
  >
    <div id="searcher" aria-hidden="true" class="absolute scroll-mt-20" />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 w-full">
      <div class="grid lg:grid-cols-2 gap-10 items-center">
        <div class="text-center lg:text-left">
          <p class="heading-label text-white/80 mb-3">Reserva en 5 pasos, sin anticipos</p>
          <h1 class="heading-page text-white leading-[1.1]">
            ¿Dónde y cuándo necesitas tu carro?
          </h1>
          <p class="mt-4 body-lg text-white/85 max-w-xl mx-auto lg:mx-0">
            Elige sucursal de recogida, fechas y horarios. Te mostramos la
            disponibilidad y el precio al instante, y te acompañamos paso a paso
            hasta confirmar.
          </p>
        </div>

        <div class="flex items-center justify-center">
          <div class="w-full max-w-lg mx-auto">
            <div class="hidden lg:block h-[410px]">
              <ClientOnly>
                <Searcher />
                <template #fallback>
                  <PlaceholdersSearcher />
                </template>
              </ClientOnly>
            </div>
            <div class="lg:hidden h-[360px]">
              <ClientOnly>
                <Searcher />
                <template #fallback>
                  <PlaceholdersSearcher />
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// External
import { defineAsyncComponent } from 'vue'

const Searcher = defineAsyncComponent(() => import('../../Searcher.vue'))
const PlaceholdersSearcher = defineAsyncComponent(
  () => import('../../Placeholders/Searcher.vue'),
)
</script>
