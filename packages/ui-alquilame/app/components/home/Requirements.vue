<template>
  <!--
    F1 requirements — restyle of the design's #requirements (red accent bar,
    .heading-* title, green check-marked list). DATA: the 4 real requirements
    of the current home are preserved (copy unchanged). The design's photographic
    bleed is replaced by ImagesPersona (our real asset), wrapped in an
    aspect-ratio box (2000x1620 ≈ 100:81) to reserve space and avoid CLS.

    Gradient uses the v4 bg-linear utility (F0 lesson: the deprecated v3 alias with
    custom @theme tokens renders background-image:none).
  -->
  <section
    id="requisitos"
    class="bg-linear-to-b from-white to-gray-50 text-gray-900 py-12 md:py-16"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        <!-- Copy + requirements list -->
        <div class="max-w-xl">
          <div class="h-1 w-10 rounded-full bg-red-600 mb-4" aria-hidden="true" />
          <h2 class="heading-section text-3xl md:text-4xl text-gray-900 leading-tight mb-3">
            Requisitos para tu alquiler
          </h2>
          <p class="text-base text-gray-600 mb-8">
            En {{ franchise.shortname }} tu experiencia es sin complicaciones. Solo
            necesitas lo esencial para recoger tu carro.
          </p>

          <ul class="space-y-4">
            <li
              v-for="req in requirements"
              :key="req.title"
              class="flex items-start gap-3"
            >
              <span
                class="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-green-500 flex items-center justify-center"
                aria-hidden="true"
              >
                <svg
                  class="w-3 h-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <div>
                <div class="font-bold text-gray-900 uppercase tracking-wide text-sm">
                  {{ req.title }}
                </div>
                <div class="text-gray-600 text-sm">{{ req.detail }}</div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Visual column -->
        <div class="flex items-center justify-center">
          <!-- CLS fix: reserve space with aspect-ratio (2000x1620 ≈ 100:81) -->
          <div class="w-full max-w-lg aspect-[100/81]">
            <LazyImagesPersona hydrate-on-visible />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { franchise } = useAppConfig()

interface Requirement {
  title: string
  detail: string
}

// The 4 real requirements of the current home (copy preserved).
const requirements: Requirement[] = [
  { title: "Reserva previa", detail: "(más anticipación más descuento)" },
  { title: "Documento de identidad", detail: "(18+ Cédula o pasaporte original)" },
  { title: "Tarjeta de crédito", detail: "(Única forma de pago)" },
  { title: "Licencia de conducir", detail: "(física y vigente)" },
]
</script>
