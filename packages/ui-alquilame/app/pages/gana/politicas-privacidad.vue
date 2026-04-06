<template>
  <UPage>
    <UPageHero>
      <template #title>
        <h1 class="text-white text-2xl md:text-4xl text-center font-bold">
          Políticas de Privacidad del Programa de Referidos
        </h1>
      </template>
      <template #description>
        <p class="text-gray-300 text-center">AMAW S.A.S.</p>
      </template>
    </UPageHero>

    <section class="bg-white py-12 md:py-16">
      <div class="max-w-4xl mx-auto px-4">
        <div class="prose prose-lg max-w-none">
          <!-- 1. Introducción -->
          <div class="mb-8">
            <h2 class="text-xl font-bold text-blue-900 mb-4">1. Introducción</h2>
            <p class="text-gray-700">
              AMAW S.A.S. valora y respeta la privacidad de los participantes en su Programa de Referidos.
              Estas Políticas de Privacidad describen la información recopilada, el uso y protección de los
              datos personales de los participantes y referidos.
            </p>
          </div>

          <!-- 2. Información Recopilada -->
          <div class="mb-8">
            <h2 class="text-xl font-bold text-blue-900 mb-4">2. Información Recopilada</h2>
            <p class="text-gray-700 mb-4">
              AMAW S.A.S. recopila la siguiente información de los participantes y referidos:
            </p>
            <ul class="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Datos personales:</strong> Nombre completo, documento de identidad, dirección
                de correo electrónico, número de teléfono y datos bancarios o de billetera digital
                para la realización de pagos.
              </li>
              <li>
                <strong>Información de uso:</strong> Enlace de referido, transacciones realizadas,
                montos de comisiones generadas y estado de pago.
              </li>
              <li>
                <strong>Datos de navegación:</strong> Cookies y registros de actividad en la plataforma digital.
              </li>
            </ul>
          </div>

          <!-- 3. Uso de la Información -->
          <div class="mb-8">
            <h2 class="text-xl font-bold text-blue-900 mb-4">3. Uso de la Información</h2>
            <p class="text-gray-700 mb-4">
              La información recopilada será utilizada para los siguientes fines:
            </p>
            <ul class="list-disc pl-6 text-gray-700 space-y-2">
              <li>Administrar la participación en el Programa de Referidos.</li>
              <li>Procesar y realizar pagos de comisiones.</li>
              <li>Verificar la legitimidad de las transacciones y prevenir fraudes.</li>
              <li>
                Enviar notificaciones sobre actualizaciones del programa y cambios en términos y condiciones.
              </li>
              <li>Cumplir con las obligaciones legales y regulatorias.</li>
            </ul>
          </div>

          <!-- 4. Protección y Almacenamiento de Datos -->
          <div class="mb-8">
            <h2 class="text-xl font-bold text-blue-900 mb-4">4. Protección y Almacenamiento de Datos</h2>
            <p class="text-gray-700">
              AMAW S.A.S. implementa medidas de seguridad técnicas y organizativas para proteger la información
              personal de accesos no autorizados, pérdidas o alteraciones. Los datos se almacenarán en servidores
              seguros y solo serán accesibles por personal autorizado.
            </p>
          </div>

          <!-- 5. Compartición de Datos -->
          <div class="mb-8">
            <h2 class="text-xl font-bold text-blue-900 mb-4">5. Compartición de Datos</h2>
            <p class="text-gray-700 mb-4">
              La información personal de los participantes y referidos no será vendida ni compartida con terceros,
              salvo en los siguientes casos:
            </p>
            <ul class="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Autoridades gubernamentales:</strong> Cuando sea requerido por ley o en cumplimiento
                de obligaciones fiscales y regulatorias.
              </li>
              <li>
                <strong>Socios comerciales y rentadoras:</strong> Para validar transacciones y garantizar
                la operatividad del programa.
              </li>
              <li>
                <strong>Proveedores de servicios:</strong> Para la gestión de pagos y procesamiento de información,
                bajo estrictas cláusulas de confidencialidad.
              </li>
            </ul>
          </div>

          <!-- 6. Derechos de los Participantes -->
          <div class="mb-8">
            <h2 class="text-xl font-bold text-blue-900 mb-4">6. Derechos de los Participantes</h2>
            <p class="text-gray-700 mb-4">
              Los participantes tienen los siguientes derechos sobre su información personal:
            </p>
            <ul class="list-disc pl-6 text-gray-700 space-y-2">
              <li>Acceder, actualizar o corregir sus datos personales.</li>
              <li>Solicitar la eliminación de sus datos cuando ya no sean necesarios para los fines establecidos.</li>
              <li>
                Revocar el consentimiento para el uso de su información, sujeto a las restricciones legales y contractuales.
              </li>
              <li>Presentar reclamaciones ante la autoridad de protección de datos correspondiente.</li>
            </ul>
          </div>

          <!-- 7. Uso de Cookies y Tecnologías Similares -->
          <div class="mb-8">
            <h2 class="text-xl font-bold text-blue-900 mb-4">7. Uso de Cookies y Tecnologías Similares</h2>
            <p class="text-gray-700">
              AMAW S.A.S. utiliza cookies para mejorar la experiencia del usuario en la plataforma digital.
              Los participantes pueden gestionar la configuración de cookies desde su navegador web.
            </p>
          </div>

          <!-- 8. Modificaciones a la Política de Privacidad -->
          <div class="mb-8">
            <h2 class="text-xl font-bold text-blue-900 mb-4">8. Modificaciones a la Política de Privacidad</h2>
            <p class="text-gray-700">
              AMAW S.A.S. se reserva el derecho de modificar esta política en cualquier momento. Cualquier cambio
              será notificado a los participantes con al menos 15 días de anticipación y publicado en
              <NuxtLink to="/gana" class="text-amber-600 hover:underline">{{ franchise.name }}/gana</NuxtLink>.
            </p>
          </div>

          <!-- 9. Contacto -->
          <div class="mb-8">
            <h2 class="text-xl font-bold text-blue-900 mb-4">9. Contacto</h2>
            <p class="text-gray-700">
              Para cualquier consulta sobre estas Políticas de Privacidad, los participantes pueden comunicarse
              a través del correo electrónico:
              <a href="mailto:soporte@amawsas.com" class="text-amber-600 hover:underline">soporte@amawsas.com</a>.
            </p>
          </div>

          <!-- 10. Aceptación de la Política de Privacidad -->
          <div class="mb-8">
            <h2 class="text-xl font-bold text-blue-900 mb-4">10. Aceptación de la Política de Privacidad</h2>
            <p class="text-gray-700">
              Al registrarse en el Programa de Referidos, el participante acepta estas Políticas de Privacidad
              y otorga su consentimiento para el tratamiento de su información personal conforme a lo aquí estipulado.
            </p>
          </div>
        </div>

        <!-- Botón volver -->
        <div class="mt-12 text-center">
          <NuxtLink
            to="/gana"
            class="inline-block bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-bold transition-colors"
          >
            Volver al programa
          </NuxtLink>
        </div>
      </div>
    </section>
  </UPage>
</template>

<script lang="ts" setup>
const { franchise } = useAppConfig()

useHead({
  title: `Políticas de Privacidad - Programa de Referidos | ${franchise.shortname}`,
  meta: [
    {
      name: 'description',
      content: `Políticas de privacidad del programa de referidos de ${franchise.name} - AMAW S.A.S.`
    }
  ]
})

definePageMeta({
  layout: 'gana',
  colorMode: 'dark',
})
</script>
