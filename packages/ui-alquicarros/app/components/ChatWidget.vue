<template>
  <UModal
    :ui="{ content: 'bg-white', close: 'bg-black text-white rounded-full' }"
  >
    <template #body>
      <div class="text-center space-y-10 pb-4 md:pb-6">
        <div>
          <p class="font-bold text-2xl text-black">¡Escríbenos!</p>
          <p class="text-gray-600">Estamos a un mensaje de distancia</p>
          <UButton
            size="xl"
            class="bg-[#25D366] hover:bg-[#128C7E] text-white mt-3 transition-colors"
            label="Whatsapp"
            target="_blank"
            :external="true"
            :to="franchise.whatsapp"
          >
            <template #leading>
              <WhatsappIcon cls="size-5" />
            </template>
          </UButton>
        </div>
        <div>
          <p class="font-bold text-2xl text-black">¡Llámanos!</p>
          <p class="text-gray-600">Hablemos por llamada local</p>
          <UButton
            color="info"
            size="xl"
            class="text-white mt-3"
            :external="true"
            :label="franchise.phone"
            :to="`tel:${franchise.phone}`"
          >
            <template #leading>
              <PhoneIcon cls="size-5" />
            </template>
          </UButton>
        </div>
      </div>
    </template>
    <UButton
      icon="lucide:message-circle-plus"
      square
      class="fixed bottom-4 right-4 md:bottom-8 z-50 rounded-full text-white"
      size="2xl"
      color="primary"
      aria-label="Abrir chat de contacto"
    />
  </UModal>
</template>

<script setup lang="ts">
import {
  IconsWhatsappIcon as WhatsappIcon,
  IconsPhoneIcon as PhoneIcon,
} from '#components'

const { franchise } = useAppConfig();
</script>
