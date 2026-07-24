<template>
  <!--
    Formulario público reutilizable (quejas y reclamos / registro de flota).

    Postea a /api/contact, que valida de nuevo en el servidor: la validación de
    cliente es sólo para dar feedback rápido, nunca es la fuente de verdad.

    Accesibilidad: cada campo tiene <label> asociado, los inválidos marcan
    aria-invalid + aria-describedby hacia su mensaje, y el resultado del envío se
    anuncia por una región aria-live (si no, quien usa lector de pantalla no se
    entera de que se envió).

    Antispam: el honeypot `website` va oculto por CSS (no `display:none` en un
    input real, que algunos navegadores omiten al enviar) y con tabindex -1 para
    que nadie llegue a él tabulando.
  -->
  <form class="space-y-5" novalidate @submit.prevent="submit">
    <div v-for="f in fields" :key="f.name">
      <!--
        Casilla única (p. ej. aceptar una condición). Va con su label AL LADO,
        no encima: una casilla con la etiqueta arriba se lee como un título
        suelto y se pierde la relación con el control.
      -->
      <template v-if="f.type === 'checkbox'">
        <div class="flex items-start gap-3">
          <input
            :id="`f-${f.name}`"
            v-model="values[f.name]"
            type="checkbox"
            :aria-invalid="Boolean(errors[f.name])"
            :aria-describedby="errors[f.name] ? `e-${f.name}` : undefined"
            class="mt-1 size-5 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-2 focus:ring-brand-500"
          >
          <label :for="`f-${f.name}`" class="text-sm text-gray-700 leading-relaxed">
            {{ f.label }}
            <span v-if="f.required" class="text-brand-600" aria-hidden="true">*</span>
            <span v-if="f.required" class="sr-only">(obligatorio)</span>
          </label>
        </div>
        <p v-if="errors[f.name]" :id="`e-${f.name}`" class="mt-1.5 text-sm text-brand-700">
          {{ errors[f.name] }}
        </p>
      </template>

      <!--
        Selección múltiple. Es un <fieldset> con <legend> para que un lector de
        pantalla anuncie el grupo antes de cada opción; si fueran casillas
        sueltas, no se sabría a qué pregunta responden.
      -->
      <fieldset v-else-if="f.type === 'checkbox-group'">
        <legend class="block text-sm font-semibold text-gray-800 mb-2">
          {{ f.label }}
          <span v-if="f.required" class="text-brand-600" aria-hidden="true">*</span>
          <span v-if="f.required" class="sr-only">(obligatorio)</span>
        </legend>
        <div class="flex flex-wrap gap-x-6 gap-y-3">
          <div v-for="opt in f.options || []" :key="opt" class="flex items-center gap-2">
            <input
              :id="`f-${f.name}-${opt}`"
              v-model="groups[f.name]"
              type="checkbox"
              :value="opt"
              class="size-5 rounded border-gray-300 text-brand-600 focus:ring-2 focus:ring-brand-500"
            >
            <label :for="`f-${f.name}-${opt}`" class="text-sm text-gray-700">{{ opt }}</label>
          </div>
        </div>
        <p v-if="errors[f.name]" :id="`e-${f.name}`" class="mt-1.5 text-sm text-brand-700">
          {{ errors[f.name] }}
        </p>
      </fieldset>

      <template v-else>
      <label :for="`f-${f.name}`" class="block text-sm font-semibold text-gray-800 mb-1.5">
        {{ f.label }}
        <span v-if="f.required" class="text-brand-600" aria-hidden="true">*</span>
        <span v-if="f.required" class="sr-only">(obligatorio)</span>
      </label>

      <textarea
        v-if="f.type === 'textarea'"
        :id="`f-${f.name}`"
        v-model="values[f.name]"
        rows="5"
        :aria-invalid="Boolean(errors[f.name])"
        :aria-describedby="errors[f.name] ? `e-${f.name}` : undefined"
        class="w-full rounded-xl border px-4 py-3 text-gray-900 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
        :class="errors[f.name] ? 'border-brand-600' : 'border-gray-300'"
      />
      <input
        v-else
        :id="`f-${f.name}`"
        v-model="values[f.name]"
        :type="f.type"
        :inputmode="f.inputmode"
        :autocomplete="f.autocomplete"
        :aria-invalid="Boolean(errors[f.name])"
        :aria-describedby="errors[f.name] ? `e-${f.name}` : undefined"
        class="w-full rounded-xl border px-4 py-3 text-gray-900 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
        :class="errors[f.name] ? 'border-brand-600' : 'border-gray-300'"
      >

      <p v-if="errors[f.name]" :id="`e-${f.name}`" class="mt-1.5 text-sm text-brand-700">
        {{ errors[f.name] }}
      </p>
      </template>
    </div>

    <!-- Honeypot: invisible para personas, irresistible para bots -->
    <div class="absolute w-px h-px -m-px overflow-hidden" aria-hidden="true">
      <label for="f-website">No llenar</label>
      <input id="f-website" v-model="values.website" type="text" tabindex="-1" autocomplete="off">
    </div>

    <button
      type="submit"
      :disabled="sending"
      class="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-600 text-white font-semibold shadow-lg shadow-black/15 transition-all duration-200 hover:bg-brand-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
    >
      {{ sending ? 'Enviando…' : submitLabel }}
    </button>

    <!-- Resultado: anunciado a lectores de pantalla -->
    <p v-if="sent" role="status" aria-live="polite" class="rounded-xl bg-green-50 border border-green-200 text-green-800 px-4 py-3">
      {{ successMessage }}
    </p>
    <p v-else-if="failed" role="alert" class="rounded-xl bg-brand-50 border border-brand-200 text-brand-800 px-4 py-3">
      {{ failed }}
    </p>
  </form>
