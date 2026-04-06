import { defineEventHandler, readBody } from 'h3'
import { transformWordPressToNuxt, type WordPressPost } from '../../utils/wordpress-to-nuxt'
import { uploadToStorage } from '../../utils/firebase-storage'
import { logger } from '../../utils/logger'
import { handleBlogApiError, BlogApiError } from '../../utils/error-handler'

/**
 * POST /api/blog/wordpress-sync
 *
 * Receives WordPress REST API payload and transforms it to Nuxt Content format.
 * Stores the result as markdown file in Firebase Storage.
 *
 * Request body: WordPress REST API post object
 * Response: { success, filename, path, size }
 */
export default defineEventHandler(async (event) => {
  try {
    const startTime = Date.now()

    // Parse request body
    const wpPost: WordPressPost = await readBody(event)

    // Validate required fields
    if (!wpPost || !wpPost.title || !wpPost.content || !wpPost.slug) {
      throw new BlogApiError('Missing required fields: title, content, slug', 400)
    }

    // Validate slug format to prevent path traversal
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(wpPost.slug)) {
      throw new BlogApiError('Invalid slug format: must be lowercase alphanumeric with hyphens', 400)
    }

    // Log sync request
    logger.info('wordpress-sync-start', { slug: wpPost.slug, id: wpPost.id })

    // Transform WordPress post to Nuxt Content format
    const nuxtPost = transformWordPressToNuxt(wpPost)

    // Generate markdown content (frontmatter + body)
    const markdownContent = `${nuxtPost.frontmatter}\n\n${nuxtPost.body}`
    const markdownBuffer = Buffer.from(markdownContent, 'utf-8')

    // Upload to Firebase Storage (brand-scoped path)
    const franchise = useRuntimeConfig().public.rentacarFranchise
    const storagePath = `blog-posts/${franchise}/${nuxtPost.slug}.md`
    await uploadToStorage(
      markdownBuffer,
      storagePath,
      'text/markdown'
    )

    // Log metrics
    logger.metric('wordpress-sync', Date.now() - startTime, {
      slug: nuxtPost.slug,
      size: markdownBuffer.length
    })

    // Return confirmation
    return {
      success: true,
      filename: `${nuxtPost.slug}.md`,
      path: storagePath,
      size: markdownBuffer.length
    }
  } catch (error) {
    return handleBlogApiError(error, 'wordpress-sync')
  }
})
