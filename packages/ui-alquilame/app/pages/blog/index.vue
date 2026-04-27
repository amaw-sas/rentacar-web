<template>
  <UPage>
    <!-- Hero Section -->
    <UPageHero orientation="vertical">
      <template #title>
        <h1 class="text-white text-3xl md:text-4xl text-center font-bold">
          Blog de <span class="text-red-500">{{ franchise.shortname }}</span>
        </h1>
      </template>
      <template #description>
        <p class="text-white text-center max-w-2xl mx-auto">
          Guías, tips y consejos para alquilar carros en Colombia.
          Descubre las mejores rutas, requisitos y recomendaciones para tu viaje.
        </p>
      </template>
    </UPageHero>

    <!-- Blog Posts Grid -->
    <section class="bg-gray-100 py-12 md:py-16 px-4 md:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Featured Post -->
        <div v-if="featuredPost" class="mb-12">
          <h2 class="text-xl font-bold text-gray-800 mb-6">Artículo Destacado</h2>
          <NuxtLink
            :to="featuredPost.path"
            class="block group"
          >
            <article class="bg-white rounded-xl shadow-md overflow-hidden md:flex hover:shadow-xl transition-shadow duration-300">
              <div class="md:w-1/2 aspect-video md:aspect-auto overflow-hidden">
                <img
                  :src="featuredPost.image"
                  :alt="featuredPost.alt"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="eager"
                >
              </div>
              <div class="p-6 md:w-1/2 flex flex-col justify-center">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full w-fit mb-3">
                  <UIcon :name="getCategoryIcon(featuredPost.category)" class="size-3.5" />
                  {{ formatCategory(featuredPost.category) }}
                </span>
                <h3 class="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-red-700 transition-colors">
                  {{ featuredPost.title }}
                </h3>
                <p class="text-gray-600 mt-3 line-clamp-3">
                  {{ featuredPost.description }}
                </p>
                <div class="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span class="inline-flex items-center gap-1.5">
                    <UIcon name="i-lucide-calendar" class="size-4" />
                    <time :datetime="featuredPost.date">{{ formatDate(featuredPost.date) }}</time>
                  </span>
                  <span class="inline-flex items-center gap-1.5">
                    <UIcon name="i-lucide-clock" class="size-4" />
                    {{ featuredPost.readingTime }} min
                  </span>
                </div>
              </div>
            </article>
          </NuxtLink>
        </div>

        <!-- Category Filters -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 class="text-xl font-bold text-gray-800">Todos los Artículos</h2>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in categories"
              :key="cat.value"
              @click="setCategory(cat.value)"
              :class="[
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all',
                selectedCategory === cat.value
                  ? 'bg-red-700 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              ]"
            >
              <UIcon :name="cat.icon" class="size-4" />
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Posts Grid -->
        <div v-if="filteredPosts && filteredPosts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <NuxtLink
            v-for="post in filteredPosts"
            :key="post.path"
            :to="post.path"
            class="group"
          >
            <article class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
              <div class="relative overflow-hidden aspect-video">
                <img
                  :src="post.image"
                  :alt="post.alt"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                >
                <span class="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-red-700 rounded-full">
                  <UIcon :name="getCategoryIcon(post.category)" class="size-3.5" />
                  {{ formatCategory(post.category) }}
                </span>
              </div>
              <div class="p-5 flex flex-col flex-grow">
                <h3 class="text-lg font-bold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-2">
                  {{ post.title }}
                </h3>
                <p class="text-gray-600 mt-2 text-sm line-clamp-2 flex-grow">
                  {{ post.description }}
                </p>
                <div class="flex items-center gap-3 mt-4 text-xs text-gray-500">
                  <span class="inline-flex items-center gap-1">
                    <UIcon name="i-lucide-calendar" class="size-3.5" />
                    <time :datetime="post.date">{{ formatDate(post.date) }}</time>
                  </span>
                  <span class="inline-flex items-center gap-1">
                    <UIcon name="i-lucide-clock" class="size-3.5" />
                    {{ post.readingTime }} min
                  </span>
                </div>
              </div>
            </article>
          </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <UIcon name="i-lucide-file-search" class="size-12 text-gray-400 mx-auto mb-4" />
          <p v-if="selectedCategory" class="text-gray-600">
            No hay artículos en la categoría <strong>{{ formatCategory(selectedCategory) }}</strong>.
          </p>
          <p v-else class="text-gray-600">Próximamente encontrarás contenido sobre alquiler de carros en Colombia.</p>
          <button
            v-if="selectedCategory"
            @click="setCategory('')"
            class="mt-4 text-red-700 hover:text-red-800 font-medium"
          >
            Ver todos los artículos
          </button>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-gray-900 text-white py-12 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-2xl md:text-3xl font-bold mb-4">
          ¿Listo para tu próxima aventura?
        </h2>
        <p class="text-gray-300 mb-6">
          Reserva tu carro sin anticipos en cualquiera de nuestras 27 sedes
        </p>
        <NuxtLink
          to="/"
          class="inline-block bg-red-700 hover:bg-red-800 text-white px-8 py-3 rounded-xl font-bold uppercase transition-colors"
        >
          Reservar Ahora
        </NuxtLink>
      </div>
    </section>
  </UPage>
