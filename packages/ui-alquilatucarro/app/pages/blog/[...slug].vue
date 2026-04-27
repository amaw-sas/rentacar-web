<template>
  <UPage v-if="post">
    <!-- Reading Progress Bar -->
    <div class="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
      <div
        class="h-full bg-red-700 transition-all duration-150 ease-out"
        :style="{ width: `${readingProgress}%` }"
      />
    </div>

    <!-- Hero Image -->
    <div class="relative w-full h-64 md:h-96 overflow-hidden">
      <img
        :src="post.image"
        :alt="post.alt"
        class="w-full h-full object-cover"
        width="1280"
        height="384"
        fetchpriority="high"
      >
      <div class="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
      <div class="absolute bottom-0 left-0 right-0 p-6 md:p-12">
        <div class="max-w-4xl mx-auto">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-red-700 rounded-full mb-4">
            <UIcon :name="getCategoryIcon(post.category)" class="size-3.5" />
            {{ formatCategory(post.category) }}
          </span>
          <h1 class="text-2xl md:text-4xl font-bold text-white mb-4">
            {{ post.title }}
          </h1>
          <div class="flex flex-wrap items-center gap-4 text-sm text-gray-300">
            <div class="flex items-center gap-2">
              <img
                v-if="!avatarError"
                :src="post.author.avatar"
                :alt="post.author.name"
                class="w-8 h-8 rounded-full"
                loading="lazy"
                @error="avatarError = true"
              >
              <div v-else class="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {{ post.author.name.charAt(0) }}
              </div>
              <span>{{ post.author.name }}</span>
            </div>
            <span class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-calendar" class="size-4" />
              <time :datetime="post.date">{{ formatDate(post.date) }}</time>
            </span>
            <span v-if="post.updated && post.updated !== post.date" class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-refresh-cw" class="size-4" />
              Actualizado: <time :datetime="post.updated">{{ formatDate(post.updated) }}</time>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-clock" class="size-4" />
              {{ post.readingTime }} min de lectura
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Breadcrumbs -->
    <nav aria-label="Breadcrumb" class="bg-gray-100 border-b border-gray-200 px-4 md:px-8 py-3">
      <ol class="max-w-7xl mx-auto flex items-center gap-2 text-sm text-gray-500">
        <li>
          <NuxtLink to="/" class="hover:text-red-700 transition-colors">Inicio</NuxtLink>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-lucide-chevron-right" class="size-3.5" />
          <NuxtLink to="/blog" class="hover:text-red-700 transition-colors">Blog</NuxtLink>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-lucide-chevron-right" class="size-3.5" />
          <span class="text-gray-900 font-medium truncate max-w-xs">{{ post.title }}</span>
        </li>
      </ol>
    </nav>

    <!-- Content Section -->
    <section class="bg-white py-8 md:py-12">
      <div class="max-w-7xl mx-auto px-4 md:px-8">
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- Main Content -->
          <article ref="articleRef" class="lg:w-2/3 prose prose-lg prose-gray max-w-none">
            <ContentRenderer :value="post" />
          </article>

          <!-- Sidebar -->
          <aside class="lg:w-1/3">
            <div class="space-y-8">
              <!-- Table of Contents -->
              <nav v-if="post.body?.toc?.links?.length" data-blog-toc class="bg-gray-50 rounded-xl p-4">
                <h3 class="font-bold text-gray-900 mb-3">Contenido</h3>
                <ul class="space-y-2">
                  <li v-for="link in post.body.toc.links" :key="link.id">
                    <a
                      :href="`#${link.id}`"
                      class="text-sm text-gray-600 hover:text-red-700 underline underline-offset-2 transition-colors"
                    >
                      {{ link.text }}
                    </a>
                  </li>
                </ul>
              </nav>

              <!-- Tags -->
              <div v-if="post.tags?.length" class="bg-gray-50 rounded-xl p-6">
                <h3 class="font-bold text-gray-900 mb-4">Etiquetas</h3>
                <div class="flex flex-wrap gap-2">
                  <NuxtLink
                    v-for="tag in post.tags"
                    :key="tag"
                    :to="{ path: '/blog', query: { tag } }"
                    class="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-red-100 hover:text-red-700 transition-colors"
                  >
                    {{ tag }}
                  </NuxtLink>
                </div>
              </div>

              <!-- Share Buttons (Desktop) -->
              <div class="hidden lg:block bg-gray-50 rounded-xl p-6">
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
                    class="flex items-center justify-center w-10 h-10 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors"
                    aria-label="Copiar enlace"
                  >
                    <UIcon :name="linkCopied ? 'i-lucide-check' : 'i-lucide-link'" class="size-5" />
                  </button>
                </div>
              </div>

              <!-- CTA -->
              <div class="bg-red-700 rounded-xl p-6 text-white">
                <h3 class="font-bold mb-2">¿Listo para reservar?</h3>
                <p class="text-sm text-red-100 mb-4">Sin anticipos, sin compromisos</p>
                <NuxtLink
                  to="/"
                  class="block text-center bg-white text-red-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
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
        <div class="bg-gray-50 rounded-2xl p-6 md:p-8">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <img
              v-if="!avatarError"
              :src="post.author.avatar"
              :alt="post.author.name"
              class="w-20 h-20 rounded-full object-cover ring-2 ring-red-100"
              loading="lazy"
              @error="avatarError = true"
            >
            <div v-else class="w-20 h-20 rounded-full bg-blue-700 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-blue-100 shrink-0">
              {{ post.author.name.charAt(0) }}
            </div>
            <div class="text-center sm:text-left flex-1">
              <div class="flex items-center justify-center sm:justify-start gap-2">
                <h3 class="text-lg font-bold text-gray-900">{{ post.author.name }}</h3>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                  <UIcon name="i-lucide-badge-check" class="size-3" />
                  Verificado
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-0.5">Equipo Editorial · Guías de viaje en carro</p>
              <p class="text-gray-600 mt-3 text-sm">
                Creamos guías prácticas para viajeros en Colombia basadas en experiencia real.
                Con más de 27 sedes en el país, nuestro equipo conoce las rutas, requisitos y
                recomendaciones que necesitas para viajar tranquilo.
              </p>
              <div class="mt-4 flex flex-col sm:flex-row items-center gap-3">
                <NuxtLink
                  to="/"
                  class="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                >
                  <UIcon name="i-lucide-car" class="size-4" />
                  Reservar un Carro
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Related Posts -->
    <section v-if="relatedPosts?.length" class="bg-gray-100 py-12 px-4 md:px-8">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-xl font-bold text-gray-800 mb-6">Artículos Relacionados</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NuxtLink
            v-for="related in relatedPosts"
            :key="related.path"
            :to="related.path"
            class="group"
          >
            <article class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
              <img
                :src="related.image"
                :alt="related.alt"
                class="w-full h-40 object-cover"
                width="400"
                height="160"
                loading="lazy"
              >
              <div class="p-4">
                <h3 class="font-bold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-2">
                  {{ related.title }}
                </h3>
                <p class="text-sm text-gray-500 mt-2">{{ related.readingTime }} min de lectura</p>
              </div>
            </article>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Prev/Next Navigation + Back to Blog -->
    <section class="bg-gray-100 py-8 px-4 md:px-8 border-t border-gray-200">
      <div class="max-w-4xl mx-auto space-y-4">
        <div v-if="surroundings" class="grid grid-cols-2 gap-4">
          <NuxtLink
            v-if="surroundings[0]"
            :to="surroundings[0].path"
            class="group flex items-start gap-3 p-4 rounded-xl bg-white hover:bg-red-50/50 shadow-sm transition-all"
          >
            <UIcon name="i-lucide-arrow-left" class="size-5 text-gray-400 group-hover:text-red-700 mt-0.5 shrink-0 transition-colors" />
            <div class="min-w-0">
              <span class="text-xs text-gray-500">Anterior</span>
              <p class="text-sm font-medium text-gray-900 group-hover:text-red-700 line-clamp-2 transition-colors">
                {{ surroundings[0].title }}
              </p>
            </div>
          </NuxtLink>
          <div v-else />
          <NuxtLink
            v-if="surroundings[1]"
            :to="surroundings[1].path"
            class="group flex items-start gap-3 p-4 rounded-xl bg-white hover:bg-red-50/50 shadow-sm transition-all text-right flex-row-reverse"
          >
            <UIcon name="i-lucide-arrow-right" class="size-5 text-gray-400 group-hover:text-red-700 mt-0.5 shrink-0 transition-colors" />
            <div class="min-w-0">
              <span class="text-xs text-gray-500">Siguiente</span>
              <p class="text-sm font-medium text-gray-900 group-hover:text-red-700 line-clamp-2 transition-colors">
                {{ surroundings[1].title }}
              </p>
            </div>
          </NuxtLink>
        </div>
        <div class="text-center">
          <NuxtLink
            to="/blog"
            class="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl shadow-sm transition-colors"
          >
            <span>&larr;</span>
            <span>Volver al Blog</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Inline CTA Banner -->
    <section class="bg-gradient-to-r from-gray-900 to-gray-800 py-10 px-4 md:px-8">
      <div class="max-w-4xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-red-300 bg-red-900/30 rounded-full mb-3">
          <UIcon name="i-lucide-car" class="size-3.5" />
          Sin anticipos · 27 sedes en Colombia
        </div>
        <h2 class="text-xl md:text-2xl font-bold text-white mb-2">
          ¿Te ayudamos a planear tu viaje?
        </h2>
        <p class="text-gray-400 text-sm">
          Escríbenos por WhatsApp para recibir asesoría personalizada sobre rutas, vehículos y tarifas.
        </p>
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
          class="flex items-center justify-center w-9 h-9 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors"
          aria-label="Copiar enlace"
        >
          <UIcon :name="linkCopied ? 'i-lucide-check' : 'i-lucide-link'" class="size-4" />
        </button>
      </div>
    </div>
  </UPage>

  <!-- 404 -->
  <div v-else class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Artículo no encontrado</h1>
      <p class="text-gray-600 mb-6">El artículo que buscas no existe o ha sido movido.</p>
      <NuxtLink
        to="/blog"
        class="inline-block bg-red-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-800 transition-colors"
      >
        Ir al Blog
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BlogPosting, BreadcrumbList, FAQPage } from 'schema-dts'
import type { BlogPost } from '@rentacar-main/logic/src'

