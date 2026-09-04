<template>
  <!-- Notas de diseño y de negocio: ver el bloque del <script setup>. Vue emite
       los comentarios del template al HTML en desarrollo y preview, así que
       aquí no va contexto interno. -->
  <div class="bg-white min-h-dvh">
    <section class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 text-center">
      <h1 class="heading-page">¿Cómo te fue con tu alquiler?</h1>

      <p class="body-lg mt-4">
        Tu opinión nos toma menos de un minuto y nos dice qué mejorar.
      </p>

      <StarRating
        :model-value="rating"
        :disabled="rating !== null"
        class="mt-8"
        @update:model-value="onRate"
      />

      <!--
        La región live nace VACÍA y siempre presente. Un aria-live que aparece
        con el texto ya dentro no lo anuncian ni VoiceOver ni JAWS: hace falta
        que la región exista antes de que cambie su contenido.

        Sólo habla la rama de Google. La de 1-3★ no necesita anuncio porque el
        foco se mueve al formulario, y dos avisos a la vez se pisan.
      -->
      <p
        role="status"
        aria-live="polite"
        :class="announcement ? 'body-lg font-semibold text-gray-900 mt-8' : 'sr-only'"
      >
        {{ announcement }}
      </p>

      <!--
        Salida manual: si la redirección no dispara (pestaña en segundo plano,
        bloqueador), sigue habiendo por dónde salir. Sin `rel="noopener"`, que
        no hace nada sin target y cuyo `noreferrer` le quitaba a Google la
        atribución sólo de este enlace y no la del salto automático.
      -->
      <a
        v-if="isHighRating"
        :href="GBP_URL"
        class="mt-3 inline-block text-red-700 font-semibold hover:underline"
      >
        Abrir la ficha de Alquilatucarro en Google
      </a>
    </section>

    <!-- 1-3★: el reclamo se queda en casa, en esta misma página. -->
    <section
      v-if="isLowRating"
      class="bg-[#EDF0F5] py-12 md:py-16"
    >
      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <!--
          tabindex -1 para poder llevarle el foco: al calificar, el formulario
          se monta más abajo del pliegue en móvil y el foco se queda arriba.
          Sin esto la persona ve las estrellas doradas, no ve nada más y cierra.
        -->
        <h2 ref="complaintHeading" tabindex="-1" class="heading-section text-gray-900">
          Cuéntanos qué pasó
        </h2>
        <p class="body-base mt-2 mb-8">
          Lo leemos nosotros, no un formulario automático, y te respondemos al
          correo que nos dejes.
        </p>

        <PublicContactForm
          type="resenas"
          :fields="fields"
          :extra-fields="extraFields"
          submit-label="Enviar mi comentario"
          success-message="Gracias por contarnos. Te respondemos al correo que nos dejaste."
        />

        <p class="body-sm mt-8">
          Al enviarlo autorizas el tratamiento de tus datos para atender tu caso,
          según la
          <NuxtLink to="/politica-privacidad" class="text-red-700 font-semibold hover:underline">
            política de privacidad
          </NuxtLink>.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * Calificación posterior al alquiler. El enlace se envía por WhatsApp o correo
 * cuando el cliente devuelve el carro; no es tráfico orgánico, por eso va
 * noindex y fuera del sitemap.
 *
 * Puerto de `ui-alquilame/app/pages/opinion.vue`. Las dos páginas son la misma
 * salvo la ficha de Google, el nombre de la marca y la paleta (alquilatucarro
 * no tiene la escala `brand-*`, usa `red-*`): un cambio de comportamiento en
 * una tiene que replicarse en la otra o las marcas se separan en silencio.
 *
 * La ruta es /opinion sin tilde a propósito: sobrevive al copiar y pegar entre
 * WhatsApp y la barra del navegador.
 *
 * La calificación NO viaja por la URL y, una vez elegida, las estrellas quedan
 * bloqueadas: permitir re-calificar invita a tantear dónde está el umbral que
 * lleva a Google.
 *
 * El filtro por estrellas se conserva por decisión explícita del dueño,
 * informado de que la política de Google prohíbe pedir reseñas selectivamente.
 * No reabrir la discusión aquí.
 */
import type { PublicFormField } from '~/components/PublicContactForm.vue'

// Con el layout por defecto, igual que /gana.
// Se probó `definePageMeta({ layout: false })` para dejar una pantalla enfocada
// sin cabecera: NO surte efecto en esta página (sí en /chat, con la misma
// directiva) y la causa no se encontró. Antes que dejar en el código una
// afirmación que el navegador desmiente, se quitó. Si se quiere la pantalla
// desnuda, hay que resolver primero por qué el macro se ignora aquí.
//
// Por eso tampoco va el logo dentro de la página: lo pinta la cabecera del
// layout y se veía dos veces.

