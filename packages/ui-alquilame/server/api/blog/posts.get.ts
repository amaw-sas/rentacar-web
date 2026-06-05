import { useSupabaseClient } from '../../../../logic/server/utils/supabase'
import { transformBlogList } from '../../../../logic/server/utils/blogTransformers'
import { logger } from '../../utils/logger'
import { handleBlogApiError } from '../../utils/error-handler'

/**
 * GET /api/blog/posts
 *
 * Public endpoint. Returns this brand's blog posts (frontmatter only, no body)
 * from Supabase `blog_posts`, sorted by date DESC. Single source of truth —
 * replaces the Vercel Blob loader (issue #52).
 *
 * Not API-cached on purpose: the page (`/blog`) is ISR-cached (routeRules), and
 * the write path (wordpress-sync/delete) needs new posts visible on the next
 * request. A single indexed query of ~16 rows is cheap; layering a cached
 * handler here would re-introduce the stale-after-write problem the old Blob
 * loader had to fix with manual invalidation.
 */
const LIST_COLUMNS =
  'slug,title,description,image,alt,author_name,author_avatar,date,updated,category,tags,reading_time,featured,faq_items,meta_title'

export default defineEventHandler(async (event) => {
  try {
    const franchise = useRuntimeConfig(event).public.rentacarFranchise as string
    logger.info('blog-posts-request', { ip: getRequestIP(event), franchise })

    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select(LIST_COLUMNS)
      .eq('brand', franchise)
      .order('date', { ascending: false })

    if (error) {
      throw createError({ statusCode: 500, statusMessage: `blog posts query failed: ${error.message}` })
    }

    const posts = transformBlogList(data ?? [])
    return { success: true, count: posts.length, posts }
  } catch (error) {
    return handleBlogApiError(error, 'blog-posts')
  }
})
