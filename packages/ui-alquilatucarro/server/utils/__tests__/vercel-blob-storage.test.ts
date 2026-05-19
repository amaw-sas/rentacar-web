import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @vercel/blob
const mockPut = vi.fn()
const mockGet = vi.fn()
const mockDel = vi.fn()
const mockList = vi.fn()

vi.mock('@vercel/blob', () => ({
  put: (...args: any[]) => mockPut(...args),
  get: (...args: any[]) => mockGet(...args),
  del: (...args: any[]) => mockDel(...args),
  list: (...args: any[]) => mockList(...args),
}))

describe('Vercel Blob storage (blob-storage.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('uploadToStorage', () => {
    it('uploads buffer and returns public URL', async () => {
      mockPut.mockResolvedValue({
        url: 'https://xxx.public.blob.vercel-storage.com/blog-images/featured/test.webp',
        pathname: 'blog-images/featured/test.webp',
      })

      const { uploadToStorage } = await import('../blob-storage')
      const buffer = Buffer.from('test image data')
      const result = await uploadToStorage(buffer, 'blog-images/featured/test.webp', 'image/webp')

      expect(result).toBe('https://xxx.public.blob.vercel-storage.com/blog-images/featured/test.webp')
      expect(mockPut).toHaveBeenCalledWith('blog-images/featured/test.webp', buffer, {
        access: 'public',
        contentType: 'image/webp',
        allowOverwrite: true,
      })
    })

    it('forwards cacheControlMaxAge to put when provided (SCEN-001)', async () => {
      mockPut.mockResolvedValue({
        url: 'https://xxx.public.blob.vercel-storage.com/blog-images/featured/test.webp',
        pathname: 'blog-images/featured/test.webp',
      })

      const { uploadToStorage } = await import('../blob-storage')
      const buffer = Buffer.from('test image data')
      await uploadToStorage(buffer, 'blog-images/featured/test.webp', 'image/webp', 31536000)

      const options = mockPut.mock.calls[0][2]
      expect(options).toMatchObject({ cacheControlMaxAge: 31536000 })
    })

    it('omits cacheControlMaxAge key when not provided (SCEN-002)', async () => {
      mockPut.mockResolvedValue({
        url: 'https://xxx.public.blob.vercel-storage.com/blog-posts/brand/test.md',
        pathname: 'blog-posts/brand/test.md',
      })

      const { uploadToStorage } = await import('../blob-storage')
      const buffer = Buffer.from('# markdown')
      await uploadToStorage(buffer, 'blog-posts/brand/test.md', 'text/markdown')

      const options = mockPut.mock.calls[0][2]
      expect(Object.prototype.hasOwnProperty.call(options, 'cacheControlMaxAge')).toBe(false)
    })
  })

  describe('downloadFromStorage', () => {
    it('downloads blob as Buffer', async () => {
      const testData = new TextEncoder().encode('# Test markdown')
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(testData)
          controller.close()
        },
      })
      mockGet.mockResolvedValue({ stream, blob: { pathname: 'test.md' } })

      const { downloadFromStorage } = await import('../blob-storage')
      const result = await downloadFromStorage('blog-posts/brand/test.md')

      expect(result.toString('utf-8')).toBe('# Test markdown')
      expect(mockGet).toHaveBeenCalledWith('blog-posts/brand/test.md', { access: 'public' })
    })

    it('throws when blob not found', async () => {
      mockGet.mockResolvedValue(null)

      const { downloadFromStorage } = await import('../blob-storage')
      await expect(downloadFromStorage('nonexistent.md')).rejects.toThrow('Blob not found')
    })
  })

  describe('deleteFromStorage', () => {
    it('deletes by path or URL', async () => {
      mockDel.mockResolvedValue(undefined)

      const { deleteFromStorage } = await import('../blob-storage')
      await deleteFromStorage('blog-posts/brand/test.md')

      expect(mockDel).toHaveBeenCalledWith('blog-posts/brand/test.md')
    })
  })

  describe('listFilesInStorage', () => {
    it('lists files by prefix', async () => {
      mockList.mockResolvedValue({
        blobs: [
          { pathname: 'blog-posts/brand/post-1.md' },
          { pathname: 'blog-posts/brand/post-2.md' },
        ],
        hasMore: false,
      })

      const { listFilesInStorage } = await import('../blob-storage')
      const result = await listFilesInStorage('blog-posts/brand/')

      expect(result).toEqual(['blog-posts/brand/post-1.md', 'blog-posts/brand/post-2.md'])
      expect(mockList).toHaveBeenCalledWith({ prefix: 'blog-posts/brand/', cursor: undefined })
    })

    it('handles pagination', async () => {
      mockList
        .mockResolvedValueOnce({
          blobs: [{ pathname: 'blog-posts/brand/post-1.md' }],
          hasMore: true,
          cursor: 'cursor-1',
        })
        .mockResolvedValueOnce({
          blobs: [{ pathname: 'blog-posts/brand/post-2.md' }],
          hasMore: false,
        })

      const { listFilesInStorage } = await import('../blob-storage')
      const result = await listFilesInStorage('blog-posts/brand/')

      expect(result).toEqual(['blog-posts/brand/post-1.md', 'blog-posts/brand/post-2.md'])
      expect(mockList).toHaveBeenCalledTimes(2)
    })

    it('returns empty array when no blobs', async () => {
      mockList.mockResolvedValue({ blobs: [], hasMore: false })

      const { listFilesInStorage } = await import('../blob-storage')
      const result = await listFilesInStorage('blog-posts/brand/')

      expect(result).toEqual([])
    })
  })
})
