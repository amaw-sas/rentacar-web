<template>
  <UPage v-if="post">
    <!-- Reading Progress Bar -->
    <div class="fixed top-0 left-0 right-0 h-1 bg-surface-soft z-50">
      <div
        class="h-full bg-brand-600 transition-all duration-150 ease-out"
        :style="{ width: `${readingProgress}%` }"
      />
    </div>

    <!-- Hero Image -->
    <div class="relative w-full h-64 md:h-96 overflow-hidden">
      <img
        :src="post.image"
        :alt="post.alt"
        class="w-full h-full object-cover"
        fetchpriority="high"
      >
      <div class="absolute inset-0 bg-linear-to-t from-gray-900/80 to-transparent" />
      <div class="absolute bottom-0 left-0 right-0 p-6 md:p-12">
        <div class="max-w-4xl mx-auto">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-gray-900 bg-brand-600 rounded-full mb-4">
            <UIcon :name="getCategoryIcon(post.category)" class="size-3.5" />
            {{ formatCategory(post.category) }}
          </span>
          <h1 class="text-2xl md:text-4xl font-bold font-heading text-white mb-4">
            {{ post.title }}
          </h1>
          <div class="flex flex-wrap items-center gap-4 text-sm text-gray-300">
            <div class="flex items-center gap-2">
              <img
                :src="post.author.avatar"
                :alt="post.author.name"
                class="w-8 h-8 rounded-full"
                loading="lazy"
              >
              <span>{{ post.author.name }}</span>
            </div>
            <span class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-calendar" class="size-4" />
              <time :datetime="post.date">{{ formatDate(post.date) }}</time>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-clock" class="size-4" />
              {{ post.readingTime }} min de lectura
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <section class="bg-white py-8 md:py-12">
      <div class="max-w-7xl mx-auto px-4 md:px-8">
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- Main Content -->
          <article ref="articleRef" class="lg:w-2/3 prose prose-lg prose-gray max-w-none">
            <MDCRenderer v-if="post.body" :body="post.body" :data="post" />
          </article>

          <!-- Sidebar -->
          <aside class="lg:w-1/3">
            <div class="sticky top-24 space-y-8">
              <!-- Table of Contents -->
              <nav v-if="post.body?.toc?.links?.length" class="bg-surface-softer rounded-xl p-6">
                <h3 class="font-bold text-gray-900 mb-4">Contenido</h3>
                <ul class="space-y-2">
                  <li v-for="link in post.body.toc.links" :key="link.id">
                    <a
                      :href="`#${link.id}`"
                      class="text-sm text-gray-600 hover:text-brand-700 underline underline-offset-2 transition-colors"
                    >
                      {{ link.text }}
                    </a>
                    <ul v-if="link.children?.length" class="ml-4 mt-2 space-y-2">
                      <li v-for="child in link.children" :key="child.id">
                        <a
                          :href="`#${child.id}`"
                          class="text-xs text-gray-500 hover:text-brand-700 underline underline-offset-2 transition-colors"
                        >
                          {{ child.text }}
                        </a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </nav>

              <!-- Tags -->
              <div v-if="post.tags?.length" class="bg-surface-softer rounded-xl p-6">
                <h3 class="font-bold text-gray-900 mb-4">Etiquetas</h3>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in post.tags"
                    :key="tag"
                    class="px-3 py-1 text-xs bg-surface-soft text-gray-700 rounded-full"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>

              <!-- Share Buttons (Desktop) -->
              <div class="hidden lg:block bg-surface-softer rounded-xl p-6">
                <h3 class="font-bold text-gray-900 mb-4">Compartir</h3>
                <div class="flex gap-3">
                  <button
                    @click="shareWhatsApp"
                    class="flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                    aria-label="Compartir en WhatsApp"
                  >
                    <UIcon name="i-lucide-message-circle" class="size-5" />
                  </button>
                  <button
                    @click="shareFacebook"
                    class="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                    aria-label="Compartir en Facebook"
                  >
                    <UIcon name="i-lucide-facebook" class="size-5" />
                  </button>
                  <button
                    @click="shareTwitter"
                    class="flex items-center justify-center w-10 h-10 bg-black hover:bg-gray-800 text-white rounded-full transition-colors"
                    aria-label="Compartir en X"
                  >
                    <UIcon name="i-lucide-twitter" class="size-5" />
                  </button>
                  <button
                    @click="copyLink"
                    class="flex items-center justify-center w-10 h-10 bg-brand-600 hover:bg-brand-700 text-gray-900 rounded-full transition-colors"
                    aria-label="Copiar enlace"
                  >
                    <UIcon :name="linkCopied ? 'i-lucide-check' : 'i-lucide-link'" class="size-5" />
                  </button>
                </div>
              </div>

              <!-- CTA -->
              <div class="bg-brand-600 rounded-xl p-6 text-gray-900">
                <h3 class="font-bold mb-2">¿Listo para reservar?</h3>
                <p class="text-sm text-gray-800 mb-4">Sin anticipos, sin compromisos</p>
                <NuxtLink
                  to="/reservas"
                  class="block text-center bg-white text-brand-700 px-4 py-2 rounded-lg font-bold hover:bg-brand-100 transition-colors"
                >
                  Reservar Ahora
                </NuxtLink>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <!-- Author Bio -->
    <section class="bg-white py-8 px-4 md:px-8 border-t border-gray-200">
      <div class="max-w-4xl mx-auto">
        <div class="bg-surface-softer rounded-2xl p-6 md:p-8">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <img
              :src="post.author.avatar"
              :alt="post.author.name"
              class="w-20 h-20 rounded-full object-cover"
              loading="lazy"
            >
            <div class="text-center sm:text-left flex-1">
              <h3 class="text-lg font-bold text-gray-900">{{ post.author.name }}</h3>
              <p class="text-gray-600 mt-2 text-sm">
                Somos tu mejor opción para alquilar carros en Colombia. Con presencia en más de 27 ciudades,
                ofrecemos el mejor servicio sin anticipos y sin complicaciones. Nuestro equipo te acompaña
                en cada paso de tu viaje.
              </p>
              <div class="mt-4 flex flex-col sm:flex-row items-center gap-3">
                <NuxtLink
                  to="/reservas"
                  class="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-gray-900 px-5 py-2.5 rounded-lg font-medium transition-colors"
                >
                  <UIcon name="i-lucide-car" class="size-4" />
                  Reservar un Carro
                </NuxtLink>
                <NuxtLink
                  to="/blog"
                  class="inline-flex items-center gap-2 text-gray-600 hover:text-brand-700 font-medium transition-colors"
                >
                  <UIcon name="i-lucide-book-open" class="size-4" />
                  Más artículos
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Related Posts -->
    <section v-if="relatedPosts?.length" class="bg-surface-soft py-12 px-4 md:px-8">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-xl font-bold text-gray-800 mb-6">Artículos Relacionados</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NuxtLink
            v-for="related in relatedPosts"
            :key="related.slug"
            :to="`/blog/${related.slug}`"
            class="group"
          >
            <article class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
              <img
                :src="related.image"
                :alt="related.alt"
                class="w-full h-40 object-cover"
                loading="lazy"
              >
              <div class="p-4">
                <h3 class="font-bold font-heading text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2">
                  {{ related.title }}
                </h3>
                <p class="text-sm text-gray-500 mt-2">{{ related.readingTime }} min de lectura</p>
              </div>
            </article>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Back to Blog -->
    <section class="bg-white py-8 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <NuxtLink
          to="/blog"
          class="inline-flex items-center gap-2 px-6 py-3 bg-surface-soft hover:bg-surface-softer text-brand-700 font-medium rounded-lg transition-colors"
        >
          <span>&larr;</span>
          <span>Volver al Blog</span>
        </NuxtLink>
      </div>
    </section>

    <!-- Mobile Share Buttons (Floating) -->
    <div class="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div class="flex items-center gap-2 bg-white rounded-full shadow-lg px-4 py-2 border border-gray-200">
        <span class="text-xs text-gray-500 font-medium mr-1">Compartir</span>
        <button
          @click="shareWhatsApp"
          class="flex items-center justify-center w-9 h-9 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
          aria-label="Compartir en WhatsApp"
        >
          <UIcon name="i-lucide-message-circle" class="size-4" />
        </button>
        <button
          @click="shareFacebook"
          class="flex items-center justify-center w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
          aria-label="Compartir en Facebook"
        >
          <UIcon name="i-lucide-facebook" class="size-4" />
        </button>
        <button
          @click="shareTwitter"
          class="flex items-center justify-center w-9 h-9 bg-black hover:bg-gray-800 text-white rounded-full transition-colors"
          aria-label="Compartir en X"
        >
          <UIcon name="i-lucide-twitter" class="size-4" />
        </button>
        <button
          @click="copyLink"
          class="flex items-center justify-center w-9 h-9 bg-brand-600 hover:bg-brand-700 text-gray-900 rounded-full transition-colors"
          aria-label="Copiar enlace"
        >
          <UIcon :name="linkCopied ? 'i-lucide-check' : 'i-lucide-link'" class="size-4" />
        </button>
      </div>
    </div>
  </UPage>

  <!-- 404 -->
  <div v-else class="min-h-screen flex items-center justify-center bg-surface-soft">
    <div class="text-center">
      <h1 class="text-4xl font-bold font-heading text-gray-900 mb-4">Artículo no encontrado</h1>
      <p class="text-gray-600 mb-6">El artículo que buscas no existe o ha sido movido.</p>
      <NuxtLink
        to="/blog"
        class="inline-block bg-brand-600 text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-brand-700 transition-colors"
      >
        Ir al Blog
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BlogPosting, BreadcrumbList } from 'schema-dts'
import type { MDCRoot, Toc } from '@nuxtjs/mdc'
import type { BlogPost } from '@rentacar-main/logic/src'