const { franchise } = useAppConfig()
const route = useRoute()

// Get the slug from route params
const slug = computed(() => {
  const params = route.params.slug
  return Array.isArray(params) ? params.join('/') : params
})

// Fetch the blog post from Firebase Storage via API (dynamic posts)
const { data: post } = await useAsyncData(`blog-${slug.value}`, () =>
  $fetch<BlogPost>(`/api/blog/post/${slug.value}`)
    .catch(() => null)
)

// Fetch related posts (same category, excluding current)
const { data: relatedPosts } = await useAsyncData(`related-${slug.value}`, async () => {
  if (!post.value) return []
  return queryCollection<BlogPost>('blog')
    .where('category', '=', post.value.category)
    .where('path', '!=', post.value.path)
    .limit(3)
    .all()
})

// Prev/Next navigation (by date, not alphabetical path)
const { data: surroundings } = await useAsyncData(`surroundings-${slug.value}`, async () => {
  if (!post.value) return [null, null]
  const allPosts = await queryCollection<BlogPost>('blog')
    .order('date', 'DESC')
    .all()
  const currentIndex = allPosts.findIndex(p => p.path === post.value!.path)
  if (currentIndex === -1) return [null, null]
  // In DESC order: index+1 = older (prev), index-1 = newer (next)
  const prev = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null
  const next = currentIndex > 0 ? allPosts[currentIndex - 1] : null
  return [prev, next]
})

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

  // Check if avatar failed before Vue hydration (SSR race condition)
  const avatarImg = document.querySelector('img.rounded-full[loading="lazy"]') as HTMLImageElement
  if (avatarImg && avatarImg.complete && avatarImg.naturalWidth === 0) {
    avatarError.value = true
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateReadingProgress)
})

