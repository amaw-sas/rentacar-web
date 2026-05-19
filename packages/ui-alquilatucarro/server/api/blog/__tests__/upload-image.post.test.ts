import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'crypto'

// Mock dependencies
const mockOptimizeImage = vi.fn()
const mockUploadToStorage = vi.fn()
const mockReadMultipartFormData = vi.fn()
const mockHandleBlogApiError = vi.fn()

// Mock Sharp
const mockMetadata = vi.fn()
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: mockMetadata
  }))
}))

// Mock image optimizer
vi.mock('~/server/utils/image-optimizer', () => ({
  optimizeImage: (...args: any[]) => mockOptimizeImage(...args)
}))

// Mock firebase storage
vi.mock('~/server/utils/blob-storage', () => ({
  uploadToStorage: (...args: any[]) => mockUploadToStorage(...args)
}))

// Mock h3
vi.mock('h3', () => ({
  defineEventHandler: (handler: Function) => handler,
  readMultipartFormData: (...args: any[]) => mockReadMultipartFormData(...args),
  createError: (error: any) => error
}))

// Mock logger
vi.mock('~/server/utils/logger', () => ({
  logger: {
    metric: vi.fn(),
    error: vi.fn()
  }
}))

// Mock error handler
vi.mock('~/server/utils/error-handler', () => ({
  BlogApiError: class BlogApiError extends Error {
    statusCode: number
    context?: any
    constructor(message: string, statusCode: number, context?: any) {
      super(message)
      this.statusCode = statusCode
      this.context = context
      this.name = 'BlogApiError'
    }
  },
  handleBlogApiError: (...args: any[]) => mockHandleBlogApiError(...args)
}))

