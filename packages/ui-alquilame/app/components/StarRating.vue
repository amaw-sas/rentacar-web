<template>
  <!--
    Calificación de 1 a 5 estrellas.

    El widget que venía de GoHighLevel eran <span> con un `click`: no se podía
    usar con teclado, no tenía nombre accesible y no anunciaba el estado. Aquí
    cada estrella es un <button role="radio"> dentro de un role="radiogroup",
    que es el patrón que los lectores de pantalla ya saben leer.

    Moverse y confirmar están SEPARADOS a propósito. Las flechas previsualizan
    (feedback inmediato) pero no emiten nada; emitir en cada flecha haría que
    pasar por la 2ª estrella camino a la 4ª abriera el formulario de queja y
    bloqueara el widget a mitad de recorrido. Confirman el clic, Enter y
    Espacio — los tres gestos que una persona entiende como "esta es".

    Por eso `aria-checked` sigue al valor CONFIRMADO y no a la previsualización:
    anunciar "3 estrellas, marcado" mientras la aplicación no ha registrado nada
    manda a la persona a cerrar la página creyendo que ya calificó.
  -->
  <div class="flex flex-col items-center">
    <div
      role="radiogroup"
      aria-label="Calificación de 1 a 5 estrellas"
      class="flex items-center justify-center gap-2"
      @mouseleave="hovered = null"
      @focusout="onFocusOut"
    >
      <button
        v-for="n in MAX"
        :ref="(el) => keepStarRef(el as HTMLButtonElement | null, n)"
        :key="n"
        type="button"
        role="radio"
        :aria-checked="selected === n"
        :aria-label="n === 1 ? '1 estrella' : `${n} estrellas`"
        :aria-disabled="disabled || undefined"
        :tabindex="n === focused ? 0 : -1"
        class="rounded-full p-1 transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        :class="disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'"
        @click="select(n)"
        @keydown="onKeydown($event, n)"
        @mouseenter="onHover(n)"
      >
        <!--
          Colores medidos contra WCAG 1.4.11 (objetos gráficos, mínimo 3:1
          sobre el fondo blanco de la página): #d97706 da 3,19:1 y #4b5563 da
          7,56:1. Los de antes (#f59e0b y #9ca3af) daban 2,15:1 y 2,56:1 — al
          sol, en un móvil, el contorno de las estrellas vacías desaparecía.

          Relleno contra contorno separa los dos estados por FORMA, no sólo por
          color: en escala de grises o con daltonismo el ámbar y el gris tienen
          luminancias casi iguales. `aria-checked` cierra el hueco para quien no
          ve ninguna de las dos.
        -->
        <svg
          viewBox="0 0 24 24"
          class="size-9 sm:size-11"
          :fill="n <= filledUpTo ? '#d97706' : 'none'"
          :stroke="n <= filledUpTo ? '#d97706' : '#4b5563'"
          stroke-width="1.5"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2.6l2.9 5.87 6.48.94-4.69 4.57 1.11 6.46L12 17.4l-5.8 3.04 1.11-6.46-4.69-4.57 6.48-.94z" />
        </svg>
      </button>
    </div>

    <!--
      Aquí vivía «Calificaste con N de 5». Se quitó: empujaba la página 161 px
      al tocar la estrella (medido en producción), y «Calificaste» daba por
      terminado algo que no lo estaba — todavía falta escribir la reseña.

      El rastro de "cuántas dejé" NO se pierde: lo lleva `aria-checked` en cada
      <button role="radio">, que es lo que anuncia el lector de pantalla. El
      <svg aria-hidden> nunca fue el único rastro; el pie de texto era redundante
      con el estado ARIA y costaba un salto de maquetación.
    -->
  </div>
</template>

<script setup lang="ts">
const MAX = 5

const props = withDefaults(
  defineProps<{
    modelValue: number | null
    /**
     * Congela el widget: deja de responder al puntero y al teclado, pero SIGUE
     * recibiendo foco. Con `disabled` nativo el navegador desenfoca el botón en
     * el mismo instante en que se marca (unfocusing steps del estándar), el foco
     * cae a <body> y el siguiente Tab reinicia desde el principio del documento.
     */
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

// Tres estados separados a propósito:
//   selected  — el valor CONFIRMADO. Espejo de `modelValue`, nunca se adelanta.
//   previewed — a dónde llevaron las flechas sin confirmar todavía.
//   hovered   — a dónde apunta el puntero.
// Sólo `selected` alimenta `aria-checked`; los otros dos son pintura.
const selected = ref<number | null>(props.modelValue)
const previewed = ref<number | null>(null)
const hovered = ref<number | null>(null)
/** Única estrella tabulable (roving tabindex). */
const focused = ref<number>(props.modelValue ?? 1)

// Congelado, la previsualización no manda: con el puntero apoyado en la 5ª y
// confirmando la 1ª por teclado quedaban 5 doradas encima del formulario de
// queja, sin forma de corregirlo salvo sacando el ratón del grupo.
const filledUpTo = computed(() => {
  if (props.disabled) return selected.value ?? 0
  return hovered.value ?? previewed.value ?? selected.value ?? 0
})

watch(
  () => props.modelValue,
  (value) => {
    selected.value = value
    previewed.value = null
    if (value !== null) focused.value = value
  },
)

// Las flechas tienen que mover el foco DEL DOM, no solo el estado: si no, el
// siguiente keydown lo sigue recibiendo la estrella anterior.
const stars: HTMLButtonElement[] = []
function keepStarRef(el: HTMLButtonElement | null, n: number) {
  if (el) stars[n - 1] = el
}

function onHover(n: number) {
  if (props.disabled) return
  hovered.value = n
}

/** Salir del grupo sin confirmar borra la previsualización de las flechas. */
function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (next && (event.currentTarget as HTMLElement).contains(next)) return
  previewed.value = null
  focused.value = selected.value ?? 1
}

function move(to: number) {
  const next = Math.min(MAX, Math.max(1, to))
  focused.value = next
  previewed.value = next
  stars[next - 1]?.focus()
}

function select(n: number) {
  if (props.disabled) return
  focused.value = n
  // No se marca aquí: `selected` sólo cambia cuando el padre acepta el valor.
  // Adelantarse dejaba widget y página contando cosas distintas cuando el padre
  // descartaba el segundo clic (estrellas doradas hasta la 5ª y un POST con 2).
  emit('update:modelValue', n)
}

function onKeydown(event: KeyboardEvent, n: number) {
  if (props.disabled) return

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      event.preventDefault()
      move(n + 1)
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      event.preventDefault()
      move(n - 1)
      break
    case 'Home':
      event.preventDefault()
      move(1)
      break
    case 'End':
      event.preventDefault()
      move(MAX)
      break
    case 'Enter':
    case ' ':
    case 'Spacebar':
      // preventDefault corta la activación nativa del <button>: sin esto el
      // navegador dispararía además su `click` y confirmaría dos veces.
      event.preventDefault()
      select(n)
      break
  }
}
</script>
