import { useSupabaseAdminClient } from '../../../../../logic/server/utils/supabase'
import { logger } from '../../../utils/logger'
import { BlogApiError, handleBlogApiError } from '../../../utils/error-handler'

const BUCKET = 'blog-images'

/**
 * Extract Supabase Storage object paths for images referenced in the post body.
 * Matches public URLs that contain `/blog-images/` and returns the path *within*
 * the bucket (e.g. `alquilatucarro/content/123-abc.webp`).
 */
function extractStoragePaths(body: string): string[] {
  const urlPattern = /https?:\/\/[^\s)"']+\/blog-images\/([^\s)"']+)/g
  const paths: string[] = []
  let match: RegExpExecArray | null
  while ((match = urlPattern.exec(body)) !== null) {
    if (match[1]) paths.push(decodeURIComponent(match[1]))
  }
  return [...new Set(paths)]
}

/**
 * DELETE /api/blog/post/:slug
 *
 * Protected (X-Api-Key, blog-api-auth middleware). Deletes this brand's post
 * row from Supabase `blog_posts` and best-effort removes any images it
 * references from Supabase Storage (issue #52). Unknown slug → 404.
 */
export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')
    if (!slug) {
      throw new BlogApiError('Missing slug parameter', 400)
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new BlogApiError('Invalid slug format: must be lowercase alphanumeric with hyphens', 400)
    }

    const franchise = useRuntimeConfig(event).public.rentacarFranchise as string
    logger.info('blog-delete-start', { slug, franchise })

    const supabase = useSupabaseAdminClient()

    const { data: post, error: selErr } = await supabase
      .from('blog_posts')
      .select('body')
      .eq('brand', franchise)
      .eq('slug', slug)
      .maybeSingle()
    if (selErr) {
      throw createError({ statusCode: 500, statusMessage: `blog post lookup failed: ${selErr.message}` })
    }
    if (!post) {
      throw new BlogApiError(`Post not found: ${slug}`, 404)
    }

    // Best-effort image cleanup — orphaned images must not block the delete.
    const imagePaths = extractStoragePaths((post.body as string) ?? '')
    let deletedImages: string[] = []
    if (imagePaths.length > 0) {
      const { data: removed, error: rmErr } = await supabase.storage.from(BUCKET).remove(imagePaths)
      if (rmErr) {
        logger.warn('blog-delete-image-warn', { error: rmErr.message, slug, count: imagePaths.length })
      } else {
        deletedImages = (removed ?? []).map((o) => o.name)
      }
    }

    const { error: delErr } = await supabase
      .from('blog_posts')
      .delete()
      .eq('brand', franchise)
      .eq('slug', slug)
    if (delErr) {
      throw createError({ statusCode: 500, statusMessage: `blog post delete failed: ${delErr.message}` })
    }

    logger.info('blog-delete-complete', { slug, imagesDeleted: deletedImages.length })

    return { success: true, deleted: { post: slug, images: deletedImages } }
  } catch (error) {
    return handleBlogApiError(error, 'blog-delete')
  }
})
