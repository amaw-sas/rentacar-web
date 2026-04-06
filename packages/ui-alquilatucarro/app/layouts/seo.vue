<script setup lang="ts">
const route = useRoute()

const navigation = [
  { name: 'Overview', href: '/seo', icon: 'i-heroicons-chart-bar' },
  { name: 'Backlinks', href: '/seo/backlinks', icon: 'i-heroicons-link' },
  { name: 'Tareas', href: '/seo/tareas', icon: 'i-heroicons-clipboard-document-check' },
  { name: 'Keywords', href: '/seo/keywords', icon: 'i-heroicons-magnifying-glass' },
  { name: 'Contenido', href: '/seo/contenido', icon: 'i-heroicons-document-text' },
  { name: 'Competidores', href: '/seo/competidores', icon: 'i-heroicons-users' },
  { name: 'Rendimiento', href: '/seo/rendimiento', icon: 'i-heroicons-bolt' },
  { name: 'Herramientas', href: '/seo/herramientas', icon: 'i-heroicons-wrench-screwdriver' },
]

function isActive(href: string) {
  if (href === '/seo') {
    return route.path === '/seo'
  }
  return route.path.startsWith(href)
}

async function handleLogout() {
  const authCookie = useCookie('seo-auth')
  authCookie.value = null
  await navigateTo('/seo/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Header -->
    <header class="bg-gray-800 border-b border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <NuxtLink to="/seo" class="flex items-center gap-3">
              <div class="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-white" />
              </div>
              <span class="text-xl font-bold text-white">SEO Command Center</span>
            </NuxtLink>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/"
              class="text-gray-400 hover:text-white text-sm transition-colors"
              target="_blank"
            >
              Ver sitio →
            </NuxtLink>
            <button
              @click="handleLogout"
              class="text-gray-400 hover:text-red-400 text-sm transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar -->
      <aside class="w-64 bg-gray-800 min-h-[calc(100vh-4rem)] border-r border-gray-700">
        <nav class="p-4 space-y-1">
          <NuxtLink
            v-for="item in navigation"
            :key="item.href"
            :to="item.href"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="[
              isActive(item.href)
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            ]"
          >
            <UIcon :name="item.icon" class="w-5 h-5" />
            {{ item.name }}
          </NuxtLink>
        </nav>

        <!-- Quick Stats -->
        <div class="p-4 border-t border-gray-700 mt-4">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Métricas Rápidas
          </h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between text-gray-400">
              <span>DA</span>
              <span class="text-white font-medium">53</span>
            </div>
            <div class="flex justify-between text-gray-400">
              <span>Backlinks</span>
              <span class="text-white font-medium">6,994</span>
            </div>
            <div class="flex justify-between text-gray-400">
              <span>Keywords Top 20</span>
              <span class="text-yellow-400 font-medium">0</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
