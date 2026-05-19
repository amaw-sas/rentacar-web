import { downloadFromStorage, deleteFromStorage } from '../../../utils/blob-storage'
import { invalidateCache } from '../../../plugins/content-dynamic-loader'
import { logger } from '../../../utils/logger'
import { BlogApiError, handleBlogApiError } from '../../../utils/error-handler'

/**
 * Extract Vercel Blob image URLs embedded in markdown content.
 * Matches: https://*.public.blob.vercel-storage.com/blog-images/{type}/{filename}
 * Also matches legacy GCS URLs for backwards compatibility.
 */
function extractImageUrls(markdownContent: string): string[] {
  const urlPattern = /https:\/\/[^\s)"']+\/blog-images\/[^\s)"']+/g
  const urls: string[] = []
  let match: RegExpExecArray | null
  while ((match = urlPattern.exec(markdownContent)) !== null) {
    urls.push(match[0])
  }
  return [...new Set(urls)]
}

/**
 * DELETE /api/blog/post/:slug
 *
 * Protected: requires X-Api-Key header (enforced by blog-api-auth middleware).
 * Deletes the markdown file and all images referenced in its content.
 * Invalidates the in-memory post cache so the listing reflects the change immediately.
 *
 * Response: { success, deleted: { post: string, images: string[] } }
 */
export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')

    if (!slug) {
      throw new BlogApiError('Missing slug parameter', 400)
    }

    // Validate slug to prevent path traversal
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new BlogApiError('Invalid slug format: must be lowercase alphanumeric with hyphens', 400)
    }

    const config = useRuntimeConfig()
    const franchise = config.public.rentacarFranchise as string
    const postPath = `blog-posts/${franchise}/${slug}.md`

    logger.info('blog-delete-start', { slug, postPath })

    // Download markdown to find referenced images (throws if not found)
    const markdownBuffer = await downloadFromStorage(postPath)
    const markdownContent = markdownBuffer.toString('utf-8')

    // Extract image URLs from the markdown content
    const imageUrls = extractImageUrls(markdownContent)

    // Delete images best-effort (don't fail the whole operation for orphaned images)
    const deletedImages = (await Promise.all(
      imageUrls.map(async (imageUrl) => {
        try {
          await deleteFromStorage(imageUrl)
          return imageUrl
        } catch (error) {
          logger.warn('blog-delete-image-warn', error, { imageUrl, slug })
          return null
        }
      })
    )).filter((p): p is string => p !== null)

    // Delete the markdown post (must succeed — this is the primary operation)
    await deleteFromStorage(postPath)

    // Invalidate cache so next listing request fetches from storage
    invalidateCache()

    logger.info('blog-delete-complete', {
      slug,
      postPath,
      imagesDeleted: deletedImages.length
    })

    return {
      success: true,
      deleted: {
        post: postPath,
        images: deletedImages
      }
    }
  } catch (error) {
    return handleBlogApiError(error, 'blog-delete')
  }
})
