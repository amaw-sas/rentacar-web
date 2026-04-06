import { downloadFromStorage, deleteFromStorage } from '../../../utils/firebase-storage'
import { invalidateCache } from '../../../plugins/content-dynamic-loader'
import { logger } from '../../../utils/logger'
import { BlogApiError, handleBlogApiError } from '../../../utils/error-handler'

/**
 * Extract GCS storage paths from image URLs embedded in markdown content.
 * Matches: https://storage.googleapis.com/{bucket}/blog-images/{type}/{filename}
 */
function extractImagePaths(markdownContent: string, bucketName: string): string[] {
  const escapedBucket = bucketName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const urlPattern = new RegExp(
    `https://storage\\.googleapis\\.com/${escapedBucket}/(blog-images/[^\\s)"']+)`,
    'g'
  )
  const paths: string[] = []
  let match: RegExpExecArray | null
  while ((match = urlPattern.exec(markdownContent)) !== null) {
    paths.push(match[1])
  }
  return [...new Set(paths)] // deduplicate
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
    const bucket = (config.firebaseStorageBucket as string) ||
      (process.env.GCLOUD_PROJECT ? `${process.env.GCLOUD_PROJECT}.firebasestorage.app` : '')

    const bucketMissing = !bucket
    if (bucketMissing) {
      logger.error('blog-delete-config', new Error('firebaseStorageBucket not configured — image cleanup skipped'), { slug })
    }

    const postPath = `blog-posts/${franchise}/${slug}.md`

    logger.info('blog-delete-start', { slug, postPath })

    // Download markdown to find referenced images (throws 404 if not found)
    const markdownBuffer = await downloadFromStorage(postPath)
    const markdownContent = markdownBuffer.toString('utf-8')

    // Extract image storage paths from GCS URLs in the markdown
    const imagePaths = extractImagePaths(markdownContent, bucket)

    // Delete images best-effort (don't fail the whole operation for orphaned images)
    const deletedImages = (await Promise.all(
      imagePaths.map(async (imagePath) => {
        try {
          await deleteFromStorage(imagePath)
          return imagePath
        } catch (error) {
          logger.warn('blog-delete-image-warn', error, { imagePath, slug })
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
      },
      ...(bucketMissing ? { warning: 'Image cleanup skipped: storage bucket not configured' } : {})
    }
  } catch (error) {
    return handleBlogApiError(error, 'blog-delete')
  }
})
