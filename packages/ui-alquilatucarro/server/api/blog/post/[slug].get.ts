import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { loadDynamicPosts } from '../../../plugins/content-dynamic-loader'
import { logger } from '../../../utils/logger'
import { handleBlogApiError, BlogApiError } from '../../../utils/error-handler'

/**
 * GET /api/blog/post/:slug
 *
 * Public endpoint. Serves a single blog post from Vercel Blob cache,
 * parsed as a Nuxt Content-compatible document for ContentRenderer.
 */
export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')

    if (!slug) {
      throw new BlogApiError('Missing slug parameter', 400)
    }

    logger.info('blog-post-request', { slug })

    const posts = await loadDynamicPosts()
    const post = posts.find(p => p.slug === slug)

    if (!post) {
      throw new BlogApiError(`Post not found: ${slug}`, 404)
    }

    // Parse markdown (frontmatter + body AST) using @nuxtjs/mdc
    const parsed = await parseMarkdown(post.content)

    // Merge frontmatter fields with body AST into a flat BlogPost document
    return {
      ...parsed.data,
      path: `/blog/${slug}`,
      body: parsed.body
    }
  } catch (error) {
    return handleBlogApiError(error, 'blog-post')
  }
})
