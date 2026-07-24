<template>
  <!--
    Sé nuestro aliado — captación B2B de rentadoras (el "convenio" es el acuerdo,
    pero la invitación convierte mejor que el trámite).

    OJO con el público: NO es un particular con un carro. Es una rentadora o un
    emprendimiento de alquiler con buen servicio y buenos vehículos. Todo el
    texto habla de "tu negocio", no de "tu carro".

    Dos mensajes que son el corazón de la propuesta:
      1. La ubicación NO es requisito. Aunque el negocio esté fuera de las zonas
         donde ya operamos, igual le conseguimos clientes. Va explícito porque es
         justo la objeción que haría alguien de una ciudad "pequeña".
      2. Paridad de precios: el aliado debe ofrecer los mismos precios que
         publica en su web o redes. Se muestra como condición Y como argumento
         (el cliente final recibe precios reales, sin adicionales), no escondida
         en letra chica.

    La ruta es /aliados: la invitación ("sé aliado") convierte mejor que el trámite
    correcto para un negocio que inscribe su flota. Sólo cambió el lenguaje.
  -->
  <div class="bg-white">
    <!-- Hero -->
    <section class="bg-linear-to-b from-footer-from to-footer-to [--ctx-text-primary:#fff]">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 text-center">
        <h1 class="heading-page text-white">Sé aliado de {{ franchise.shortname }}</h1>
        <div class="h-1 w-10 rounded-full bg-white/70 my-6 mx-auto" aria-hidden="true" />
        <p class="text-lg md:text-xl text-white/85 max-w-2xl mx-auto">
          Si tienes una rentadora en Colombia — grande o pequeña — nosotros te
          conseguimos clientes. Tú sigues operando tu negocio como siempre.
        </p>
        <p class="mt-4 text-white/75 max-w-2xl mx-auto">
          No importa en qué ciudad estés: trabajamos con aliados dentro y fuera de
          las zonas donde ya operamos.
        </p>
        <a
          href="#registro"
          class="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-brand-700 font-semibold shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-all duration-200"
        >
          Quiero ser aliado
        </a>
      </div>
    </section>

    <!-- Beneficios -->
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <h2 class="heading-section text-center text-gray-900 mb-10">
        <span class="text-brand-700">Qué gana</span> tu negocio
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="b in beneficios" :key="b.titulo" class="rounded-2xl border border-gray-200 bg-[#F8F9FC] p-6">
          <div class="h-1 w-8 rounded-full bg-brand-600 mb-4" aria-hidden="true" />
          <h3 class="font-bold text-gray-900 mb-2">{{ b.titulo }}</h3>
          <p class="text-gray-600 text-sm leading-relaxed">{{ b.texto }}</p>
        </div>
      </div>
    </section>

    <!-- La condición: precios reales -->
    <section class="bg-[#EDF0F5] py-12 md:py-16">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="heading-section text-gray-900 mb-4">Una sola condición</h2>
        <p class="text-gray-700 leading-relaxed mb-6">
          Pedimos que ofrezcas <strong>los mismos precios</strong> que ya publicas en
          tu página o en tus redes sociales. Nada de tarifas infladas ni cobros
          adicionales para nuestros clientes.
        </p>
        <p class="text-gray-600 leading-relaxed">
          Es lo que hace que el convenio funcione: quien reserva sabe que está
          pagando el precio real, y tu negocio recibe clientes que llegan sin
          sorpresas ni reclamos.
        </p>
      </div>
    </section>

    <!-- Requisitos -->
    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <h2 class="heading-section text-gray-900 mb-6">Qué buscamos en un aliado</h2>
      <ul class="space-y-3">
        <li v-for="r in requisitos" :key="r" class="flex items-start gap-3 text-gray-700">
          <span class="mt-1 shrink-0 text-brand-600" aria-hidden="true">✓</span>
          <span>{{ r }}</span>
        </li>
      </ul>
    </section>

    <!-- Formulario -->
    <section id="registro" class="bg-[#EDF0F5] py-12 md:py-16 scroll-mt-24">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="heading-section text-gray-900 mb-2">Cuéntanos de tu negocio</h2>
        <p class="text-gray-600 mb-8">
          Son unos pocos datos para conocer el tamaño de tu operación y la zona que
          atiendes. Te contactamos para explicarte cómo funciona el convenio.
        </p>

        <div class="rounded-2xl bg-white border border-gray-200 p-6 md:p-8">
          <PublicContactForm
            type="flota"
            :fields="fields"
            submit-label="Enviar solicitud"
            success-message="¡Recibido! Revisamos tu solicitud y te contactamos para avanzar con el convenio."
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { PublicFormField } from '~/components/PublicContactForm.vue'

const { franchise } = useAppConfig()

const beneficios = [
  {
    titulo: 'Te llevamos clientes',
    texto: 'Tu flota entra a nuestra plataforma y llega a quienes ya están buscando alquilar. Tú no tienes que invertir en publicidad.',
  },
  {
    titulo: 'Sin importar dónde estés',
    texto: 'Trabajamos con rentadoras dentro y fuera de las ciudades donde ya operamos. Si tu negocio está bien, te conseguimos clientes.',
  },
  {
    titulo: 'Tú sigues al mando',
    texto: 'Mantienes tu operación, tus vehículos y tus precios. El convenio suma demanda, no te cambia la forma de trabajar.',
  },
]

const requisitos = [
  'Ser una empresa o emprendimiento de alquiler de vehículos en Colombia.',
  'Vehículos en buen estado y con mantenimiento al día.',
  'Documentos y seguros vigentes según la normativa.',
  'Buen servicio al cliente: es lo que cuida tu nombre y el nuestro.',
  'Ofrecer los mismos precios que publicas en tu página o redes sociales.',
]

const fields: PublicFormField[] = [
  { name: 'negocio', label: 'Nombre del negocio', type: 'text', required: true, autocomplete: 'organization' },
  { name: 'nombre', label: 'Nombre de quien contactamos', type: 'text', required: true, autocomplete: 'name' },
  { name: 'telefono', label: 'Teléfono / WhatsApp', type: 'tel', required: true, inputmode: 'tel', autocomplete: 'tel' },
  { name: 'email', label: 'Correo electrónico (opcional)', type: 'email', autocomplete: 'email' },
  { name: 'ubicacion', label: '¿Dónde está ubicado tu negocio? (ciudad o zona que atiendes)', type: 'text', required: true },
  { name: 'vehiculos', label: '¿Cuántos vehículos tienes?', type: 'number', required: true, inputmode: 'numeric' },
  {
    name: 'tipos',
    label: '¿Qué tipos de vehículo manejas?',
    type: 'checkbox-group',
    required: true,
    options: ['Económico', 'Sedán', 'SUV', 'Camioneta', 'Van', 'Lujo', 'Carga', 'Otros'],
  },
  {
    name: 'compromiso',
    label: 'Me comprometo a ofrecer los mismos precios que publico en mi página o redes sociales, sin cobros adicionales.',
    type: 'checkbox',
    required: true,
  },
  { name: 'mensaje', label: '¿Algo más que debamos saber? (opcional)', type: 'textarea' },
]

useHead({ title: 'Sé nuestro aliado' })
useSeoMeta({
  description:
    'Convenios para rentadoras en Colombia. Si tienes una empresa de alquiler de vehículos, te llevamos clientes — estés donde estés. Una sola condición: precios reales.',
})
</script>