// The post-detail endpoint augments BlogPost with the parsed MDC `body`
// (toc merged in) — list endpoints return the bare BlogPost without it.
type BlogPostDetail = BlogPost & { body?: MDCRoot & { toc?: Toc } }

const { franchise } = useAppConfig()
const route = useRoute()

// Get the slug from route params
const slug = computed(() => {
  const params = route.params.slug
  return Array.isArray(params) ? params.join('/') : params
})

// Fetch the blog post from Supabase via API (single source of truth).
const { data: post } = await useAsyncData(`blog-${slug.value}`, () =>
  $fetch<BlogPostDetail>(`/api/blog/post/${slug.value}`)
    .catch(() => null)
)

// Unknown slug → real HTTP 404 (not a soft 200) so crawlers de-index it.
// The in-page 404 block (v-else in the template) still renders as the body.
if (import.meta.server && !post.value) {
  setResponseStatus(useRequestEvent()!, 404)
}

// All posts for this brand (Supabase) — drives related.
const { data: allPosts } = await useAsyncData(`blog-all-${slug.value}`, () =>
  $fetch<{ posts: BlogPost[] }>('/api/blog/posts')
    .then(r => r.posts ?? [])
    .catch(() => [])
)

// Related posts: same category, excluding the current one, max 3.
const relatedPosts = computed(() =>
  post.value
    ? (allPosts.value ?? []).filter(p => p.category === post.value!.category && p.slug !== post.value!.slug).slice(0, 3)
    : []
)

