<script setup lang="ts">
definePageMeta({
  layout: false
})

const password = ref('')
const error = ref('')
const loading = ref(false)
const route = useRoute()

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    const response = await $fetch('/api/seo/auth', {
      method: 'POST',
      body: { password: password.value }
    })

    if (response.success) {
      // Cookie se establece en el servidor
      const redirect = route.query.redirect as string || '/seo'
      await navigateTo(redirect)
    }
  } catch (e: any) {
    error.value = e.data?.message || 'Error de autenticación'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div class="bg-gray-800 rounded-lg shadow-xl p-8">
        <!-- Logo/Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white">SEO Command Center</h1>
          <p class="text-gray-400 mt-2">Acceso restringido</p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Ingresa la contraseña"
            />
          </div>

          <div v-if="error" class="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <span v-if="loading">Verificando...</span>
            <span v-else>Acceder</span>
          </button>
        </form>

        <!-- Footer -->
        <div class="mt-8 text-center">
          <NuxtLink to="/" class="text-sm text-gray-400 hover:text-white transition-colors">
            ← Volver al sitio
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
