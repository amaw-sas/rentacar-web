<template>
  <UPage>
    <section class="bg-linear-to-b from-footer-from to-footer-to px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <NuxtLink to="/blog" class="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-8">
          <UIcon name="i-lucide-arrow-left" class="size-4" />
          Volver al blog
        </NuxtLink>

        <div class="flex flex-col sm:flex-row sm:items-center gap-8">
          <img
            v-if="authorPhoto"
            :src="authorPhoto"
            alt="Diego Melo"
            class="size-32 rounded-full object-cover ring-4 ring-white/20"
            width="128"
            height="128"
          >
          <div>
            <p class="text-brand-200 font-semibold mb-2">Director General, Alquílame</p>
            <h1 class="heading-page text-white">Diego Melo</h1>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <div class="prose prose-lg prose-gray max-w-none">
          <p>
            Lleva más de diez años alquilando carros en Colombia, con flota propia y convenios
            empresariales. Dirige la operación de Alquílame, hoy en 19 ciudades y más de 30 sedes.
          </p>
          <p>
            Viene del marketing, así que cuando escribe sobre precios o temporadas no repite lo que
            dice el sector: mira los números de sus propias reservas.
          </p>
        </div>

        <div class="mt-12 border-t border-gray-200 pt-10">
          <h2 class="heading-section text-gray-900">Artículos de Diego Melo</h2>
          <div v-if="posts.length" class="grid gap-6 mt-6 sm:grid-cols-2">
            <NuxtLink
              v-for="post in posts"
              :key="post.slug"
              :to="`/blog/${post.slug}`"
              class="block rounded-xl border border-gray-200 p-5 hover:border-brand-300 hover:shadow-md transition-all"
            >
              <h3 class="heading-sub text-gray-900">{{ post.title }}</h3>
              <p class="text-sm text-gray-600 mt-2 line-clamp-3">{{ post.description }}</p>
              <time :datetime="post.date" class="block text-xs text-gray-500 mt-4">
                {{ formatDate(post.date) }}
              </time>
            </NuxtLink>
          </div>
          <p v-else class="text-gray-600 mt-6">Los artículos firmados aparecerán aquí.</p>
        </div>
      </div>
    </section>
  </UPage>
</template>

<script setup lang="ts">
import type { BlogPost } from '@rentacar-main/logic/src'

const { franchise } = useAppConfig()
const authorPhotoFiles = import.meta.glob(
  './images/diego-melo.{avif,webp,jpg,jpeg,png}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>
const authorPhoto = Object.values(authorPhotoFiles)[0]

const { data: postsData } = await useAsyncData('author-diego-melo-posts', async () => {
  const result = await $fetch<{ success: boolean; posts: BlogPost[] }>('/api/blog/posts')
  return result?.posts ?? []
})
const posts = computed(() => postsData.value ?? [])

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const canonicalUrl = `${franchise.website}/blog/autores/diego-melo`

useHead({
  title: 'Diego Melo — Director General, Alquílame',
  link: [{ rel: 'canonical', href: canonicalUrl }],
})

useSeoMeta({
  title: 'Diego Melo — Director General, Alquílame',
  description: 'Conoce a Diego Melo, Director General de Alquílame y autor de sus análisis sobre alquiler de carros en Colombia.',
  ogTitle: 'Diego Melo — Director General, Alquílame',
  ogDescription: 'Más de diez años alquilando carros en Colombia con datos de una operación presente en 19 ciudades.',
  ogType: 'profile',
  ogUrl: canonicalUrl,
})

definePageMeta({
  colorMode: 'light',
})
</script>
