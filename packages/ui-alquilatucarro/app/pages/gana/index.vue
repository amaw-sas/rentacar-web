<template>
  <UPage>
    <!-- Hero Section -->
    <UPageHero orientation="horizontal">
      <template #title>
        <span class="block text-white text-3xl md:text-5xl text-center font-bold">
          <span class="block">¡Gana Dinero Refiriendo</span>
          {{ ' ' }}
          <span class="block">con AlquilaTuCarro.com!</span>
        </span>
      </template>
      <template #description>
        <p class="text-white text-lg md:text-xl text-center max-w-2xl mx-auto">
          Regístrate, comparte tu enlace único y recibe el
          <span class="font-bold text-amber-400">5% de comisión</span>
          por cada reserva efectiva.
        </p>
      </template>
      <template #body>
        <div class="flex justify-center">
          <UButton
            to="#registro"
            size="xl"
            class="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-lg font-bold text-lg uppercase transition-colors"
          >
            Únete Ahora
          </UButton>
        </div>
      </template>
    </UPageHero>

    <!-- Video + Pasos Section -->
    <UPageSection class="bg-white text-black">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <!-- Video -->
        <div class="flex flex-col items-center">
          <h2 class="text-2xl md:text-3xl font-bold text-blue-900 mb-4">¿Cómo Funciona?</h2>
          <p class="text-gray-600 mb-6 text-center">
            Mira este video y aprende en minutos cómo empezar a ganar dinero fácilmente.
          </p>
          <div class="w-full max-w-md aspect-[9/16] bg-gray-100 rounded-xl overflow-hidden shadow-lg">
            <video
              controls
              class="w-full h-full object-cover"
              preload="metadata"
              poster=""
            >
              <source src="/gana/video/explicativo.mp4" type="video/mp4" />
              Tu navegador no soporta videos HTML5.
            </video>
          </div>
        </div>

        <!-- Pasos -->
        <div class="flex flex-col">
          <h2 class="text-2xl md:text-3xl font-bold text-blue-900 mb-6 text-center lg:text-left">
            Pasos para Ganar
          </h2>
          <div class="flex flex-col gap-6">
            <div
              v-for="(paso, index) in pasos"
              :key="index"
              class="flex items-start gap-4"
            >
              <div
                class="flex-shrink-0 w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center text-xl font-bold"
              >
                {{ index + 1 }}
              </div>
              <div class="flex-1 pt-2">
                <p class="text-gray-700 text-lg">{{ paso }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UPageSection>

    <!-- Formulario de Registro -->
    <section id="registro" class="bg-gray-100 py-12 md:py-20">
      <div class="max-w-4xl mx-auto px-4">
        <h2 class="text-2xl md:text-3xl font-bold text-blue-900 text-center mb-8">
          Regístrate Ahora
        </h2>
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSdBVIRur23_vObsyIvibv0nGxLUZOiCFo06gMjlWEgHg06psA/viewform?embedded=true"
            width="100%"
            height="800"
            frameborder="0"
            marginheight="0"
            marginwidth="0"
            loading="lazy"
            title="Formulario de registro programa de referidos"
          >
            Cargando formulario...
          </iframe>
        </div>
      </div>
    </section>

    <!-- Beneficios -->
    <UPageSection class="bg-white text-black">
      <template #title>
        <span class="block text-2xl md:text-3xl font-bold text-center">
          <span class="text-blue-900">¿Por Qué Unirte</span>
          {{ ' ' }}
          <span class="text-amber-500">a Nuestro Programa?</span>
        </span>
      </template>
      <template #default>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div
            v-for="beneficio in beneficios"
            :key="beneficio.titulo"
            class="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow text-center"
          >
            <div class="text-4xl mb-4">{{ beneficio.icono }}</div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">{{ beneficio.titulo }}</h3>
            <p class="text-gray-600">{{ beneficio.descripcion }}</p>
          </div>
        </div>
      </template>
    </UPageSection>

    <!-- FAQs -->
    <UPageSection id="preguntas" class="bg-gray-100 text-black">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-2xl md:text-3xl font-bold text-center mb-8">
          <span class="text-blue-900">Preguntas</span>
          <span class="text-amber-500"> Frecuentes</span>
        </h2>
        <UAccordion :items="preguntas" :ui="faqAccordionUIConfig">
          <template #default="{ item }">
            <span class="block text-base font-medium text-gray-800 px-4">{{ item.label }}</span>
          </template>
          <template #content="{ item }">
            <span class="block text-base text-gray-600 py-3 bg-white px-4 rounded-lg">{{ item.content }}</span>
          </template>
        </UAccordion>
      </div>
    </UPageSection>

    <!-- Testimonios -->
    <UPageSection class="bg-white text-black">
      <template #title>
        <span class="block text-2xl md:text-3xl font-bold text-center">
          <span class="text-blue-900">Lo Que Dicen</span>
          {{ ' ' }}
          <span class="text-amber-500">Nuestros Afiliados</span>
        </span>
      </template>
      <template #default>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div
            v-for="testimonio in testimonios"
            :key="testimonio.nombre"
            class="bg-gray-50 rounded-xl p-6 shadow-md"
          >
            <p class="text-gray-600 italic mb-4">"{{ testimonio.texto }}"</p>
            <p class="font-bold text-gray-800">- {{ testimonio.nombre }}</p>
          </div>
        </div>
      </template>
    </UPageSection>

    <!-- Contacto -->
    <section class="bg-blue-900 text-white py-12 md:py-16">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <h2 class="text-2xl md:text-3xl font-bold mb-4">Contáctanos</h2>
        <p class="text-lg mb-6">
          ¿Tienes dudas? Escríbenos a nuestro correo
          <a href="mailto:info@alquilatucarro.com" class="text-amber-400 hover:underline">
            info@alquilatucarro.com
          </a>
          o contáctanos a través de WhatsApp en el número
          <a :href="franchise.whatsapp" target="_blank" class="text-amber-400 hover:underline">
            {{ franchise.phone }}
          </a>
        </p>
        <p class="text-gray-300">Estamos aquí para ayudarte.</p>
      </div>
    </section>

    <!-- Footer Legal -->
    <section class="bg-blue-950 text-white py-6">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <p class="text-sm">
          &copy; {{ currentYear }} AlquilaTuCarro.com. Todos los derechos reservados.
          <NuxtLink to="/gana/politicas-privacidad" class="text-amber-400 hover:underline ml-2">
            Políticas de privacidad
          </NuxtLink>
          |
          <NuxtLink to="/gana/terminos-condiciones" class="text-amber-400 hover:underline">
            Términos y condiciones
          </NuxtLink>
        </p>
      </div>
    </section>
  </UPage>
</template>

<script lang="ts" setup>
const { franchise } = useAppConfig()

const currentYear = new Date().getFullYear()

useHead({
  title: `Programa de Referidos - Gana Comisiones | ${franchise.shortname}`,
  meta: [
    {
      name: 'description',
      content: 'Únete al programa de referidos de AlquilaTuCarro.com y gana el 5% de comisión por cada reserva efectiva que realicen tus contactos.'
    }
  ]
})

useSeoMeta({
  ogTitle: `Programa de Referidos | ${franchise.shortname}`,
  ogDescription: 'Gana dinero refiriendo con AlquilaTuCarro.com. Recibe el 5% de comisión por cada reserva efectiva.',
  ogType: 'website',
})

definePageMeta({
  layout: 'gana',
  colorMode: 'dark',
})

const pasos = [
  'Regístrate en alquilatucarro.com/gana y completa el formulario con tus datos.',
  'Recibe tu enlace único para compartir con tus contactos.',
  'Comparte tu enlace y ayuda a tus contactos a realizar reservas.',
  'Gana el 5% de comisión por cada reserva efectiva realizada a través de tu enlace.'
]

const beneficios = [
  {
    icono: '💰',
    titulo: 'Gana Dinero Extra',
    descripcion: 'Recibe el 5% de comisión por cada reserva efectiva.'
  },
  {
    icono: '♾️',
    titulo: 'Sin Límites',
    descripcion: 'Invita a tantas personas como quieras y multiplica tus ganancias.'
  },
  {
    icono: '🔒',
    titulo: 'Pagos Seguros',
    descripcion: 'Recibe tus comisiones por transferencia bancaria o USDT.'
  },
  {
    icono: '🤝',
    titulo: 'Soporte Dedicado',
    descripcion: 'Te apoyamos en todo momento para que obtengas tus comisiones.'
  }
]

const preguntas = [
  {
    label: '¿Quién puede participar en el programa de referidos?',
    content: 'Cualquier persona mayor de edad puede participar, excepto empleados de AMAW S.A.S., socios y rentadoras locales.'
  },
  {
    label: '¿Cómo recibo mi comisión?',
    content: 'Las comisiones se pagan mediante transferencia bancaria para empresas colombianas y en USDT para empresas extranjeras.'
  },
  {
    label: '¿Cuánto tiempo tarda en pagarse mi comisión?',
    content: 'El pago se realiza un mes después de que el referido complete su alquiler, siempre que se alcance el monto mínimo requerido.'
  },
  {
    label: '¿Qué pasa si no alcanzo el monto mínimo de $200,000 COP en 6 meses?',
    content: 'Si no alcanzas el monto mínimo después de 6 meses, las comisiones acumuladas serán anuladas según las políticas del programa.'
  },
  {
    label: '¿Puedo usar mi enlace para hacer mis propias reservas?',
    content: 'No, las auto-referencias están prohibidas y podrían descalificarte del programa.'
  },
  {
    label: '¿Qué sucede si un referido cancela su reserva?',
    content: 'Las comisiones solo se pagan por reservas efectivas completadas. Si el referido cancela, no se generará comisión.'
  },
  {
    label: '¿Hay un límite en la cantidad de referidos?',
    content: 'No, puedes invitar a tantos referidos como desees. ¡Cuantos más, mejor!'
  },
  {
    label: '¿Qué hago si tengo problemas con mi enlace o mis comisiones?',
    content: 'Puedes contactarnos a través de nuestro correo info@alquilatucarro.com o nuestro WhatsApp +57 301 672 9250.'
  },
  {
    label: '¿En qué ciudades de Colombia está disponible el servicio?',
    content: 'Estamos disponibles en: Armenia, Barranquilla, Bogotá, Bucaramanga, Cali, Cartagena, Cúcuta, Floridablanca, Ibagué, Manizales, Medellín, Montería, Neiva, Pereira, Santa Marta, Soledad, Palmira, Valledupar y Villavicencio.'
  },
  {
    label: '¿Por qué confiar en AlquilaTuCarro.com?',
    content: 'Somos una plataforma confiable y líder en la renta de autos en Colombia, con una amplia red de socios y rentadoras locales en más de 20 ciudades del país.'
  }
]

const testimonios = [
  {
    nombre: 'Juan Pérez',
    texto: 'Gracias al programa de referidos, he generado ingresos extra de manera fácil y segura. ¡Es increíble!'
  },
  {
    nombre: 'María López',
    texto: 'Recomendar AlquilaTuCarro.com fue una decisión sencilla. Mi enlace generó comisiones rápidamente.'
  },
  {
    nombre: 'Carlos García',
    texto: 'El soporte y la transparencia del programa son impecables. Totalmente recomendado.'
  }
]

const faqAccordionUIConfig = {
  item: 'bg-white rounded-lg mb-2 px-2 pb-2 !border-0 shadow-sm',
  body: '!border-none',
  trailingIcon: 'mr-2 transition-transform duration-200',
}
</script>
