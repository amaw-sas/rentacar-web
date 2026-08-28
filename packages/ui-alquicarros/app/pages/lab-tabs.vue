<script setup lang="ts">
/**
 * MAQUETA · las cuatro formas del selector de ventana, una debajo de otra.
 * Existe para comparar sin tocar la home. `?d=YYYY-MM-DD` simula el día.
 */
import { computed, ref } from 'vue'

definePageMeta({ layout: false })
useSeoMeta({ robots: 'noindex, nofollow' })

const route = useRoute()
const hoy = computed(() => {
  const q = String(route.query.d ?? '')
  return /^\d{4}-\d{2}-\d{2}$/.test(q)
    ? new Date(`${q}T00:00:00.000Z`)
    : new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`)
})

const bloque = computed(() => bloqueDe(hoy.value))
const salida = computed(() => primeraRecogida(new Date(hoy.value.getTime() + 9 * 3600000)))

const VENTANAS = computed(() => {
  const b = bloque.value
  const mas = (n: number) => new Date(hoy.value.getTime() + n * 86400000)
  return [
    {
      k: 'hoy',
      label: 'Un día',
      etiqueta: salida.value.rodo ? 'Mañana' : 'Hoy',
      when: `${fmtCorto(salida.value.fecha)} → ${fmtCorto(new Date(salida.value.fecha.getTime() + 86400000))}`,
      dias: 1,
    },
    {
      k: 'finde',
      label: b ? b.etiqueta : 'Fin de semana',
      etiqueta: b ? b.etiqueta : 'Fin de semana',
      when: b ? `${fmtCorto(b.recogida)} → ${fmtCorto(b.devolucion)}` : '',
      dias: b?.dias ?? 3,
    },
    {
      k: 'semana',
      label: 'Una semana',
      etiqueta: 'Una semana',
      when: `${fmtCorto(hoy.value)} → ${fmtCorto(mas(7))}`,
      dias: 7,
    },
  ]
})

const MOCK_BASE = 186700
const FACTOR: Record<number, number> = { 1: 1.111, 3: 1, 4: 0.995, 5: 0.99, 7: 0.966 }
function precioDe(v: { dias: number }) {
  const dia = Math.round((MOCK_BASE * (FACTOR[v.dias] ?? 1)) / 100) * 100
  return '$' + (dia * v.dias).toLocaleString('es-CO')
}

/** Cada variante mantiene su propia selección, para poder probarlas por separado. */
const sel = ref<Record<number, string>>({ 1: 'finde', 2: 'finde', 3: 'finde', 4: 'finde' })

const OPCIONES = [
  { n: 1, titulo: 'Segmentado con la fecha dentro', nota: 'Recupera las fechas sin gastar un renglón aparte.' },
  { n: 2, titulo: 'Tarjetas con precio', nota: 'Deja de ser selector y pasa a ser comparador: el argumento de «más días, más barato» se lee sin hacer clic.' },
  { n: 3, titulo: 'Subrayado', nota: 'La más ligera. No le compite protagonismo a las tarjetas y es la que mejor cabe en móvil.' },
  { n: 4, titulo: 'Barra continua, el número manda', nota: 'El número grande y el resto acompañando.' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-6 py-12 font-sans text-gray-900">
    <div class="mx-auto max-w-5xl">
      <p class="font-heading text-xs font-semibold tracking-widest text-brand-800 uppercase">
        Maqueta · alquicarros
      </p>
      <h1 class="mt-2 font-heading text-3xl font-extrabold">Selector de ventana — cuatro opciones</h1>
      <p class="mt-2 max-w-2xl text-gray-600">
        Las cuatro se pueden usar: haz clic para ver el estado activo. Los datos son los
        reales de la regla del bloque; con <code class="rounded bg-gray-200 px-1">?d=2026-03-30</code>
        se simula Semana Santa, con <code class="rounded bg-gray-200 px-1">?d=2026-12-07</code> una
        semana sin puente.
      </p>

      <section v-for="o in OPCIONES" :key="o.n" class="mt-12 border-t border-gray-200 pt-8">
        <div class="flex items-baseline gap-3">
          <span class="font-heading text-sm font-extrabold text-brand-800">{{ o.n }}</span>
          <h2 class="font-heading text-xl font-bold">{{ o.titulo }}</h2>
        </div>
        <p class="mt-1 max-w-2xl text-sm text-gray-600">{{ o.nota }}</p>

        <div class="mt-6">
          <!-- 1 -->
          <div v-if="o.n === 1" class="inline-flex gap-0.5 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              v-for="v in VENTANAS" :key="v.k" type="button"
              class="rounded-xl px-5 py-2.5 text-left transition-colors"
              :class="sel[1] === v.k ? 'bg-gray-700 text-white' : 'text-gray-900 hover:bg-gray-50'"
              @click="sel[1] = v.k"
            >
              <span class="block font-heading text-sm font-bold">{{ v.label }}</span>
              <span class="mt-0.5 block text-xs tabular-nums opacity-70">{{ v.when }}</span>
            </button>
          </div>

          <!-- 2 -->
          <div v-else-if="o.n === 2" class="grid max-w-2xl grid-cols-3 gap-2.5">
            <button
              v-for="v in VENTANAS" :key="v.k" type="button"
              class="rounded-xl bg-white px-3.5 py-3 text-left transition-shadow"
              :class="sel[2] === v.k ? 'shadow-lg ring-2 ring-gray-700' : 'ring-1 ring-gray-200'"
              @click="sel[2] = v.k"
            >
              <span
                class="block font-heading text-[11px] font-bold tracking-wider uppercase"
                :class="sel[2] === v.k ? 'text-brand-800' : 'text-gray-500'"
              >{{ v.label }}</span>
              <span class="mt-1 block font-heading text-lg font-extrabold tabular-nums">{{ precioDe(v) }}</span>
              <span class="mt-0.5 block text-[11px] tabular-nums text-gray-500">{{ v.when }}</span>
            </button>
          </div>

          <!-- 3 -->
          <div v-else-if="o.n === 3" class="inline-flex gap-7 border-b border-gray-200">
            <button
              v-for="v in VENTANAS" :key="v.k" type="button"
              class="-mb-px border-b-[3px] px-0.5 pb-3 text-[15px] transition-colors"
              :class="sel[3] === v.k ? 'border-brand-600 font-bold text-gray-900' : 'border-transparent font-medium text-gray-500 hover:text-gray-900'"
              @click="sel[3] = v.k"
            >
              {{ v.dias }} {{ v.dias === 1 ? 'día' : 'días' }} · {{ v.etiqueta }}
            </button>
          </div>

          <!-- 4 -->
          <div v-else class="inline-flex overflow-hidden rounded-full border border-gray-200 bg-white">
            <button
              v-for="(v, i) in VENTANAS" :key="v.k" type="button"
              class="px-6 py-3 transition-colors"
              :class="[
                sel[4] === v.k ? 'bg-gray-700 text-white' : 'text-gray-700 hover:bg-gray-50',
                i ? 'border-l border-gray-200' : '',
              ]"
              @click="sel[4] = v.k"
            >
              <span class="font-heading text-base font-extrabold tabular-nums">{{ v.dias }}</span>
              <span class="text-[13px] opacity-80">
                {{ v.dias === 1 ? 'día' : 'días' }} · {{ v.etiqueta }}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