</template>

<script setup lang="ts">
export interface PublicFormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'checkbox' | 'checkbox-group'
  required?: boolean
  inputmode?: string
  autocomplete?: string
  /** Sólo para checkbox-group: las opciones a marcar. */
  options?: string[]
}

const props = withDefaults(
  defineProps<{
    /** Discriminante que recibe el servidor. */
    type: 'quejas' | 'flota'
    fields: PublicFormField[]
    submitLabel?: string
    successMessage?: string
  }>(),
  {
    submitLabel: 'Enviar',
    successMessage: '¡Listo! Recibimos tu mensaje y te responderemos pronto.',
  },
)

// `values` guarda texto y casillas simples; `groups` guarda las selecciones
// múltiples (arrays). Se separan porque v-model sobre un array y sobre un string
// no conviven en el mismo objeto sin volver el tipado un desastre.
const values = reactive<Record<string, string | boolean>>({ website: '' })
const groups = reactive<Record<string, string[]>>({})
for (const f of props.fields) {
  if (f.type === 'checkbox-group') groups[f.name] = []
  else if (f.type === 'checkbox') values[f.name] = false
  else values[f.name] = ''
}

const errors = reactive<Record<string, string>>({})
const sending = ref(false)
const sent = ref(false)
const failed = ref('')

function validateLocally(): boolean {
  for (const key of Object.keys(errors)) delete errors[key]
  for (const f of props.fields) {
    if (!f.required) continue
    if (f.type === 'checkbox-group') {
      if (!groups[f.name]?.length) errors[f.name] = 'Selecciona al menos una opción.'
    } else if (f.type === 'checkbox') {
      if (values[f.name] !== true) errors[f.name] = 'Debes aceptar esta condición para continuar.'
    } else if (!String(values[f.name] ?? '').trim()) {
      errors[f.name] = 'Este campo es obligatorio.'
    }
  }
  const email = String(values.email ?? '').trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Escribe un correo válido.'
  }
  return Object.keys(errors).length === 0
}

async function submit() {
  sent.value = false
  failed.value = ''
  if (!validateLocally()) return

  sending.value = true
  try {
    await $fetch('/api/contact', { method: 'POST', body: { type: props.type, ...values, ...groups } })
    sent.value = true
    // Limpiar para que no se reenvíe lo mismo por error.
    for (const f of props.fields) {
      if (f.type === 'checkbox-group') groups[f.name] = []
      else if (f.type === 'checkbox') values[f.name] = false
      else values[f.name] = ''
    }
  } catch (e) {
    // El servidor manda los campos faltantes cuando rechaza por validación.
    const missing = (e as { data?: { data?: { missing?: string[] } } })?.data?.data?.missing
    if (missing?.length) {
      for (const m of missing) errors[m] = 'Este campo es obligatorio.'
      failed.value = 'Revisa los campos marcados.'
    } else {
      failed.value =
        (e as { data?: { statusMessage?: string } })?.data?.statusMessage
        || 'No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.'
    }
  } finally {
    sending.value = false
  }
}
</script>
