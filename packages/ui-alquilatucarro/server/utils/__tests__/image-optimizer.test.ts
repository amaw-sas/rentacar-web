import { describe, it, expect, vi, beforeEach } from 'vitest'
import { optimizeImage } from '../image-optimizer'
import type { ImageType } from '../image-optimizer'

// Mock Sharp
vi.mock('sharp', () => {
  const mockToBuffer = vi.fn()
  const mockWebp = vi.fn(() => ({ toBuffer: mockToBuffer }))
  const mockResize = vi.fn(() => ({ webp: mockWebp }))
  const mockSharp = vi.fn(() => ({ resize: mockResize }))

  return {
    default: mockSharp,
    __mockToBuffer: mockToBuffer,
    __mockWebp: mockWebp,
    __mockResize: mockResize,
    __mockSharp: mockSharp
  }
})

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    metric: vi.fn(),
    error: vi.fn()
  }
}))

// Get mock references
const sharp = await import('sharp')
const mockSharp = (sharp as any).__mockSharp
const mockResize = (sharp as any).__mockResize
const mockWebp = (sharp as any).__mockWebp
const mockToBuffer = (sharp as any).__mockToBuffer

describe('image-optimizer', () => {
  const mockInputBuffer = Buffer.from('fake-image-data')
  const mockOutputBuffer = Buffer.from('fake-webp-data')

  beforeEach(() => {
    vi.clearAllMocks()
    mockToBuffer.mockResolvedValue(mockOutputBuffer)
  })

  describe('optimizeImage', () => {
    it('should optimize featured image with correct config', async () => {
      const result = await optimizeImage(mockInputBuffer, 'featured')

      expect(mockSharp).toHaveBeenCalledWith(mockInputBuffer)
      expect(mockResize).toHaveBeenCalledWith({
        width: 1920,
        height: 1080,
        fit: 'cover'
      })
      expect(mockWebp).toHaveBeenCalledWith({
        quality: 85,
        effort: 4
      })
      expect(result.buffer).toBe(mockOutputBuffer)
    })

    it('should optimize content image with correct config', async () => {
      const result = await optimizeImage(mockInputBuffer, 'content')

      expect(mockSharp).toHaveBeenCalledWith(mockInputBuffer)
      expect(mockResize).toHaveBeenCalledWith({
        width: 1200,
        fit: 'inside'
      })
      expect(mockWebp).toHaveBeenCalledWith({
        quality: 80,
        effort: 4
      })
      expect(result.buffer).toBe(mockOutputBuffer)
    })

    it('should default to content type if not specified', async () => {
      const result = await optimizeImage(mockInputBuffer)

      expect(mockResize).toHaveBeenCalledWith({
        width: 1200,
        fit: 'inside'
      })
      expect(mockWebp).toHaveBeenCalledWith({
        quality: 80,
        effort: 4
      })
      expect(result.buffer).toBe(mockOutputBuffer)
    })

    it('should return size metrics', async () => {
      const largeInputBuffer = Buffer.alloc(1000000) // 1MB
      const smallOutputBuffer = Buffer.alloc(100000) // 100KB
      mockToBuffer.mockResolvedValueOnce(smallOutputBuffer)

      const result = await optimizeImage(largeInputBuffer, 'content')

      expect(result.originalSize).toBe(1000000)
      expect(result.optimizedSize).toBe(100000)
      expect(result.savings).toBe('90.0%')
    })

    it('should throw error for empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0)

      await expect(
        optimizeImage(emptyBuffer, 'content')
      ).rejects.toThrow('Input buffer cannot be empty')
    })

    it('should throw BlogApiError on Sharp failure', async () => {
      mockToBuffer.mockRejectedValueOnce(new Error('Invalid image format'))

      await expect(
        optimizeImage(mockInputBuffer, 'content')
      ).rejects.toThrow('Failed to optimize image')
    })
  })
})
