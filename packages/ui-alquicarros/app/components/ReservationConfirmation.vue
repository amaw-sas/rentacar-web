<template>
  <!-- Estado "verificando": el lookup de existencia no está disponible. Ya no es
       un callejón sin salida — ofrece reintento y contacto. -->
  <div
    v-if="status === 'unavailable'"
    data-reservation-state="unavailable"
    class="text-white max-w-2xl mx-auto text-center py-12 px-4 [--ctx-text-primary:#fff]"
    role="status"
  >
    <h1 class="heading-page mb-4">Estamos verificando tu reserva</h1>
    <p class="text-lg text-white/80 mb-6">Puede tardar unos minutos. Reintenta o escríbenos.</p>
    <button
      type="button"
      data-testid="retry"
      class="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2 font-semibold text-brand-900 hover:bg-white/90"
      @click="reload"
    >
      Reintentar
    </button>
    <div class="mt-8">
      <div class="flex flex-wrap justify-center gap-3">
        <a
          v-for="c in contactLinks"
          :key="c.testid"
          :data-testid="c.testid"
          :href="c.href"
          class="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-white hover:bg-white/25"
        >
          <span aria-hidden="true">{{ c.icon }}</span><span>{{ c.label }}</span>
        </a>
      </div>
    </div>
  </div>

  <!-- Estado confirmado. Fondo oscuro/rojo de marca → [--ctx-text-primary:#fff]. -->
  <div
    v-else
    data-reservation-state="confirmed"
    class="text-white max-w-2xl mx-auto text-center py-12 px-4 [--ctx-text-primary:#fff]"
    role="status"
  >
    <div class="pb-4 flex justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="64px" height="64px" fill="#15803d" aria-hidden="true">
        <path d="M243.8 339.8C232.9 350.7 215.1 350.7 204.2 339.8L140.2 275.8C129.3 264.9 129.3 247.1 140.2 236.2C151.1 225.3 168.9 225.3 179.8 236.2L224 280.4L332.2 172.2C343.1 161.3 360.9 161.3 371.8 172.2C382.7 183.1 382.7 200.9 371.8 211.8L243.8 339.8zM512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48z"/>
      </svg>
    </div>

    <h1 class="heading-page mb-4">¡Tu reserva está confirmada!</h1>

    <p class="text-lg text-white/80 mb-2">Código de reserva:</p>
    <div class="flex items-center justify-center gap-3 mb-1">
      <h2 class="heading-hero text-4xl">{{ reserveCode }}</h2>
      <button
        type="button"
        data-testid="copy-code"
        aria-label="Copiar código de reserva"
        class="inline-flex items-center justify-center rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
        @click="copyCode"
      >
        <span aria-hidden="true">📋</span>
      </button>
    </div>
    <p
      v-if="copied"
      data-testid="copy-feedback"
      role="status"
      aria-live="polite"
      class="text-sm text-white/80 mb-2"
    >
      Código copiado
    </p>
    <div class="h-1 w-10 rounded-full bg-brand-600 my-6 mx-auto" aria-hidden="true" />

    <!-- Recap: solo en sesión con snapshot que describe ESTA reserva. -->
    <div
      v-if="show && recap"
      data-testid="reservation-recap"
      class="bg-white/10 rounded-2xl p-6 mb-6 text-left"
    >
      <h2 class="heading-sub mb-4 text-center">Tu reserva</h2>
      <p class="body-sm text-white/90 mb-2">
        <span class="text-white/60">Vehículo:</span> {{ recap.categoryName }}
      </p>
      <p class="body-sm text-white/90 mb-2">
        <span class="text-white/60">Recogida:</span>
        {{ recapBranchLine(recap.pickupBranch, recap.pickupCity, recap.pickupDate, recap.pickupTime) }}
      </p>
      <p class="body-sm text-white/90 mb-2">
        <span class="text-white/60">Devolución:</span>
        {{ recapBranchLine(recap.returnBranch, recap.returnCity, recap.returnDate, recap.returnTime) }}
      </p>
      <p v-if="recap.days" class="body-sm text-white/90 mb-2">
        <span class="text-white/60">Duración:</span> {{ recap.days }} días
      </p>
      <p class="body-sm text-white/90 mb-2">
        <span class="text-white/60">Cobertura:</span> {{ recap.insuranceLabel }}
      </p>
      <p v-if="recap.mileageLabel" class="body-sm text-white/90 mb-2">
        <span class="text-white/60">Kilometraje:</span> {{ recap.mileageLabel }}
      </p>
      <p class="body-md font-semibold text-white mt-3">Total: {{ recap.total }}</p>
    </div>

    <!-- Qué llevar: requisitos estáticos, no dependen de datos de la reserva. -->
    <div class="bg-white/10 rounded-2xl p-6 mb-6 text-left">
      <h2 class="heading-sub mb-3 text-center">Qué llevar el día de la recogida</h2>
      <ul class="space-y-1">
        <li
          v-for="req in requirements"
          :key="req"
          class="flex items-start gap-2 body-sm text-white/90"
        >
          <span aria-hidden="true" class="shrink-0">✅</span><span>{{ req }}</span>
        </li>
      </ul>
    </div>

    <div class="bg-white/10 rounded-2xl p-6 mb-6">
      <h2 class="heading-sub mb-4">Te notificaremos por:</h2>
      <div class="flex justify-center gap-8">
        <div class="flex items-center gap-2"><span class="text-2xl" aria-hidden="true">📱</span><span>WhatsApp</span></div>
        <div class="flex items-center gap-2"><span class="text-2xl" aria-hidden="true">📧</span><span>Correo electrónico</span></div>
      </div>
      <p class="text-sm text-white/60 mt-4">Revisa tu bandeja de entrada y carpeta de spam</p>
    </div>

    <!-- Modificar/Cancelar: ahora enlaza contactos reales. -->
    <div class="bg-white/10 rounded-2xl p-6 mb-6">
      <h2 class="heading-sub mb-2">¿Necesitas modificar o cancelar?</h2>
      <p class="text-white/70 mb-4">Escríbenos y te respondemos en horario laboral.</p>
      <div class="flex flex-wrap justify-center gap-3">
        <a
          v-for="c in contactLinks"
          :key="c.testid"
          :data-testid="c.testid"
          :href="c.href"
          class="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-white hover:bg-white/25"
        >
          <span aria-hidden="true">{{ c.icon }}</span><span>{{ c.label }}</span>
        </a>
      </div>
    </div>

    <p class="text-lg mt-4">¡Buen viaje! 🚗</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RESERVATION_REQUIREMENTS } from '~/config/reservationRequirements'
