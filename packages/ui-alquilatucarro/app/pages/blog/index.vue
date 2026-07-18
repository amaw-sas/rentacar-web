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
    <section class="px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-24 text-center">
      <h1 class="text-white text-3xl md:text-4xl font-bold">
        Blog de <span class="text-red-500">Alquilatucarro</span>
      </h1>
      <p class="text-white max-w-2xl mx-auto mt-4">
        Guías, tips y consejos para alquilar carros en Colombia.
        Descubre las mejores rutas, requisitos y recomendaciones para tu viaje.
      </p>
    </section>

    <!-- Blog Posts Grid -->
    <section class="bg-gray-100 py-12 md:py-16 px-4 md:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Featured Post (hidden when searching) -->
        <div v-if="featuredPost && !hasActiveFilters" class="mb-12">
          <h2 class="text-xl font-bold text-gray-800 mb-6">Artículo Destacado</h2>
          <NuxtLink
            :to="`/blog/${featuredPost.slug}`"
            class="block group"
          >
            <article class="bg-white rounded-xl shadow-md overflow-hidden md:flex hover:shadow-xl transition-shadow duration-300">
              <div class="md:w-1/2 aspect-video md:aspect-auto overflow-hidden">
                <NuxtImg
                  :src="featuredPost.image"
                  :alt="featuredPost.alt"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  :width="getBlogImageWidth(featuredPost.image)"
                  height="720"
                  :sizes="getBlogFeaturedSizes(featuredPost.image)"
                  :densities="getBlogFeaturedDensities(featuredPost.image)"
                  format="webp"
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                />
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

        <!-- Search + Filters -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 class="text-xl font-bold text-gray-800">Todos los Artículos</h2>
          <div class="relative w-full sm:w-64">
            <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Buscar artículos..."
              class="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all"
            />
          </div>
        </div>

        <!-- Category Filters -->
        <div class="flex flex-wrap gap-2 mb-6">
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

        <!-- Active Tag Filter -->
        <div v-if="selectedTag" class="flex items-center gap-2 mb-6">
          <span class="text-sm text-gray-600">Filtrando por etiqueta:</span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full">
            <UIcon name="i-lucide-tag" class="size-3.5" />
            {{ selectedTag }}
            <button @click="clearTag" class="ml-1 hover:text-red-900" aria-label="Quitar filtro de etiqueta">
              <UIcon name="i-lucide-x" class="size-3.5" />
            </button>
          </span>
        </div>

        <!-- Posts Grid -->
        <div v-if="paginatedPosts && paginatedPosts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <NuxtLink
            v-for="post in paginatedPosts"
            :key="post.slug"
            :to="`/blog/${post.slug}`"
            class="group"
          >
            <article class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
              <div class="relative overflow-hidden aspect-video">
                <NuxtImg
                  :src="post.image"
                  :alt="post.alt"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  width="400"
                  height="225"
                  sizes="xs:320px md:400px"
                  :densities="getBlogCardDensities(post.image)"
                  format="webp"
                  loading="lazy"
                  decoding="async"
                />
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

        <!-- Pagination -->
        <nav v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-10" aria-label="Paginación del blog">
          <button
            :disabled="currentPage <= 1"
            @click="currentPage--"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <UIcon name="i-lucide-chevron-left" class="size-4" />
            Anterior
          </button>
          <div class="flex items-center gap-1">
            <button
              v-for="page in totalPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'size-10 rounded-full text-sm font-medium transition-all',
                currentPage === page
                  ? 'bg-red-700 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              ]"
            >
              {{ page }}
            </button>
          </div>
          <button
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente
            <UIcon name="i-lucide-chevron-right" class="size-4" />
          </button>
        </nav>

        <!-- Empty State -->
        <div v-if="filteredPosts.length === 0" class="text-center py-12">
          <UIcon name="i-lucide-file-search" class="size-12 text-gray-400 mx-auto mb-4" />
          <p v-if="selectedCategory || selectedTag || searchQuery.trim()" class="text-gray-600">
            No hay artículos
            <template v-if="searchQuery.trim()"> que contengan <strong>"{{ searchQuery.trim() }}"</strong></template>
            <template v-if="searchQuery.trim() && selectedCategory"> en</template>
            <template v-if="selectedCategory"> la categoría <strong>{{ formatCategory(selectedCategory) }}</strong></template>
            <template v-if="(selectedCategory || searchQuery.trim()) && selectedTag"> y</template>
            <template v-if="selectedTag"> con la etiqueta <strong>{{ selectedTag }}</strong></template>.
          </p>
          <p v-else class="text-gray-600">Próximamente encontrarás contenido sobre alquiler de carros en Colombia.</p>
          <button
            v-if="selectedCategory || selectedTag || searchQuery.trim()"
            @click="searchQuery = ''; router.push({ query: {} })"
            class="mt-4 text-red-700 hover:text-red-800 font-medium"
          >
            Ver todos los artículos
          </button>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-gradient-to-r from-gray-900 to-gray-800 py-12 px-4 md:px-8">
      <div class="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div class="flex-1 text-center md:text-left">
          <div class="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-red-300 bg-red-900/30 rounded-full mb-3">
            <UIcon name="i-lucide-car" class="size-3.5" />
            Sin anticipos · 27 sedes en Colombia
          </div>
          <h2 class="text-xl md:text-2xl font-bold text-white mb-2">
            ¿Te ayudamos a planear tu viaje?
          </h2>
          <p class="text-gray-400 text-sm">
            Escríbenos por WhatsApp para asesoría personalizada sobre rutas, vehículos y tarifas.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 shrink-0">
          <NuxtLink
            :to="franchise.whatsapp"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center justify-center gap-2 bg-whatsapp hover:bg-whatsapp-hover text-black px-6 py-3 rounded-xl font-bold transition-colors"
          >
            <UIcon name="i-lucide-message-circle" class="size-5" />
            WhatsApp
          </NuxtLink>
          <NuxtLink
            to="/"
            class="inline-flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-xl font-bold transition-colors"
          >
            <UIcon name="i-lucide-calendar" class="size-5" />
            Reservar Ahora
          </NuxtLink>
        </div>
      </div>
    </section>
  </UPage>
