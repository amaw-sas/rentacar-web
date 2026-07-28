<template>
  <!--
    Gana comisiones — programa de referidos.

    Reescrita para usar el LAYOUT DEL SITIO (header y footer normales). Antes
    tenía un layout propio con header y pie de página inventados, así que la
    página se sentía como otro sitio: el usuario perdía la navegación y los
    enlaces reales del footer. La estructura ahora replica /aliados
    (hero rojo centrado, tarjetas, formulario) para que ambas se lean como parte
    de la misma casa.

    Cambios de fondo respecto a la versión anterior:
      - Sin video: pesaba ~8 MB y el "cómo funciona" se entiende con los pasos.
      - El formulario dejó de ser un iframe de Google Forms (sacaba al usuario
        del sitio, no se puede estilar y no respeta la marca) y ahora postea a
        /api/contact.
      - Se eliminaron las secciones "Contacto" y "Footer legal" propias: el
        footer del sitio ya las cubre. Los legales del programa quedan junto al
        formulario, que es donde importan.
  -->
  <div class="bg-white">
    <!-- Hero -->
    <section class="bg-linear-to-b from-footer-from to-footer-to [--ctx-text-primary:#fff]">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 text-center">
        <h1 class="heading-page text-white">
          Gana dinero refiriendo con {{ franchise.shortname }}
        </h1>
        <div class="h-1 w-10 rounded-full bg-white/70 my-6 mx-auto" aria-hidden="true" />
        <p class="text-lg md:text-xl text-white/85 max-w-2xl mx-auto">
          Regístrate, comparte tu enlace único y recibe el
          <span class="font-bold text-white">5% de comisión</span>
          por cada reserva efectiva.
        </p>
        <a
          href="#registro"
          class="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-brand-700 font-semibold shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-all duration-200"
        >
          Quiero registrarme
        </a>
      </div>
    </section>

    <!-- Cómo funciona: los pasos (antes acompañaban a un video) -->
    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <h2 class="heading-section text-center text-gray-900 mb-10">
        <span class="text-brand-700">Cómo</span> funciona
      </h2>
      <ol class="space-y-6">
        <li v-for="(paso, i) in pasos" :key="i" class="flex items-start gap-4">
          <span
            class="shrink-0 grid place-items-center size-9 rounded-full bg-brand-600 text-white font-bold"
            aria-hidden="true"
          >{{ i + 1 }}</span>
          <p class="text-gray-700 leading-relaxed pt-1">{{ paso }}</p>
        </li>
      </ol>
    </section>

    <!-- Beneficios -->
    <section class="bg-[#EDF0F5] py-12 md:py-16">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="heading-section text-center text-gray-900 mb-10">
          <span class="text-brand-700">Por qué</span> unirte al programa
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div
            v-for="b in beneficios"
            :key="b.titulo"
            class="rounded-2xl border border-gray-200 bg-white p-6"
          >
            <div class="h-1 w-8 rounded-full bg-brand-600 mb-4" aria-hidden="true" />
            <h3 class="font-bold text-gray-900 mb-2">{{ b.titulo }}</h3>
            <p class="body-sm leading-relaxed">{{ b.descripcion }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Formulario -->
    <section id="registro" class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 scroll-mt-24">
      <h2 class="heading-section text-gray-900 mb-2">Regístrate</h2>
      <p class="text-gray-600 mb-8">
        Déjanos tus datos y te enviamos tu enlace único para empezar a ganar.
      </p>

      <PublicContactForm
        type="referidos"
        :fields="fields"
        submit-label="Quiero mi enlace"
        success-message="¡Recibido! Te contactaremos con tu enlace único para empezar a referir."
      />

      <p class="mt-6 body-sm">
        Al registrarte aceptas los
        <NuxtLink to="/gana/terminos-condiciones" class="text-brand-700 font-semibold hover:underline">
          términos y condiciones
        </NuxtLink>
        y las
        <NuxtLink to="/gana/politicas-privacidad" class="text-brand-700 font-semibold hover:underline">
          políticas de privacidad
        </NuxtLink>
        del programa.
      </p>
    </section>

    <!-- Preguntas frecuentes -->
    <section id="preguntas" class="bg-[#EDF0F5] py-12 md:py-16 scroll-mt-24">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="heading-section text-center text-gray-900 mb-8">
          Preguntas <span class="text-brand-700">frecuentes</span>
        </h2>
        <div class="space-y-3">
          <details
            v-for="(p, i) in preguntas"
            :key="i"
            class="group rounded-2xl border border-gray-200 bg-white px-5 py-4"
          >
            <summary class="cursor-pointer list-none font-semibold text-gray-900 flex items-center justify-between gap-4">
              {{ p.pregunta }}
              <span class="shrink-0 text-brand-600 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p class="mt-3 text-gray-600 leading-relaxed">{{ p.respuesta }}</p>
          </details>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { PublicFormField } from '~/components/PublicContactForm.vue'

const { franchise } = useAppConfig()

const pasos = [
  'Regístrate en esta página completando el formulario con tus datos.',
  'Recibe tu enlace único para compartir con tus contactos.',
  'Comparte tu enlace e invita a tus contactos a realizar reservas.',
  'Gana el 5% de comisión por cada reserva efectiva hecha a través de tu enlace.',
]

const beneficios = [
  {
    titulo: 'Gana dinero extra',
    descripcion: 'Recibe el 5% de comisión por cada reserva efectiva que llegue con tu enlace.',
  },
  {
    titulo: 'Sin límites',
    descripcion: 'No hay tope de referidos ni de comisiones: mientras más compartas, más ganas.',
  },
  {
    titulo: 'Pagos seguros',
    descripcion: 'Te pagamos de forma confiable por cada reserva efectiva, con reglas claras.',
  },
  {
    titulo: 'Soporte dedicado',
    descripcion: 'Te acompañamos por WhatsApp para resolver cualquier duda del programa.',
  },
]

const preguntas = [
  {
    pregunta: '¿Cuánto gano por cada referido?',
    respuesta: 'Ganas el 5% de comisión sobre cada reserva efectiva realizada a través de tu enlace único.',
  },
  {
    pregunta: '¿Tiene algún costo participar?',
    respuesta: 'No. Registrarte y participar en el programa de referidos es totalmente gratis.',
  },
  {
    pregunta: '¿Cuándo recibo mi comisión?',
    respuesta: 'La comisión se liquida una vez la reserva se hace efectiva. Te contactamos para coordinar el pago.',
  },
  {
    pregunta: '¿Hay un límite de personas que puedo referir?',
    respuesta: 'No hay límite: puedes referir a todas las personas que quieras.',
  },
]

const fields: PublicFormField[] = [
  { name: 'nombre', label: 'Nombre completo', type: 'text', required: true, autocomplete: 'name' },
  { name: 'email', label: 'Correo electrónico', type: 'email', required: true, autocomplete: 'email' },
  { name: 'telefono', label: 'Teléfono / WhatsApp', type: 'tel', required: true, inputmode: 'tel', autocomplete: 'tel' },
  { name: 'ciudad', label: 'Ciudad (opcional)', type: 'text' },
  { name: 'mensaje', label: '¿Algo que quieras contarnos? (opcional)', type: 'textarea' },
]

useHead({ title: 'Gana comisiones — Programa de referidos' })
useSeoMeta({
  description:
    'Únete al programa de referidos de Alquilame: comparte tu enlace único y gana el 5% de comisión por cada reserva efectiva. Registrarte es gratis.',
})
</script>
