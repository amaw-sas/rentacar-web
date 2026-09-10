<template>
  <!--
    Quejas y reclamos.

    Reemplaza el Google Form que estaba en el footer: exigía iniciar sesión con
    una cuenta de Google, así que un cliente anónimo simplemente no podía
    quejarse. Ahora el canal vive en el sitio, sin login y a nombre de la marca.

    Fondo claro a propósito: es una página de trámite, no de marketing; el
    formulario debe leerse cómodo y sin ruido.
  -->
  <div class="bg-white">
    <section class="bg-linear-to-b from-footer-from to-footer-to [--ctx-text-primary:#fff]">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 text-center">
        <h1 class="heading-page text-white">Quejas y reclamos</h1>
        <div class="h-1 w-10 rounded-full bg-white/70 my-6 mx-auto" aria-hidden="true" />
        <p class="text-lg text-white/85">
          Cuéntanos qué pasó. Leemos todos los mensajes y te respondemos al correo
          que nos dejes.
        </p>
      </div>
    </section>

    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <PublicContactForm
        type="quejas"
        :fields="fields"
        submit-label="Enviar mi queja"
        :success-message="(r) => acuse(r)"
      />

      <p class="mt-6 body-sm">
        Puedes leer nuestra
        <NuxtLink to="/politica-privacidad" class="text-brand-700 font-semibold hover:underline">
          política de privacidad
        </NuxtLink>
        antes de enviar.
      </p>

      <p class="mt-6 body-sm">
        ¿Prefieres hablar con alguien?
        <a :href="franchise.whatsapp" target="_blank" rel="noopener noreferrer" class="text-brand-700 font-semibold hover:underline">
          Escríbenos por WhatsApp
        </a>
        o llámanos al
        <a :href="`tel:${franchise.phone.replace(/\s/g, '')}`" class="text-brand-700 font-semibold hover:underline">
          {{ franchise.phone }}
        </a>.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { PublicFormField } from '~/components/PublicContactForm.vue'
import { CONSENT_TEXT } from '~/utils/policy'

const { franchise } = useAppConfig()

/**
 * El acuse de recibo. Con radicado lo muestra —es el número con el que la persona puede
 * preguntar por su caso—, y sin él dice la verdad en vez de pintar un hueco: durante el
 * corte el endpoint puede responder sin número, y prometer uno que no llegó sería peor
 * que no prometer nada.
 */
function acuse(respuesta: unknown): string {
  const radicado = (respuesta as { radicado?: string } | null)?.radicado
  return radicado
    ? `Recibimos tu queja. Tu número de radicado es ${radicado}; guárdalo para consultar tu caso. Te responderemos al correo que nos dejaste.`
    : 'Recibimos tu queja. Te responderemos al correo que nos dejaste.'
}

const fields: PublicFormField[] = [
  { name: 'nombre', label: 'Nombre completo', type: 'text', required: true, autocomplete: 'name' },
  { name: 'email', label: 'Correo electrónico', type: 'email', required: true, autocomplete: 'email' },
  { name: 'telefono', label: 'Teléfono (opcional)', type: 'tel', inputmode: 'tel', autocomplete: 'tel' },
  { name: 'reserva', label: 'Número de reserva (opcional)', type: 'text' },
  // `pqrs_type` y NO `type`: el cuerpo del POST se compone como
  // `{ type: props.type, ...values }`, así que un campo llamado `type` pisaría el
  // discriminante del endpoint y la queja dejaría de enrutarse.
  {
    name: 'pqrs_type',
    label: '¿Qué nos quieres decir?',
    type: 'radio',
    required: true,
    options: ['Petición', 'Queja', 'Reclamo', 'Sugerencia'],
  },
  { name: 'mensaje', label: 'Cuéntanos qué pasó', type: 'textarea', required: true },
  // El texto sale de la constante que también viaja con la radicación: lo que se
  // enseña como prueba tiene que ser exactamente lo que la persona leyó.
  { name: 'consentimiento', label: CONSENT_TEXT, type: 'checkbox', required: true },
]

useHead({ title: 'Quejas y reclamos' })
useSeoMeta({
  description:
    'Radica tu queja o reclamo con Alquilame. Cuéntanos qué pasó y te respondemos al correo que nos dejes.',
})
</script>
