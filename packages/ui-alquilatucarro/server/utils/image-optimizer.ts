import sharp from 'sharp'
import { logger } from './logger'
import { BlogApiError } from './error-handler'

export type ImageType = 'featured' | 'content'

interface OptimizationConfig {
  width: number
  height?: number
  fit: 'cover' | 'inside'
  quality: number
}

const OPTIMIZATION_CONFIG: Record<ImageType, OptimizationConfig> = {
  featured: {
    width: 1920,
    height: 1080,
    fit: 'cover',
    quality: 85
  },
  content: {
    width: 1200,
    fit: 'inside',
    quality: 80
  }
}

export async function optimizeImage(
  inputBuffer: Buffer,
  type: ImageType = 'content'
): Promise<{
  buffer: Buffer
  originalSize: number
  optimizedSize: number
  savings: string
}> {
  const startTime = Date.now()

  try {
    // Validate input
    if (!inputBuffer || inputBuffer.length === 0) {
      throw new BlogApiError('Input buffer cannot be empty', 400)
    }

    const config = OPTIMIZATION_CONFIG[type]
    const originalSize = inputBuffer.length

    // Build Sharp pipeline
    let pipeline = sharp(inputBuffer)

    // Apply resize configuration
    const resizeOptions: sharp.ResizeOptions = {
      width: config.width,
      fit: config.fit
    }

    if (config.height) {
      resizeOptions.height = config.height
    }

    pipeline = pipeline.resize(resizeOptions)

    // Convert to WebP with quality settings
    pipeline = pipeline.webp({
      quality: config.quality,
      effort: 4
    })

    // Execute pipeline
    const buffer = await pipeline.toBuffer()
    const optimizedSize = buffer.length

    // Calculate savings
    const savingsPercent = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1)

    // Log metrics
    const duration = Date.now() - startTime
    logger.metric('image-optimization', duration, {
      type,
      originalSize,
      optimizedSize,
      savings: savingsPercent + '%'
    })

    return {
      buffer,
      originalSize,
      optimizedSize,
      savings: savingsPercent + '%'
    }
  } catch (error) {
    logger.error('image-optimization', error, { type })

    if (error instanceof BlogApiError) {
      throw error
    }

    throw new BlogApiError(
      'Failed to optimize image',
      500,
      { type, originalError: error instanceof Error ? error.message : String(error) }
    )
  }
}