const { formatDate, formatCategory, getCategoryIcon, resolveImageUrl } = useBlogUtils()

// Avatar fallback
const avatarError = ref(false)

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
    title: `${post.value.metaTitle ?? post.value.title} | ${franchise.shortname}`,
    link: [
      { rel: 'canonical', href: canonicalUrl }
    ]
  })

  useSeoMeta({
    title: post.value.metaTitle ?? post.value.title,
    description: post.value.description,
    ogTitle: post.value.title,
    ogDescription: post.value.description,
    ogType: 'article',
    ogUrl: canonicalUrl,
    ogImage: resolveImageUrl(post.value.image, franchise.website),
    ogImageAlt: post.value.alt,
    articlePublishedTime: post.value.date,
    articleModifiedTime: post.value.updated ?? post.value.date,
    articleAuthor: post.value.author.name,
    articleSection: post.value.category,
    articleTag: post.value.tags?.join(', ') || undefined,
    twitterCard: 'summary_large_image',
    twitterTitle: post.value.metaTitle ?? post.value.title,
    twitterDescription: post.value.description,
    twitterImage: resolveImageUrl(post.value.image, franchise.website)
  })

  // BlogPosting schema
  useSchemaOrg([
    <BlogPosting>{
      '@type': 'BlogPosting',
      headline: post.value.title,
      description: post.value.description,
      image: resolveImageUrl(post.value.image, franchise.website),
      datePublished: post.value.date,
      dateModified: post.value.updated ?? post.value.date,
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
    },
    // FAQPage schema — only when post has faqItems from the pipeline
    ...(post.value.faqItems?.length ? [<FAQPage>{
      '@type': 'FAQPage',
      mainEntity: post.value.faqItems.map((faq: { question: string; answer: string }) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    }] : [])
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

/* Remove link styling from heading anchors - keep them as regular text */
.prose h2 a,
.prose h3 a,
.prose h4 a {
  color: inherit;
  text-decoration: none;
  cursor: text;
  pointer-events: none;
}

.prose h2:target,
.prose h3:target,
.prose h4:target {
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
  color: rgb(185, 28, 28);
  text-decoration: underline;
}

.prose a:hover {
  color: rgb(153, 27, 27);
}

.prose strong {
  font-weight: 700;
  color: rgb(17, 24, 39);
}

.prose blockquote {
  border-left-width: 4px;
  border-left-style: solid;
  border-color: rgb(185, 28, 28);
  padding-left: 1rem;
  font-style: italic;
  color: rgb(75, 85, 99);
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.prose code {
  background-color: rgb(243, 244, 246);
  color: rgb(185, 28, 28);
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