// Reading progress
const articleRef = ref<HTMLElement | null>(null)
const readingProgress = ref(0)

function updateReadingProgress() {
  if (!articleRef.value) return

  const articleTop = articleRef.value.offsetTop
  const articleHeight = articleRef.value.offsetHeight
  const windowHeight = window.innerHeight
  const scrollY = window.scrollY

  // Calculate progress based on how much of the article is scrolled past
  const start = articleTop - windowHeight
  const end = articleTop + articleHeight - windowHeight

  if (scrollY <= start) {
    readingProgress.value = 0
  } else if (scrollY >= end) {
    readingProgress.value = 100
  } else {
    readingProgress.value = Math.round(((scrollY - start) / (end - start)) * 100)
  }
}

onMounted(() => {
  window.addEventListener('scroll', updateReadingProgress, { passive: true })
  updateReadingProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateReadingProgress)
})

// Format date
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Format category
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

// Share functions
const linkCopied = ref(false)

function getShareUrl(): string {
  if (import.meta.client) {
    return window.location.href
  }
  return `${franchise.website}/blog/${slug.value}`
}

function shareWhatsApp() {
  const url = getShareUrl()
  const text = encodeURIComponent(`${post.value?.title} - ${url}`)
  window.open(`https://wa.me/?text=${text}`, '_blank')
}

