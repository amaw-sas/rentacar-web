import { defineEventHandler, readBody } from 'h3'
import { transformWordPressToNuxt, type WordPressPost } from '../../utils/wordpress-to-nuxt'
import { useSupabaseAdminClient } from '../../../../logic/server/utils/supabase'
import { logger } from '../../utils/logger'
import { handleBlogApiError, BlogApiError } from '../../utils/error-handler'

/**
 * POST /api/blog/wordpress-sync
 *
 * Protected (X-Api-Key, blog-api-auth middleware). Transforms a WordPress REST
 * payload and upserts it into Supabase `blog_posts` for this brand — single
 * source of truth (issue #52). Replaces the Vercel Blob markdown write.
 */

// Author name per brand (mirrors franchises.display_name used by the seed).
const AUTHOR_NAMES: Record<string, string> = {
  alquilatucarro: 'Alquila tu Carro',
  alquilame: 'Alquilame',
  alquicarros: 'Alquicarros',
}
const AUTHOR_AVATAR = '/img/blog/author-avatar.png'

export default defineEventHandler(async (event) => {
  try {
    const startTime = Date.now()
    const wpPost: WordPressPost = await readBody(event)

    if (!wpPost || !wpPost.title || !wpPost.content || !wpPost.slug) {
      throw new BlogApiError('Missing required fields: title, content, slug', 400)
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(wpPost.slug)) {
      throw new BlogApiError('Invalid slug format: must be lowercase alphanumeric with hyphens', 400)
    }

    logger.info('wordpress-sync-start', { slug: wpPost.slug, id: wpPost.id })

    const t = transformWordPressToNuxt(wpPost)
    const franchise = useRuntimeConfig(event).public.rentacarFranchise as string

    const row = {
      brand: franchise,
      slug: t.slug,
      title: t.title,
      description: t.description,
      body: t.body,
      image: t.image ?? '',
      alt: t.alt ?? '',
      author_name: AUTHOR_NAMES[franchise] ?? franchise,
      author_avatar: AUTHOR_AVATAR,
      date: t.date.slice(0, 10),
      updated: t.updated ? t.updated.slice(0, 10) : null,
      category: t.category,
      tags: t.tags,
      reading_time: t.readingTime,
      faq_items: t.faqItems ?? null,
      meta_title: t.metaTitle ?? null,
      updated_at: new Date().toISOString(),
    }

    const supabase = useSupabaseAdminClient()
    const { error } = await supabase.from('blog_posts').upsert(row, { onConflict: 'brand,slug' })
    if (error) {
      throw createError({ statusCode: 500, statusMessage: `blog_posts upsert failed: ${error.message}` })
    }

    logger.metric('wordpress-sync', Date.now() - startTime, { slug: t.slug, brand: franchise })

    return { success: true, slug: t.slug, brand: franchise }
  } catch (error) {
    return handleBlogApiError(error, 'wordpress-sync')
  }
})
