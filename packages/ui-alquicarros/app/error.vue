<template>
  <div class="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 flex flex-col">
    <!-- Header simplificado -->
    <header class="py-4 px-6">
      <NuxtLink to="/" class="flex items-center justify-center gap-2">
        <IconsColombiaFlag cls="h-6 md:h-7 w-auto" />
        <Logo cls="h-8 md:h-10 w-auto" />
      </NuxtLink>
    </header>

    <!-- Contenido principal -->
    <main class="flex-1 flex items-center justify-center px-4">
      <div class="text-center max-w-lg">
        <!-- Código de error -->
        <div class="mb-6">
          <span class="text-8xl md:text-9xl font-bold text-amber-500">
            {{ error?.statusCode || 404 }}
          </span>
        </div>

        <!-- Icono de carro -->
        <div class="mb-6 flex justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-24 h-24 text-white/80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
            />
          </svg>
        </div>

        <!-- Mensaje -->
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-4">
          {{ errorTitle }}
        </h1>
        <p class="text-gray-300 mb-8 text-lg">
          {{ errorMessage }}
        </p>

        <!-- Botones de acción -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            to="/"
            size="lg"
            color="amber"
            class="font-bold"
          >
            Ir al inicio
          </UButton>
          <UButton
            size="lg"
            variant="outline"
            color="white"
            class="font-bold"
            @click="handleError"
          >
            Volver atrás
          </UButton>
        </div>

        <!-- Contacto -->
        <p class="mt-12 text-gray-400 text-sm">
          ¿Necesitas ayuda?
          <a
            href="https://wa.me/573016729250"
            target="_blank"
            class="text-amber-500 hover:underline"
          >
            Contáctanos por WhatsApp
          </a>
        </p>
      </div>
    </main>

    <!-- Footer mínimo -->
    <footer class="py-4 text-center text-gray-500 text-sm">
      © {{ new Date().getFullYear() }} {{ franchise.name }} - Todos los derechos reservados
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
const { franchise } = useAppConfig();

const props = defineProps<{
  error: NuxtError
}>()

const errorTitle = computed(() => {
  if (props.error?.statusCode === 404) {
    return '¡Ups! Página no encontrada'
  }
  if (props.error?.statusCode === 500) {
    return 'Error del servidor'
  }
  return 'Algo salió mal'
})

const errorMessage = computed(() => {
  if (props.error?.statusCode === 404) {
    return 'Parece que esta ruta tomó un desvío. La página que buscas no existe o fue movida.'
  }
  if (props.error?.statusCode === 500) {
    return 'Estamos teniendo problemas técnicos. Por favor intenta de nuevo en unos minutos.'
  }
  return props.error?.message || 'Ha ocurrido un error inesperado.'
})

const handleError = () => {
  clearError({ redirect: '/' })
}

useHead({
  title: `Error ${props.error?.statusCode || 404} | ${franchise.name}`
})
</script>