describe('POST /api/blog/upload-image', () => {
  let handler: Function

  beforeEach(async () => {
    vi.clearAllMocks()

    // Import handler
    const module = await import('../upload-image.post')
    handler = module.default

    // Setup default mock behaviors
    mockMetadata.mockResolvedValue({ format: 'jpeg' })
    mockOptimizeImage.mockResolvedValue({
      buffer: Buffer.from('optimized-image-data'),
      originalSize: 1000000,
      optimizedSize: 200000,
      savings: '80.0%'
    })
    mockUploadToStorage.mockResolvedValue(
      'https://storage.googleapis.com/test-bucket/blog-images/featured/123-abc.webp'
    )
  })

  describe('successful uploads', () => {
    it('should upload featured image successfully', async () => {
      const imageBuffer = Buffer.from('test-image-data')
      const formData = [
        { name: 'file', data: imageBuffer, filename: 'test.jpg', type: 'image/jpeg' },
        { name: 'type', data: Buffer.from('featured') }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)

      const event = { mockEvent: true }
      const result = await handler(event)

      expect(mockReadMultipartFormData).toHaveBeenCalledWith(event)
      expect(mockMetadata).toHaveBeenCalled()
      expect(mockOptimizeImage).toHaveBeenCalledWith(imageBuffer, 'featured')
      expect(mockUploadToStorage).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.stringMatching(/^blog-images\/featured\/\d+-[a-z0-9]+\.webp$/),
        'image/webp'
      )
      expect(result).toEqual({
        success: true,
        url: 'https://storage.googleapis.com/test-bucket/blog-images/featured/123-abc.webp',
        filename: expect.stringMatching(/^\d+-[a-z0-9]+\.webp$/),
        originalSize: 1000000,
        optimizedSize: 200000,
        savings: '80.0%'
      })
    })

    it('should upload content image successfully', async () => {
      const imageBuffer = Buffer.from('test-image-data')
      const formData = [
        { name: 'file', data: imageBuffer, filename: 'test.png', type: 'image/png' },
        { name: 'type', data: Buffer.from('content') }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)
      mockMetadata.mockResolvedValue({ format: 'png' })

      const event = { mockEvent: true }
      const result = await handler(event)

      expect(mockOptimizeImage).toHaveBeenCalledWith(imageBuffer, 'content')
      expect(mockUploadToStorage).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.stringMatching(/^blog-images\/content\/\d+-[a-z0-9]+\.webp$/),
        'image/webp'
      )
      expect(result).toMatchObject({
        success: true,
        url: expect.any(String),
        filename: expect.any(String)
      })
    })

    it('should default to content type if not specified', async () => {
      const imageBuffer = Buffer.from('test-image-data')
      const formData = [
        { name: 'file', data: imageBuffer, filename: 'test.jpg', type: 'image/jpeg' }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)

      const event = { mockEvent: true }
      await handler(event)

      expect(mockOptimizeImage).toHaveBeenCalledWith(imageBuffer, 'content')
      expect(mockUploadToStorage).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.stringMatching(/^blog-images\/content\//),
        'image/webp'
      )
    })

    it('should generate unique filename with timestamp and hash', async () => {
      const imageBuffer = Buffer.from('test-image-data')
      const formData = [
        { name: 'file', data: imageBuffer }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)

      const event = { mockEvent: true }
      await handler(event)

      // Verify uploadToStorage was called with correct path pattern
      const uploadCall = mockUploadToStorage.mock.calls[0]
      const storagePath = uploadCall[1]

      // Should match pattern: blog-images/{type}/{timestamp}-{hash}.webp
      expect(storagePath).toMatch(/^blog-images\/(featured|content)\/\d+-[a-f0-9]{8}\.webp$/)
    })
  })

  describe('validation errors', () => {
    it('should throw error if no form data provided', async () => {
      mockReadMultipartFormData.mockResolvedValue(null)

      const event = { mockEvent: true }
      await handler(event)

      expect(mockHandleBlogApiError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No form data provided',
          statusCode: 400
        }),
        'upload-image'
      )
    })

    it('should throw error if no file provided', async () => {
      const formData = [
        { name: 'type', data: Buffer.from('featured') }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)

      const event = { mockEvent: true }
      await handler(event)

      expect(mockHandleBlogApiError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No image file provided',
          statusCode: 400
        }),
        'upload-image'
      )
    })

    it('should throw error if file has no data', async () => {
      const formData = [
        { name: 'file', data: null }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)

      const event = { mockEvent: true }
      await handler(event)

      expect(mockHandleBlogApiError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No image file provided',
          statusCode: 400
        }),
        'upload-image'
      )
    })

    it('should validate image format and reject invalid formats', async () => {
      const imageBuffer = Buffer.from('test-image-data')
      const formData = [
        { name: 'file', data: imageBuffer }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)
      mockMetadata.mockResolvedValue({ format: 'pdf' })

      const event = { mockEvent: true }
      await handler(event)

      expect(mockHandleBlogApiError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid image format'),
          statusCode: 400
        }),
        'upload-image'
      )
    })

    it('should accept valid image formats: jpeg, jpg, png, webp, gif', async () => {
      const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif']

      for (const format of validFormats) {
        vi.clearAllMocks()

        const imageBuffer = Buffer.from('test-image-data')
        const formData = [
          { name: 'file', data: imageBuffer }
        ]

        mockReadMultipartFormData.mockResolvedValue(formData)
        mockMetadata.mockResolvedValue({ format })

        const event = { mockEvent: true }
        await handler(event)

        // Should NOT call error handler
        expect(mockHandleBlogApiError).not.toHaveBeenCalled()
      }
    })
  })

  describe('error handling', () => {
    it('should handle optimization errors', async () => {
      const imageBuffer = Buffer.from('test-image-data')
      const formData = [
        { name: 'file', data: imageBuffer }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)
      mockOptimizeImage.mockRejectedValue(new Error('Optimization failed'))

      const event = { mockEvent: true }
      await handler(event)

      expect(mockHandleBlogApiError).toHaveBeenCalledWith(
        expect.any(Error),
        'upload-image'
      )
    })

    it('should handle upload errors', async () => {
      const imageBuffer = Buffer.from('test-image-data')
      const formData = [
        { name: 'file', data: imageBuffer }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)
      mockUploadToStorage.mockRejectedValue(new Error('Upload failed'))

      const event = { mockEvent: true }
      await handler(event)

      expect(mockHandleBlogApiError).toHaveBeenCalledWith(
        expect.any(Error),
        'upload-image'
      )
    })

    it('should handle Sharp metadata errors', async () => {
      const imageBuffer = Buffer.from('invalid-image')
      const formData = [
        { name: 'file', data: imageBuffer }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)
      mockMetadata.mockRejectedValue(new Error('Invalid image buffer'))

      const event = { mockEvent: true }
      await handler(event)

      expect(mockHandleBlogApiError).toHaveBeenCalledWith(
        expect.any(Error),
        'upload-image'
      )
    })
  })

  describe('metrics logging', () => {
    it('should log upload metrics', async () => {
      const { logger } = await import('~/server/utils/logger')

      const imageBuffer = Buffer.from('test-image-data')
      const formData = [
        { name: 'file', data: imageBuffer }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)

      const event = { mockEvent: true }
      await handler(event)

      expect(logger.metric).toHaveBeenCalledWith(
        'upload-image',
        expect.any(Number),
        expect.objectContaining({
          type: 'content',
          originalSize: 1000000,
          optimizedSize: 200000,
          savings: '80.0%'
        })
      )
    })
  })

  describe('file size validation', () => {
    it('should reject files larger than 10MB', async () => {
      // Create buffer larger than 10MB (10 * 1024 * 1024 bytes)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024) // 11MB
      const formData = [
        { name: 'file', data: largeBuffer, filename: 'large.jpg', type: 'image/jpeg' }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)

      const event = { mockEvent: true }
      await handler(event)

      expect(mockHandleBlogApiError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('File too large'),
          statusCode: 413
        }),
        'upload-image'
      )
    })

    it('should accept files exactly at 10MB limit', async () => {
      const maxBuffer = Buffer.alloc(10 * 1024 * 1024) // Exactly 10MB
      const formData = [
        { name: 'file', data: maxBuffer, filename: 'max.jpg', type: 'image/jpeg' }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)

      const event = { mockEvent: true }
      const result = await handler(event)

      expect(mockHandleBlogApiError).not.toHaveBeenCalled()
      expect(result.success).toBe(true)
    })
  })

  describe('type parameter validation', () => {
    it('should reject invalid type values', async () => {
      const imageBuffer = Buffer.from('test-image-data')
      const formData = [
        { name: 'file', data: imageBuffer },
        { name: 'type', data: Buffer.from('../../../etc/passwd') }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)

      const event = { mockEvent: true }
      await handler(event)

      expect(mockHandleBlogApiError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid type'),
          statusCode: 400
        }),
        'upload-image'
      )
    })

    it('should only accept featured or content as type values', async () => {
      const invalidTypes = ['gallery', 'thumbnail', 'admin', '../../../']

      for (const invalidType of invalidTypes) {
        vi.clearAllMocks()

        const imageBuffer = Buffer.from('test-image-data')
        const formData = [
          { name: 'file', data: imageBuffer },
          { name: 'type', data: Buffer.from(invalidType) }
        ]

        mockReadMultipartFormData.mockResolvedValue(formData)

        const event = { mockEvent: true }
        await handler(event)

        expect(mockHandleBlogApiError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringMatching(/Invalid type.*Must be 'featured' or 'content'/),
            statusCode: 400
          }),
          'upload-image'
        )
      }
    })
  })

  describe('alt parameter extraction', () => {
    it('should extract alt text when provided', async () => {
      const imageBuffer = Buffer.from('test-image-data')
      const formData = [
        { name: 'file', data: imageBuffer },
        { name: 'alt', data: Buffer.from('Test image description') }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)

      const event = { mockEvent: true }
      const result = await handler(event)

      // Alt text is extracted but not returned in response (stored for WordPress sync)
      expect(result.success).toBe(true)
      expect(mockHandleBlogApiError).not.toHaveBeenCalled()
    })

    it('should handle missing alt parameter gracefully', async () => {
      const imageBuffer = Buffer.from('test-image-data')
      const formData = [
        { name: 'file', data: imageBuffer }
      ]

      mockReadMultipartFormData.mockResolvedValue(formData)

      const event = { mockEvent: true }
      const result = await handler(event)

      expect(result.success).toBe(true)
      expect(mockHandleBlogApiError).not.toHaveBeenCalled()
    })
  })
})
