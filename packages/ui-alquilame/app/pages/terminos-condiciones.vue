<template>
  <main class="bg-white min-h-screen">
    <article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <!-- Header -->
      <header class="mb-10">
        <p class="text-sm text-gray-500 mb-2">Última actualización: Enero 2025</p>
        <h1 class="text-4xl lg:text-5xl font-extrabold font-heading text-gray-900">
          Términos y Condiciones
        </h1>
      </header>

      <!-- Content -->
      <div class="prose-custom space-y-8 text-gray-700 leading-relaxed">

        <!-- Introducción -->
        <section>
          <h2 class="text-2xl font-bold font-heading text-gray-900 mb-3">1. Introducción</h2>
          <p>
            Bienvenido a <strong>{{ franchise.name }}</strong>, una plataforma operada por <strong>AMAW S.A.S</strong> (NIT 900.665.917-7). Al utilizar nuestro sitio web y servicios, usted acepta estos Términos y Condiciones en su totalidad.
          </p>
        </section>

        <!-- Naturaleza del Servicio -->
        <section>
          <h2 class="text-2xl font-bold font-heading text-gray-900 mb-3">2. Naturaleza del Servicio</h2>
          <p>
            <strong>{{ franchise.name }} es una plataforma de intermediación</strong> que conecta a usuarios con empresas de alquiler de vehículos (en adelante "Rentadoras"). Es importante que comprenda lo siguiente:
          </p>
          <ul class="list-disc pl-6 space-y-2">
            <li><strong>No somos una empresa de alquiler de vehículos.</strong> No somos propietarios ni operadores de los vehículos mostrados en la plataforma.</li>
            <li><strong>Actuamos como intermediarios.</strong> Facilitamos la búsqueda, comparación y solicitud de reservas entre usted y las Rentadoras.</li>
            <li><strong>El contrato de alquiler es entre usted y la Rentadora.</strong> Una vez confirmada la reserva, la relación contractual se establece directamente con la empresa rentadora seleccionada.</li>
          </ul>
        </section>

        <!-- Proceso de Reserva -->
        <section>
          <h2 class="text-2xl font-bold font-heading text-gray-900 mb-3">3. Proceso de Reserva</h2>
          <p>El proceso de reserva funciona de la siguiente manera:</p>
          <ol class="list-decimal pl-6 space-y-2">
            <li><strong>Búsqueda:</strong> Usted selecciona fechas, lugar de recogida y devolución.</li>
            <li><strong>Selección:</strong> Elige un vehículo de las opciones disponibles.</li>
            <li><strong>Solicitud:</strong> Completa el formulario con sus datos personales.</li>
            <li><strong>Verificación:</strong> La Rentadora verifica la disponibilidad del vehículo.</li>
            <li><strong>Confirmación:</strong> Recibirá confirmación por correo electrónico y/o WhatsApp.</li>
          </ol>
          <p>
            <strong>Importante:</strong> La solicitud de reserva no garantiza la disponibilidad. La reserva se considera confirmada únicamente cuando reciba la confirmación oficial por nuestros canales (correo electrónico y/o WhatsApp).
          </p>
        </section>

        <!-- Requisitos del Conductor -->
        <section>
          <h2 class="text-2xl font-bold font-heading text-gray-900 mb-3">4. Requisitos del Conductor</h2>
          <p>Para alquilar un vehículo se requiere:</p>
          <ul class="list-disc pl-6 space-y-2">
            <li>Edad mínima de 18 años</li>
            <li>Licencia de conducción vigente</li>
            <li>Documento de identidad válido (cédula, pasaporte)</li>
            <li>Tarjeta de crédito a nombre del conductor principal</li>
          </ul>
        </section>

        <!-- Precios y Pagos -->
        <section>
          <h2 class="text-2xl font-bold font-heading text-gray-900 mb-3">5. Precios y Pagos</h2>
          <p>
            Los precios mostrados en la plataforma son los mismos que ofrecen las Rentadoras directamente. <strong>No cobramos comisiones adicionales ni afectamos el precio del alquiler.</strong> Los precios incluyen:
          </p>
          <ul class="list-disc pl-6 space-y-2">
            <li>Tarifa diaria del vehículo</li>
            <li>Seguro básico (según la Rentadora)</li>
            <li>Kilometraje (limitado o ilimitado según la tarifa)</li>
          </ul>
          <p><strong>No incluyen (salvo que se indique):</strong></p>
          <ul class="list-disc pl-6 space-y-2">
            <li>IVA y tasas administrativas</li>
            <li>Combustible</li>
            <li>Seguros adicionales</li>
            <li>Accesorios (silla de bebé, GPS, conductor adicional)</li>
            <li>Multas o infracciones de tránsito</li>
          </ul>
          <p>
            El pago se realiza directamente a la Rentadora según sus políticas. AMAW S.A.S no procesa pagos en nombre de las Rentadoras.
          </p>
        </section>

        <!-- Cancelaciones y Modificaciones -->
        <section>
          <h2 class="text-2xl font-bold font-heading text-gray-900 mb-3">6. Cancelaciones y Modificaciones</h2>
          <p>
            Las cancelaciones y modificaciones son gratuitas y sin penalidad:
          </p>
          <ul class="list-disc pl-6 space-y-2">
            <li><strong>Cancelación:</strong> Puede cancelar su reserva en cualquier momento sin costo alguno.</li>
            <li><strong>No presentarse (No-show):</strong> No genera penalidades económicas. Sin embargo, la inasistencia reiterada sin previo aviso podría afectar la aprobación de futuras reservas.</li>
          </ul>
          <p>
            Para cancelar o modificar una reserva, contáctenos por WhatsApp o correo electrónico con su código de reserva.
          </p>
        </section>

        <!-- Responsabilidades -->
        <section>
          <h2 class="text-2xl font-bold font-heading text-gray-900 mb-3">7. Responsabilidades</h2>

          <h3 class="text-xl font-semibold font-heading text-gray-900 mt-6 mb-3">Responsabilidades de AMAW S.A.S ({{ franchise.shortname }}):</h3>
          <ul class="list-disc pl-6 space-y-2">
            <li>Mostrar información precisa proporcionada por las Rentadoras</li>
            <li>Facilitar la comunicación entre usuarios y Rentadoras</li>
            <li>Transmitir las solicitudes de reserva a las Rentadoras</li>
            <li>Atender consultas relacionadas con el uso de la plataforma</li>
          </ul>

          <h3 class="text-xl font-semibold font-heading text-gray-900 mt-6 mb-3">Responsabilidades de la Rentadora:</h3>
          <ul class="list-disc pl-6 space-y-2">
            <li>Proporcionar el vehículo reservado o uno de categoría similar/superior</li>
            <li>Garantizar que el vehículo esté en condiciones óptimas de funcionamiento</li>
            <li>Proporcionar los seguros y coberturas contratados</li>
            <li>Atender reclamaciones relacionadas con el servicio de alquiler</li>
          </ul>

          <h3 class="text-xl font-semibold font-heading text-gray-900 mt-6 mb-3">Responsabilidades del Usuario:</h3>
          <ul class="list-disc pl-6 space-y-2">
            <li>Proporcionar información veraz y actualizada</li>
            <li>Cumplir con los requisitos de la Rentadora</li>
            <li>Revisar el vehículo antes de recibirlo y reportar cualquier daño existente</li>
            <li>Utilizar el vehículo de acuerdo con las condiciones del contrato de alquiler</li>
            <li>Devolver el vehículo en las condiciones acordadas</li>
          </ul>
        </section>

        <!-- Limitación de Responsabilidad -->
        <section>
          <h2 class="text-2xl font-bold font-heading text-gray-900 mb-3">8. Limitación de Responsabilidad</h2>
          <p>
            AMAW S.A.S <strong>no será responsable</strong> por:
          </p>
          <ul class="list-disc pl-6 space-y-2">
            <li>Daños, accidentes o incidentes ocurridos durante el período de alquiler</li>
            <li>Incumplimientos por parte de las Rentadoras</li>
            <li>Cancelaciones o cambios realizados por las Rentadoras</li>
            <li>Diferencias entre el vehículo reservado y el entregado</li>
            <li>Pérdidas económicas derivadas del uso o no uso del servicio</li>
            <li>Multas, infracciones o sanciones de tránsito</li>
          </ul>
          <p>
            Cualquier reclamación relacionada con el servicio de alquiler debe dirigirse directamente a la Rentadora correspondiente.
          </p>
        </section>

        <!-- Propiedad Intelectual -->
        <section>
          <h2 class="text-2xl font-bold font-heading text-gray-900 mb-3">9. Propiedad Intelectual</h2>
          <p>
            Todo el contenido de la plataforma (textos, imágenes, logotipos, diseño) es propiedad de AMAW S.A.S o de sus licenciantes. Queda prohibida su reproducción sin autorización expresa.
          </p>
        </section>

        <!-- Modificaciones -->
        <section>
          <h2 class="text-2xl font-bold font-heading text-gray-900 mb-3">10. Modificaciones</h2>
          <p>
            AMAW S.A.S se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios entrarán en vigencia desde su publicación en esta página. El uso continuado de la plataforma implica la aceptación de las modificaciones.
          </p>
        </section>

        <!-- Ley Aplicable -->
        <section>
          <h2 class="text-2xl font-bold font-heading text-gray-900 mb-3">11. Ley Aplicable y Jurisdicción</h2>
          <p>
            Estos Términos y Condiciones se rigen por las leyes de la República de Colombia. Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales de Cali, Valle del Cauca.
          </p>
        </section>

        <!-- Contacto -->
        <section>
          <h2 class="text-2xl font-bold font-heading text-gray-900 mb-3">12. Contacto</h2>
          <p>Para cualquier consulta sobre estos Términos y Condiciones:</p>
          <ul class="list-disc pl-6 space-y-2">
            <li><strong>WhatsApp:</strong> {{ franchise.phone }}</li>
            <li><strong>Correo:</strong> {{ franchise.email }}</li>
          </ul>
        </section>

        <!-- Company Info -->
        <div class="mt-12 pt-8 border-t border-gray-200 text-gray-600">
          <p class="font-semibold text-gray-900">AMAW S.A.S</p>
          <p>NIT: 900.665.917-7</p>
          <p>Cali, Valle del Cauca, Colombia</p>
        </div>
      </div>

      <!-- Footer -->
      <footer class="mt-16 pt-8 border-t border-gray-200">
        <NuxtLink to="/" class="text-brand-600 hover:text-brand-700 font-medium">← Volver al inicio</NuxtLink>
      </footer>
    </article>
  </main>
</template>

<script setup lang="ts">
const { franchise } = useAppConfig()

useHead({
  title: `Términos y Condiciones | ${franchise.shortname}`,
  link: [
    { rel: 'canonical', href: `${franchise.website}/terminos-condiciones` }
  ]
})

useSeoMeta({
  description: `Términos y condiciones de uso de ${franchise.name}. Conoce las condiciones del servicio de intermediación para alquiler de vehículos en Colombia.`,
  ogTitle: `Términos y Condiciones | ${franchise.shortname}`,
  ogDescription: `Términos y condiciones de uso de ${franchise.name} para alquiler de vehículos en Colombia.`,
})
</script>
