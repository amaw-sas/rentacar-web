import { loadDynamicPosts } from '../../plugins/content-dynamic-loader'
import { logger } from '../../utils/logger'
import { handleBlogApiError } from '../../utils/error-handler'

export default defineEventHandler(async (event) => {
  try {
    logger.info('posts-dynamic-request', { ip: getRequestIP(event) })

    const posts = await loadDynamicPosts()

    return {
      success: true,
      count: posts.length,
      posts: posts.map(p => ({
        slug: p.slug,
        path: p.path
      }))
    }
  } catch (error) {
    return handleBlogApiError(error, 'posts-dynamic')
  }
})
