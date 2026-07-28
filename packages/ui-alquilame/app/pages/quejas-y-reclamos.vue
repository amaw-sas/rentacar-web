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
        success-message="Recibimos tu queja. Te responderemos al correo que nos dejaste."
      />

      <p class="mt-10 body-sm">
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

const { franchise } = useAppConfig()

const fields: PublicFormField[] = [
  { name: 'nombre', label: 'Nombre completo', type: 'text', required: true, autocomplete: 'name' },
  { name: 'email', label: 'Correo electrónico', type: 'email', required: true, autocomplete: 'email' },
  { name: 'telefono', label: 'Teléfono (opcional)', type: 'tel', inputmode: 'tel', autocomplete: 'tel' },
  { name: 'reserva', label: 'Número de reserva (opcional)', type: 'text' },
  { name: 'mensaje', label: 'Cuéntanos qué pasó', type: 'textarea', required: true },
]

useHead({ title: 'Quejas y reclamos' })
useSeoMeta({
  description:
    'Radica tu queja o reclamo con Alquilame. Cuéntanos qué pasó y te respondemos al correo que nos dejes.',
})
</script>
