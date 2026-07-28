<template>
  <!-- Foto full-bleed (carretera + llaves) compartida por ambos estados; el
       contenido va en cards blancas tipo tiquete. Diseño promovido de
       lab-reservado-tiquete (concepto tiquete--gpt-image-2, 2026-07-28). -->
  <div class="relative min-h-screen bg-cover bg-center bg-[url('/images/reservado/fondo-tiquete.webp')]">
    <div class="absolute inset-0 bg-black/10" aria-hidden="true" />

    <div
      v-if="validation.status === 'unavailable'"
      data-reservation-state="unavailable"
      class="relative max-w-2xl mx-auto px-4 py-12 sm:py-16"
      role="status"
    >
      <div class="bg-white rounded-3xl shadow-2xl px-6 py-12 text-center">
        <h1 class="font-heading font-extrabold text-3xl sm:text-4xl text-gray-900 mb-4">Estamos verificando tu reserva</h1>
        <p class="text-lg text-gray-600">Intenta en unos minutos.</p>
      </div>
    </div>

    <div
      v-else
      data-reservation-state="confirmed"
      class="relative max-w-2xl mx-auto px-4 py-12 sm:py-16"
    >
      <div class="shadow-2xl">
        <!-- Bloque superior del tiquete -->
        <div class="bg-white rounded-t-3xl px-6 pt-10 pb-8 text-center">
          <!-- Icono checkmark (verde — semántica "confirmada") -->
          <div class="pb-4 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="60px" height="60px" fill="#15803d" aria-hidden="true">
              <path d="M243.8 339.8C232.9 350.7 215.1 350.7 204.2 339.8L140.2 275.8C129.3 264.9 129.3 247.1 140.2 236.2C151.1 225.3 168.9 225.3 179.8 236.2L224 280.4L332.2 172.2C343.1 161.3 360.9 161.3 371.8 172.2C382.7 183.1 382.7 200.9 371.8 211.8L243.8 339.8zM512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48z"/>
            </svg>
          </div>

          <h1 class="font-heading font-extrabold text-3xl sm:text-4xl text-gray-900 mb-6">
            ¡Tu reserva está confirmada!
          </h1>

          <p class="text-lg text-gray-600 mb-2">Código de reserva:</p>
          <div class="flex flex-wrap items-center justify-center gap-3 mb-2">
            <p class="font-heading font-extrabold tracking-tight text-3xl sm:text-4xl text-gray-900">{{ reserveCode }}</p>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full border border-red-600 px-3 py-1.5 text-sm font-semibold transition-colors"
              :class="copied ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50 active:bg-red-100'"
              :aria-label="copied ? 'Código copiado' : 'Copiar código de reserva'"
              @click="copyCode"
            >
              <svg v-if="!copied" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
              {{ copied ? '¡Copiado!' : 'Copiar' }}
            </button>
          </div>
          <p class="text-sm text-gray-500">
            Guárdalo: lo necesitas para recoger el vehículo.
          </p>
        </div>

        <!-- Divisor perforado: muescas laterales + línea punteada -->
        <div class="ticket-divider bg-white" aria-hidden="true">
          <div class="border-t-2 border-dashed border-gray-300 mx-8" />
        </div>

        <!-- Bloque inferior del tiquete -->
        <div class="bg-white rounded-b-3xl px-6 pt-8 pb-10 text-center">
          <div class="border border-gray-200 rounded-2xl p-5 mb-5">
            <h2 class="font-heading font-bold text-gray-900 mb-4">Te enviamos la confirmación por:</h2>
            <div class="flex flex-wrap justify-center gap-x-10 gap-y-3">
              <div class="flex items-center gap-2 text-gray-800">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.24-8.23 8.24m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29"/></svg>
                <span>WhatsApp</span>
              </div>
              <div class="flex items-center gap-2 text-gray-800">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <span>Correo electrónico</span>
              </div>
            </div>
            <p class="text-sm text-gray-500 mt-4">
              Busca el correo de Alquílame. Si no aparece, revisa la carpeta de spam.
            </p>
          </div>

          <div class="border border-gray-200 rounded-2xl p-5 mb-6">
            <h2 class="font-heading font-bold text-gray-900 mb-2">¿Necesitas modificar o cancelar?</h2>
            <p class="text-gray-600 mb-1">
              Escríbenos con tu código de reserva a la mano.
            </p>
            <p class="text-sm text-gray-500 mb-4">
              Lunes a viernes 7:00 a.&nbsp;m. – 7:00 p.&nbsp;m. · Sábados 7:00 a.&nbsp;m. – 4:00 p.&nbsp;m.
            </p>
            <a
              :href="whatsappHref"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center justify-center gap-2 font-semibold rounded-full bg-[#1faa53] text-white hover:bg-[#178a44] px-6 py-2.5 text-base transition-all duration-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.24-8.23 8.24m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29"/></svg>
              Escribir por WhatsApp
            </a>
          </div>

          <p class="font-heading italic font-bold text-2xl text-red-600">¡Buen viaje!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useReservationConfirmation from '@rentacar-main/logic/composables/useReservationConfirmation'

const validation = await useReservationConfirmation()
const reserveCode = validation.reserveCode

const { franchise } = useAppConfig()
const whatsappHref = computed(() => {
  const text = encodeURIComponent(`Hola, mi código de reserva es ${reserveCode ?? ''}`)
  return `${franchise.whatsapp}?text=${text}`
})

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copyCode() {
  if (!reserveCode) return
  try {
    await navigator.clipboard.writeText(reserveCode)
    copied.value = true
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard bloqueado (permiso/contexto no seguro): el código sigue
    // seleccionable a mano.
  }
}

useHead({
  title: validation.status === 'found'
    ? 'Reserva confirmada'
    : 'Verificando reserva',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

useSeoMeta({
  description: validation.status === 'found'
    ? 'Tu reserva de alquiler de carro ha sido confirmada. Revisa tu correo para los detalles.'
    : 'Estamos verificando tu reserva. Intenta en unos minutos.',
})

// Lazy load js-confetti (solo se carga en esta página de confirmación)
onMounted(async () => {
  if (validation.status !== 'found') return

  const JSConfetti = (await import('js-confetti')).default
  const confetti = new JSConfetti()
  confetti.addConfetti()
})
</script>

<style scoped>
/* Muescas del tiquete: el mask recorta dos semicírculos transparentes en los
   bordes del divisor, dejando ver la foto de fondo — el troquel clásico.
   Dos capas radial-gradient (cada una tapa todo menos su círculo) compuestas
   con intersect para que ambas muescas apliquen a la vez. */
.ticket-divider {
  height: 32px;
  display: flex;
  align-items: center;
  mask-image:
    radial-gradient(circle 16px at 0 50%, transparent 15px, black 16px),
    radial-gradient(circle 16px at 100% 50%, transparent 15px, black 16px);
  mask-composite: intersect;
  -webkit-mask-image:
    radial-gradient(circle 16px at 0 50%, transparent 15px, black 16px),
    radial-gradient(circle 16px at 100% 50%, transparent 15px, black 16px);
  -webkit-mask-composite: source-in;
}
.ticket-divider > div {
  flex: 1;
}
</style>