function shareFacebook() {
  const url = encodeURIComponent(getShareUrl())
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400')
}

function shareTwitter() {
  const url = encodeURIComponent(getShareUrl())
  const text = encodeURIComponent(post.value?.title || '')
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400')
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(getShareUrl())
    linkCopied.value = true
    setTimeout(() => {
      linkCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}

// SEO - only if post exists
if (post.value) {
  const canonicalUrl = `${franchise.website}/blog/${slug.value}`

  useHead({
    title: `${post.value.title} | ${franchise.shortname}`,
    link: [
      { rel: 'canonical', href: canonicalUrl }
    ]
  })

  useSeoMeta({
    title: post.value.title,
    description: post.value.description,
    ogTitle: post.value.title,
    ogDescription: post.value.description,
    ogType: 'article',
    ogUrl: canonicalUrl,
    ogImage: post.value.image,
    ogImageAlt: post.value.alt,
    articlePublishedTime: post.value.date,
    articleModifiedTime: post.value.updated || post.value.date,
    articleAuthor: [post.value.author.name],
    articleSection: post.value.category,
    articleTag: post.value.tags,
    twitterCard: 'summary_large_image',
    twitterTitle: post.value.title,
    twitterDescription: post.value.description,
    twitterImage: post.value.image
  })

  // BlogPosting schema
  useSchemaOrg([
    <BlogPosting>{
      '@type': 'BlogPosting',
      headline: post.value.title,
      description: post.value.description,
      image: post.value.image,
      datePublished: post.value.date,
      dateModified: post.value.updated || post.value.date,
      author: {
        '@type': 'Organization',
        name: post.value.author.name,
        url: franchise.website
      },
      publisher: {
        '@type': 'Organization',
        name: franchise.shortname,
        logo: {
          '@type': 'ImageObject',
          url: franchise.logo
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl
      },
      keywords: post.value.tags?.join(', ')
    },
    <BreadcrumbList>{
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: franchise.website
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: `${franchise.website}/blog`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.value.title
        }
      ]
    }
  ])
}

definePageMeta({
  colorMode: 'light'
})
</script>

<style>
/* Prose styling for markdown content */
.prose h2 {
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  color: rgb(17, 24, 39);
  margin-top: 2rem;
  margin-bottom: 1rem;
  text-decoration: none;
  border-bottom: none;
}

.prose h2:target {
  scroll-margin-top: 5rem;
}

.prose h3 {
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 700;
  color: rgb(31, 41, 55);
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.prose p {
  color: rgb(55, 65, 81);
  margin-bottom: 1rem;
  line-height: 1.625;
}

.prose ul {
  list-style-type: disc;
  list-style-position: inside;
  margin-bottom: 1rem;
}

.prose ul > * + * {
  margin-top: 0.5rem;
}

.prose ol {
  list-style-type: decimal;
  list-style-position: inside;
  margin-bottom: 1rem;
}

.prose ol > * + * {
  margin-top: 0.5rem;
}

.prose li {
  color: rgb(55, 65, 81);
}

.prose a {
  color: #cc022b;
  text-decoration: underline;
}

.prose a:hover {
  color: #94001e;
}

.prose strong {
  font-weight: 700;
  color: rgb(17, 24, 39);
}

.prose blockquote {
  border-left-width: 4px;
  border-left-style: solid;
  border-color: #cc022b;
  padding-left: 1rem;
  font-style: italic;
  color: rgb(75, 85, 99);
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.prose code {
  background-color: rgb(243, 244, 246);
  color: #cc022b;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.prose pre {
  background-color: rgb(17, 24, 39);
  color: rgb(243, 244, 246);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.prose pre code {
  background-color: transparent;
  color: inherit;
  padding: 0;
}

.prose img {
  border-radius: 0.5rem;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.prose hr {
  border-color: rgb(229, 231, 235);
  margin-top: 2rem;
  margin-bottom: 2rem;
}

/* Tables styling */
.prose table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.prose th {
  background-color: rgb(243, 244, 246);
  color: rgb(17, 24, 39);
  font-weight: 600;
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid rgb(229, 231, 235);
}

.prose td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgb(229, 231, 235);
  color: rgb(55, 65, 81);
}

.prose tr:hover {
  background-color: rgb(249, 250, 251);
}
</style>
