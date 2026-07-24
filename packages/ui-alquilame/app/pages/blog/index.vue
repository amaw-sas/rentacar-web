<template>
  <UPage>
    <!--
      Hero plano en vez de <UPageHero>: su contenedor (lg:grid) detecta los slots
      de forma distinta en SSR↔cliente → "Hydration completed but contains
      mismatches" en /blog (issue #219). UPageHero era transparente (el fondo oscuro
      lo aporta el layout: bg-linear-to-b from-brand-900 to-brand-950), así que esta
      <section> reproduce exacto lo visual (mismo padding, título/descripción
      centrados, blanco sobre el dark del layout) y elimina el mismatch.
    -->
    <section class="bg-linear-to-b from-footer-from to-footer-to px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-24 text-center [--ctx-text-primary:#fff]">
      <h1 class="heading-page text-white">
        Blog de <span class="text-brand-200">{{ franchise.shortname }}</span>
      </h1>
      <p class="text-white max-w-2xl mx-auto mt-4">
        Guías, tips y consejos para alquilar carros en Colombia.
        Descubre las mejores rutas, requisitos y recomendaciones para tu viaje.
      </p>
    </section>

    <!-- Blog Posts Grid -->
    <section class="bg-surface-soft py-12 md:py-16 px-4 md:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Featured Post -->
        <div v-if="featuredPost" class="mb-12">
          <h2 class="heading-section text-gray-900 mb-6">Artículo Destacado</h2>
          <NuxtLink
            :to="`/blog/${featuredPost.slug}`"
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
                <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-brand-700 bg-brand-100 rounded-full w-fit mb-3">
                  <UIcon :name="getCategoryIcon(featuredPost.category)" class="size-3.5" />
                  {{ formatCategory(featuredPost.category) }}
                </span>
                <h3 class="heading-card text-gray-900 group-hover:text-brand-700 transition-colors">
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
          <h2 class="heading-section text-gray-900">Todos los Artículos</h2>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in categories"
              :key="cat.value"
              @click="setCategory(cat.value)"
              :class="[
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all',
                selectedCategory === cat.value
                  ? 'bg-brand-600 text-white'
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
            :key="post.slug"
            :to="`/blog/${post.slug}`"
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
                <span class="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-brand-600 rounded-full">
                  <UIcon :name="getCategoryIcon(post.category)" class="size-3.5" />
                  {{ formatCategory(post.category) }}
                </span>
              </div>
              <div class="p-5 flex flex-col flex-grow">
                <h3 class="heading-sub text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2">
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
            class="mt-4 text-brand-700 hover:text-brand-800 font-medium"
          >
            Ver todos los artículos
          </button>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-brand-900 text-white py-12 px-4 [--ctx-text-primary:#fff]">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="heading-section mb-4">
          ¿Listo para tu próxima aventura?
        </h2>
        <p class="text-white/85 mb-6">
          Reserva tu carro sin anticipos en cualquiera de nuestras {{ cityCount }} ciudades
        </p>
        <NuxtLink
          to="/reservas"
          class="inline-block bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-bold uppercase transition-colors"
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

// El conteo de ciudades sale de la MISMA fuente que el footer. Antes estaba
// escrito a mano en el CTA y quedó desactualizado (decía un número de sedes que
// ya no correspondía); cableado así no se puede desincronizar otra vez.
const { cityCount } = usePublicCities()
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
  return allPosts.value.filter(p => p.slug !== featured?.slug)
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
  title: 'Blog',
  link: [
    { rel: 'canonical', href: `${franchise.website}/blog` }
  ]
})

useSeoMeta({
  title: 'Blog de alquiler de carros',
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
