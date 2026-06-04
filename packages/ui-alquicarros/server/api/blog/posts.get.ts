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
 */
const LIST_COLUMNS =
  'slug,title,description,image,alt,author_name,author_avatar,date,updated,category,tags,reading_time,featured,faq_items,meta_title'

export default defineCachedEventHandler(
  async (event) => {
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
  },
  {
    maxAge: 3600,
    name: 'blog-posts',
    // Scope to the deployment build (same rationale as /api/rentacar-data, #62):
    // Vercel restores Nitro's cache across builds, so without a per-build key a
    // new deploy could serve a previous deploy's response.
    getKey: (event) => {
      const buildId = useRuntimeConfig(event).app.buildId
      if (!buildId) {
        throw createError({ statusCode: 500, statusMessage: 'blog-posts cache: empty app.buildId' })
      }
      return `blog-posts:${buildId}`
    },
  },
)
