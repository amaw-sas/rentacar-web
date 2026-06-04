import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { useSupabaseClient } from '../../../../../logic/server/utils/supabase'
import { transformBlogPost } from '../../../../../logic/server/utils/blogTransformers'
import { logger } from '../../../utils/logger'
import { handleBlogApiError, BlogApiError } from '../../../utils/error-handler'

/**
 * GET /api/blog/post/:slug
 *
 * Public endpoint. Serves a single blog post for this brand from Supabase
 * `blog_posts`. The stored markdown `body` is parsed to an MDC AST for the
 * page's renderer. Single source of truth — replaces the Vercel Blob loader
 * (issue #52). Unknown slug → 404.
 */
const POST_COLUMNS =
  'slug,title,description,body,image,alt,author_name,author_avatar,date,updated,category,tags,reading_time,featured,faq_items,meta_title'

export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')
    if (!slug) {
      throw new BlogApiError('Missing slug parameter', 400)
    }

    const franchise = useRuntimeConfig(event).public.rentacarFranchise as string
    logger.info('blog-post-request', { slug, franchise })

    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select(POST_COLUMNS)
      .eq('brand', franchise)
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      throw createError({ statusCode: 500, statusMessage: `blog post query failed: ${error.message}` })
    }
    if (!data) {
      throw new BlogApiError(`Post not found: ${slug}`, 404)
    }

    const post = transformBlogPost(data)
    const parsed = await parseMarkdown(data.body as string)

    return { ...post, body: parsed.body }
  } catch (error) {
    return handleBlogApiError(error, 'blog-post')
  }
})