</template>

<script setup lang="ts">
import type { BlogPost } from '@rentacar-main/logic/src'

const { franchise } = useAppConfig()
const route = useRoute()
const router = useRouter()

// Search query (local ref — no URL sync to avoid noise)
const searchQuery = ref('')

// Pagination
const POSTS_PER_PAGE = 6
const currentPage = ref(1)

// Normalize text for accent-insensitive search
function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

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

// Selected tag from route query
const selectedTag = computed(() => {
  return (route.query.tag as string) || ''
})

// Set category filter (preserves tag)
function setCategory(category: string) {
  const query: Record<string, string> = {}
  if (category) query.categoria = category
  if (selectedTag.value) query.tag = selectedTag.value
  router.push({ query })
}

// Clear tag filter (preserves category)
function clearTag() {
  const query: Record<string, string> = {}
  if (selectedCategory.value) query.categoria = selectedCategory.value
  router.push({ query })
}

// Query all blog posts from Vercel Blob via API
const { data: allPosts } = await useAsyncData('blog-posts', async () => {
  const result = await $fetch<{ success: boolean; posts: BlogPost[] }>('/api/blog/posts')
  return result?.posts ?? []
})

// Get featured post (first featured=true or most recent)
const featuredPost = computed(() => {
  if (!allPosts.value) return null
  return allPosts.value.find(p => p.featured) || allPosts.value[0]
})

// Whether any filter is active (search, category, or tag)
const hasActiveFilters = computed(() =>
  !!searchQuery.value.trim() || !!selectedCategory.value || !!selectedTag.value
)

// Get posts for the grid (all when filtering, exclude featured when not)
const posts = computed(() => {
  if (!allPosts.value) return []
  if (hasActiveFilters.value) return allPosts.value
  const featured = featuredPost.value
  return allPosts.value.filter(p => p.slug !== featured?.slug)
})

// Filter posts by search, category and/or tag
const filteredPosts = computed(() => {
  let result = posts.value
  if (searchQuery.value.trim()) {
    const q = normalize(searchQuery.value.trim())
    result = result.filter(p =>
      normalize(p.title).includes(q)
      || normalize(p.description).includes(q)
      || p.tags?.some(t => normalize(t).includes(q))
    )
  }
  if (selectedCategory.value) {
    result = result.filter(p => p.category === selectedCategory.value)
  }
  if (selectedTag.value) {
    result = result.filter(p => p.tags?.includes(selectedTag.value))
  }
  return result
})

// Paginated posts
const totalPages = computed(() => Math.ceil(filteredPosts.value.length / POSTS_PER_PAGE))
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * POSTS_PER_PAGE
  return filteredPosts.value.slice(start, start + POSTS_PER_PAGE)
})

// Reset page when filters change
watch([selectedCategory, selectedTag, searchQuery], () => {
  currentPage.value = 1
})

const { formatDate, formatCategory, getCategoryIcon } = useBlogUtils()

// SEO
useHead({
  title: `Blog | ${franchise.shortname}`,
  link: [
    { rel: 'canonical', href: `${franchise.website}/blog` },
    { rel: 'alternate', type: 'application/rss+xml', title: `Blog de ${franchise.shortname}`, href: `${franchise.website}/rss.xml` }
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