import type { ReservationRecapView } from '~/composables/useReservationRecap'

const props = defineProps<{
  status: 'found' | 'unavailable'
  reserveCode: string | null
  show: boolean
  recap: ReservationRecapView | null
  whatsappUrl: string
  email: string
  phone: string
}>()

const requirements = RESERVATION_REQUIREMENTS

const contactLinks = computed(() => [
  { testid: 'contact-whatsapp', href: props.whatsappUrl, label: 'WhatsApp', icon: '📱' },
  { testid: 'contact-email', href: `mailto:${props.email}`, label: 'Correo', icon: '📧' },
  { testid: 'contact-phone', href: `tel:${props.phone}`, label: 'Llamar', icon: '📞' },
])

const copied = ref(false)

async function copyCode(): Promise<void> {
  if (!props.reserveCode) return
  const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined
  if (!clipboard) return // sin clipboard: el código queda seleccionable, sin romper
  try {
    await clipboard.writeText(props.reserveCode)
    copied.value = true
  } catch {
    /* degradar en silencio: el usuario puede seleccionar el código a mano */
  }
}

function reload(): void {
  if (typeof window !== 'undefined') window.location.reload()
}

/** "Sede, ciudad · fecha hora" saltando las partes ausentes, sin `undefined`. */
function recapBranchLine(
  branch: string | null,
  city: string | null,
  date: string | null,
  time: string | null,
): string {
  const place = [branch, city].filter(Boolean).join(', ')
  const when = [date, time].filter(Boolean).join(' ')
  return [place, when].filter(Boolean).join(' · ')
}
</script>
