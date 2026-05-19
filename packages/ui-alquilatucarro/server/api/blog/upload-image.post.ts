import { defineEventHandler, readMultipartFormData } from 'h3'
import sharp from 'sharp'
import { createHash } from 'crypto'
import { optimizeImage } from '../../utils/image-optimizer'
import { uploadToStorage } from '../../utils/blob-storage'
import { logger } from '../../utils/logger'
import { BlogApiError, handleBlogApiError } from '../../utils/error-handler'

export default defineEventHandler(async (event) => {
  try {
    const startTime = Date.now()

    // Parse form data
    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw new BlogApiError('No form data provided', 400)
    }

    // Extract file and type
    const fileEntry = formData.find(item => item.name === 'file')
    const typeEntry = formData.find(item => item.name === 'type')
    const altEntry = formData.find(item => item.name === 'alt')

    if (!fileEntry || !fileEntry.data) {
      throw new BlogApiError('No image file provided', 400)
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (fileEntry.data.length > MAX_FILE_SIZE) {
      throw new BlogApiError(
        `File too large: ${(fileEntry.data.length / 1024 / 1024).toFixed(1)}MB. Maximum: 10MB`,
        413  // Payload Too Large
      )
    }

    // Validate and sanitize type parameter
    const typeRaw = typeEntry?.data?.toString() || 'content'
    if (typeRaw !== 'featured' && typeRaw !== 'content') {
      throw new BlogApiError(`Invalid type: ${typeRaw}. Must be 'featured' or 'content'`, 400)
    }
    const type: 'featured' | 'content' = typeRaw as 'featured' | 'content'

    // Extract alt text for future WordPress sync
    const altText = altEntry?.data?.toString() || ''

    // Validate image type from buffer using Sharp
    const metadata = await sharp(fileEntry.data).metadata()
    const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif']

    if (!metadata.format || !validFormats.includes(metadata.format)) {
      throw new BlogApiError(
        `Invalid image format: ${metadata.format}. Supported: ${validFormats.join(', ')}`,
        400
      )
    }

    // Optimize image
    const optimizedResult = await optimizeImage(fileEntry.data, type)

    // Generate unique filename with timestamp and hash
    const timestamp = Date.now()
    const hash = createHash('md5')
      .update(optimizedResult.buffer)
      .digest('hex')
      .substring(0, 8)
    const filename = `${timestamp}-${hash}.webp`
    const storagePath = `blog-images/${type}/${filename}`

    // Upload to Vercel Blob
    const publicUrl = await uploadToStorage(
      optimizedResult.buffer,
      storagePath,
      'image/webp',
      31536000
    )

    // Log metrics
    logger.metric('upload-image', Date.now() - startTime, {
      type,
      originalSize: optimizedResult.originalSize,
      optimizedSize: optimizedResult.optimizedSize,
      savings: optimizedResult.savings
    })

    // Return response (API contract compliance)
    return {
      success: true,
      url: publicUrl,
      filename: filename,
      originalSize: optimizedResult.originalSize,
      optimizedSize: optimizedResult.optimizedSize,
      savings: optimizedResult.savings
    }
  } catch (error) {
    return handleBlogApiError(error, 'upload-image')
  }
})
