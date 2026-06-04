import { defineEventHandler, readMultipartFormData } from 'h3'
import sharp from 'sharp'
import { createHash } from 'crypto'
import { optimizeImage } from '../../utils/image-optimizer'
import { useSupabaseAdminClient } from '../../../../logic/server/utils/supabase'
import { logger } from '../../utils/logger'
import { BlogApiError, handleBlogApiError } from '../../utils/error-handler'

const BUCKET = 'blog-images'

/**
 * POST /api/blog/upload-image
 *
 * Protected (X-Api-Key). Optimizes an uploaded image to webp and stores it in
 * Supabase Storage under `{brand}/{type}/` — single source of truth (issue #52).
 * Replaces the Vercel Blob upload. Returns the public URL.
 */
export default defineEventHandler(async (event) => {
  try {
    const startTime = Date.now()

    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw new BlogApiError('No form data provided', 400)
    }

    const fileEntry = formData.find((item) => item.name === 'file')
    const typeEntry = formData.find((item) => item.name === 'type')

    if (!fileEntry || !fileEntry.data) {
      throw new BlogApiError('No image file provided', 400)
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (fileEntry.data.length > MAX_FILE_SIZE) {
      throw new BlogApiError(
        `File too large: ${(fileEntry.data.length / 1024 / 1024).toFixed(1)}MB. Maximum: 10MB`,
        413,
      )
    }

    const typeRaw = typeEntry?.data?.toString() || 'content'
    if (typeRaw !== 'featured' && typeRaw !== 'content') {
      throw new BlogApiError(`Invalid type: ${typeRaw}. Must be 'featured' or 'content'`, 400)
    }
    const type: 'featured' | 'content' = typeRaw

    const metadata = await sharp(fileEntry.data).metadata()
    const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif']
    if (!metadata.format || !validFormats.includes(metadata.format)) {
      throw new BlogApiError(
        `Invalid image format: ${metadata.format}. Supported: ${validFormats.join(', ')}`,
        400,
      )
    }

    const optimizedResult = await optimizeImage(fileEntry.data, type)

    const franchise = useRuntimeConfig(event).public.rentacarFranchise as string
    const hash = createHash('md5').update(optimizedResult.buffer).digest('hex').substring(0, 8)
    const filename = `${Date.now()}-${hash}.webp`
    const storagePath = `${franchise}/${type}/${filename}`

    const supabase = useSupabaseAdminClient()
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, optimizedResult.buffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true,
      })
    if (upErr) {
      throw createError({ statusCode: 500, statusMessage: `image upload failed: ${upErr.message}` })
    }

    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl

    logger.metric('upload-image', Date.now() - startTime, {
      type,
      originalSize: optimizedResult.originalSize,
      optimizedSize: optimizedResult.optimizedSize,
      savings: optimizedResult.savings,
    })

    return {
      success: true,
      url: publicUrl,
      filename,
      originalSize: optimizedResult.originalSize,
      optimizedSize: optimizedResult.optimizedSize,
      savings: optimizedResult.savings,
    }
  } catch (error) {
    return handleBlogApiError(error, 'upload-image')
  }
})
