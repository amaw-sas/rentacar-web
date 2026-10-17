<template>
  <div class="ep-root" style="--ep-from: #1e3a8a; --ep-to: #172554">
    <!-- Header simplificado -->
    <header class="ep-header">
      <NuxtLink to="/" class="ep-brand">
        <IconsColombiaFlag cls="ep-flag" />
        <Logo cls="ep-logo" />
      </NuxtLink>
    </header>

    <!-- Contenido principal -->
    <main class="ep-main">
      <div class="ep-content">
        <!-- Código de error -->
        <span class="ep-code">{{ statusCode }}</span>

        <!-- Icono de carro -->
        <div class="ep-icon-wrap">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="ep-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
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
        <h1 class="ep-title">{{ errorTitle }}</h1>
        <p class="ep-text">{{ errorMessage }}</p>

        <!-- Botones de acción -->
        <div class="ep-actions">
          <NuxtLink to="/" class="ep-btn ep-btn-primary">Ir al inicio</NuxtLink>
          <button type="button" class="ep-btn ep-btn-secondary" @click="handleBack">
            Volver atrás
          </button>
        </div>

        <!-- Ciudades: solo en 404, para que el visitante tenga a dónde ir -->
        <section v-if="statusCode === 404" class="ep-cities-section">
          <h2 class="ep-cities-title">¿Buscabas alquilar en alguna ciudad?</h2>
          <ul class="ep-cities">
            <li v-for="city in cities" :key="city.id">
              <NuxtLink :to="`/${city.id}`" class="ep-city">{{ city.name }}</NuxtLink>
            </li>
          </ul>
        </section>

        <!-- Contacto -->
        <p class="ep-contact">
          ¿Necesitas ayuda?
          <a
            href="https://wa.me/573016729250"
            target="_blank"
            rel="noopener"
            class="ep-link"
          >
            Contáctanos por WhatsApp
          </a>
        </p>
      </div>
    </main>

    <!-- Footer mínimo -->
    <footer class="ep-footer">
      © {{ new Date().getFullYear() }} AlquilaTuCarro.com - Todos los derechos reservados
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
// La hoja va inline por useHead: entry.css se quita del HTML fuera de la home
// y esta página nunca lo recupera, así que no puede depender de Tailwind.
import errorPageCss from '@rentacar-main/logic/assets/error-page.css?inline'

const { cities } = usePublicCities()
const router = useRouter()

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error?.statusCode || 404)

const errorTitle = computed(() => {
  if (statusCode.value === 404) {
    return '¡Ups! Página no encontrada'
  }
  if (statusCode.value === 500) {
    return 'Error del servidor'
  }
  return 'Algo salió mal'
})

const errorMessage = computed(() => {
  if (statusCode.value === 404) {
    return 'Parece que esta ruta tomó un desvío. La página que buscas no existe o fue movida.'
  }
  if (statusCode.value === 500) {
    return 'Estamos teniendo problemas técnicos. Por favor intenta de nuevo en unos minutos.'
  }
  return props.error?.message || 'Ha ocurrido un error inesperado.'
})

const handleBack = () =>
  goBackOrHome({
    hasInAppBack: import.meta.client && !!window.history.state?.back,
    clearError,
    back: () => router.back(),
  })

// El título de pestaña lo completa la plantilla del sitio con la marca.
const pageTitle = statusCode.value === 404 ? 'Página no encontrada' : 'Algo salió mal'
const unhead = injectHead()
useHead({
  title: pageTitle,
  style: [{ key: 'error-page', innerHTML: errorPageCss }],
})

// Cuando el 404 se lanza durante el arranque (p. ej. /medellin/xyz), nuxt pinta
// el head en `app:error`, antes de que esta página registre su título, y deja en
// el DOM el de respaldo de nuxt-seo-utils ("404 - Page not found: ..."). Unhead
// descarta un invalidate() hecho mientras hay un render en curso, así que se
// repinta de nuevo cuando ese render termina.
onMounted(() => {
  const off = unhead.hooks.hook('dom:rendered', () => {
    off()
    setTimeout(() => unhead.invalidate())
  })
  unhead.invalidate()
})
</script>
