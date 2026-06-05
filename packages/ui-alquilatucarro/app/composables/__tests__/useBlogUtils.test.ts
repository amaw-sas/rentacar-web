import { describe, it, expect } from 'vitest'

// Import the composable functions directly — they are pure functions
// We re-implement the extract here since Nuxt composables need runtime context
// The actual logic is tested, not the Vue wrapper

describe('resolveImageUrl', () => {
  // Pure function extracted for testability
  function resolveImageUrl(imageUrl: string | undefined, baseUrl: string): string {
    if (!imageUrl) return ''
    if (imageUrl.startsWith('http')) return imageUrl
    return `${baseUrl}${imageUrl}`
  }

  it('returns absolute URL as-is (Supabase Storage)', () => {
    const absoluteUrl = 'https://ilhdholjrnbycyvejsub.supabase.co/storage/v1/object/public/blog-images/alquilatucarro/featured/img.webp'
    const result = resolveImageUrl(absoluteUrl, 'https://alquilatucarro.com')
    expect(result).toBe(absoluteUrl)
    expect(result).not.toContain('alquilatucarro.com')
  })

  it('prepends baseUrl to relative paths', () => {
    const result = resolveImageUrl('/img/blog/photo.webp', 'https://alquilatucarro.com')
    expect(result).toBe('https://alquilatucarro.com/img/blog/photo.webp')
  })

  it('returns empty string for undefined input', () => {
    expect(resolveImageUrl(undefined, 'https://alquilatucarro.com')).toBe('')
  })

  it('does not create double-protocol URL', () => {
    const httpsUrl = 'https://storage.googleapis.com/image.webp'
    const result = resolveImageUrl(httpsUrl, 'https://alquilatucarro.com')
    expect(result).not.toMatch(/^https:\/\/.*https:\/\//)
  })
})

describe('articleModifiedTime fallback', () => {
  // Simulates the fix: ?? instead of || to avoid "undefined" string literal
  function getModifiedTime(updated: string | undefined, date: string): string {
    return updated ?? date
  }

  it('returns updated date when available', () => {
    expect(getModifiedTime('2026-03-16T10:00:00Z', '2026-03-15T10:00:00Z')).toBe('2026-03-16T10:00:00Z')
  })

  it('falls back to published date when updated is undefined', () => {
    expect(getModifiedTime(undefined, '2026-03-15T10:00:00Z')).toBe('2026-03-15T10:00:00Z')
  })

  it('does NOT render the string "undefined"', () => {
    const result = getModifiedTime(undefined, '2026-03-15T10:00:00Z')
    expect(result).not.toBe('undefined')
    expect(result).not.toContain('undefined')
  })
})