</template>

<script setup lang="ts">
import type { BlogPost } from '@rentacar-main/logic/src'

const { franchise } = useAppConfig()
const route = useRoute()
const router = useRouter()

// Category filter options
const categories = [
  { value: '', label: 'Todos', icon: 'i-lucide-layout-grid' },
  { value: 'guias', label: 'Guías', icon: 'i-lucide-book-open' },
  { value: 'rutas', label: 'Rutas', icon: 'i-lucide-route' },
  { value: 'destinos', label: 'Destinos', icon: 'i-lucide-map-pin' },
  { value: 'tips', label: 'Tips', icon: 'i-lucide-lightbulb' }
]

// Selected category from route query
const selectedCategory = computed(() => {
  return (route.query.categoria as string) || ''
})

// Set category filter
function setCategory(category: string) {
  router.push({
    query: category ? { categoria: category } : {}
  })
}

// Query all blog posts
const { data: allPosts } = await useAsyncData('blog-posts', async () => {
  const result = await $fetch<{ success: boolean; posts: BlogPost[] }>('/api/blog/posts')
  return result?.posts ?? []
})

// Get featured post (first featured=true or most recent)
const featuredPost = computed(() => {
  if (!allPosts.value) return null
  return allPosts.value.find(p => p.featured) || allPosts.value[0]
})

// Get all posts except featured for the grid
const posts = computed(() => {
  if (!allPosts.value) return []
  const featured = featuredPost.value
  return allPosts.value.filter(p => p.path !== featured?.path)
})

// Filter posts by category
const filteredPosts = computed(() => {
  if (!selectedCategory.value) return posts.value
  return posts.value.filter(p => p.category === selectedCategory.value)
})

// Format date to Spanish
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Format category name
function formatCategory(category: string): string {
  const categories: Record<string, string> = {
    guias: 'Guías',
    destinos: 'Destinos',
    tips: 'Tips',
    rutas: 'Rutas'
  }
  return categories[category] || category
}

// Get category icon
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    guias: 'i-lucide-book-open',
    destinos: 'i-lucide-map-pin',
    tips: 'i-lucide-lightbulb',
    rutas: 'i-lucide-route'
  }
  return icons[category] || 'i-lucide-file-text'
}

// SEO
useHead({
  title: `Blog | ${franchise.shortname}`,
  link: [
    { rel: 'canonical', href: `${franchise.website}/blog` }
  ]
})

useSeoMeta({
  title: `Blog - Guías y Tips de Alquiler de Carros | ${franchise.shortname}`,
  description: 'Descubre guías, tips y consejos para alquilar carros en Colombia. Requisitos, mejores rutas, destinos y recomendaciones para tu viaje.',
  ogTitle: `Blog | ${franchise.shortname}`,
  ogDescription: 'Guías, tips y consejos para alquilar carros en Colombia.',
  ogType: 'website',
  ogUrl: `${franchise.website}/blog`,
  ogImage: franchise.logo,
  twitterCard: 'summary_large_image',
  twitterTitle: `Blog | ${franchise.shortname}`,
  twitterDescription: 'Guías, tips y consejos para alquilar carros en Colombia.'
})

// Breadcrumb schema
useSchemaOrg([
  defineBreadcrumb({
    itemListElement: [
      { name: 'Inicio', item: '/' },
      { name: 'Blog' }
    ]
  })
])

definePageMeta({
  colorMode: 'light'
})
</script>