/**
 * Ficha de Google Business Profile de alquilatucarro, con el cuadro de reseña
 * ya abierto. El `!12e1` del final es lo que lo abre; sin él se cae en la ficha
 * y hay que buscar el botón.
 *
 * alquilame usa la forma corta `g.page/r/<id>/review`; esta ficha no tiene ese
 * alias en su panel de GBP, así que va el enlace largo. El `1s0x…:0x…` es el
 * identificador del negocio, sacado de expandir su enlace corto de Maps. Si el
 * alias corto aparece algún día, es cambiar esta constante y nada más.
 */
const GBP_URL
  = 'https://www.google.com/maps/place//data=!4m3!3m2!1s0xa2258f5934dd7fc3:0x61229dafa110309c!12e1'
/** Desde cuántas estrellas se considera reseña pública. */
const HIGH_RATING_MIN = 4
/** Igual que el original: da tiempo a leer el agradecimiento antes de saltar. */
const REDIRECT_MS = 800

const rating = ref<number | null>(null)
const isHighRating = computed(() => rating.value !== null && rating.value >= HIGH_RATING_MIN)
const isLowRating = computed(() => rating.value !== null && rating.value < HIGH_RATING_MIN)

const announcement = computed(() =>
  isHighRating.value
    ? '¡Gracias por calificarnos! Redirigiendo… te llevamos a Google para que dejes tu reseña.'
    : '',
)

/** Viaja en el POST sin ser un campo visible ni editable del formulario. */
const extraFields = computed(() => ({ estrellas: `${rating.value} de 5` }))

const complaintHeading = ref<HTMLElement | null>(null)

let redirectTimer: ReturnType<typeof setTimeout> | null = null

function onRate(value: number) {
  // Segunda barrera además del `disabled` del widget: un segundo voto abriría
  // otro temporizador y dejaría dos ramas vivas a la vez.
  if (rating.value !== null) return
  rating.value = value

  if (value < HIGH_RATING_MIN) {
    // El foco vive en la estrella recién confirmada, que ya no responde. Se
    // lleva al encabezado del formulario: el navegador lo desplaza a la vista
    // (móvil) y el lector de pantalla anuncia dónde quedó la persona.
    nextTick(() => complaintHeading.value?.focus())
    return
  }

  redirectTimer = setTimeout(() => {
    // `replace` en vez de push: sin esto el historial queda [.., /opinion,
    // Maps] y volver con Atrás restaura /opinion desde bfcache con el estado
    // congelado en «Redirigiendo…» y las estrellas muertas.
    navigateTo(GBP_URL, { external: true, replace: true })
  }, REDIRECT_MS)
}

// Aun con `replace`, Safari y Firefox pueden devolver la página desde bfcache
// (el enlace manual, un Atrás encadenado) con el heap intacto: rating puesto y
// el temporizador ya gastado. Recargar la deja utilizable otra vez. Mismo
// remedio que Searcher.vue para el mismo problema.
function onPageShow(event: PageTransitionEvent) {
  if (event.persisted) window.location.reload()
}

// Ambos ganchos corren sólo en el cliente (el servidor nunca monta ni desmonta),
// así que `window` está disponible sin guarda.
onMounted(() => window.addEventListener('pageshow', onPageShow))

// Salir de la página antes de los 800 ms no debe arrastrar a Google después.
onBeforeUnmount(() => {
  if (redirectTimer) clearTimeout(redirectTimer)
  window.removeEventListener('pageshow', onPageShow)
})

const fields: PublicFormField[] = [
  { name: 'nombre', label: 'Nombre completo', type: 'text', required: true, autocomplete: 'name' },
  { name: 'email', label: 'Correo electrónico', type: 'email', required: true, autocomplete: 'email' },
  { name: 'telefono', label: 'Teléfono (opcional)', type: 'tel', inputmode: 'tel', autocomplete: 'tel' },
  { name: 'reserva', label: 'Número de reserva (opcional)', type: 'text' },
  { name: 'mensaje', label: 'Cuéntanos qué pasó', type: 'textarea', required: true },
]

useHead({
  title: 'Califica tu experiencia',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

useSeoMeta({
  description: 'Cuéntanos cómo te fue con tu alquiler de carro en Alquilatucarro.',
})
</script>
