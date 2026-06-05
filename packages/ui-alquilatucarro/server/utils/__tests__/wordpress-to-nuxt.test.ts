import { describe, it, expect } from 'vitest'
import { transformWordPressToNuxt, type WordPressPost } from '../wordpress-to-nuxt'

function wp(overrides: Partial<WordPressPost> = {}): WordPressPost {
  return {
    id: 1,
    title: { rendered: 'Test Title' },
    content: { rendered: '<p>Body content.</p>' },
    excerpt: { rendered: '<p>Excerpt</p>' },
    date: '2026-02-13T10:30:00',
    modified: '2026-02-13T12:00:00',
    slug: 'test-slug',
    ...overrides,
  }
}

describe('transformWordPressToNuxt (structured output for Supabase)', () => {
  it('strips HTML from the title', () => {
    const r = transformWordPressToNuxt(wp({ title: { rendered: 'Requisitos para <strong>Alquilar</strong> un Carro' } }))
    expect(r.title).toBe('Requisitos para Alquilar un Carro')
  })

  it('strips HTML and limits description to 160 chars', () => {
    const r = transformWordPressToNuxt(wp({ excerpt: { rendered: `<p>${'a'.repeat(200)}</p>` } }))
    expect(r.description.length).toBeLessThanOrEqual(160)
    expect(r.description).not.toContain('<p>')
  })

  it('converts content HTML to a markdown body', () => {
    const r = transformWordPressToNuxt(wp({ content: { rendered: '<h2>Sección</h2><p>Texto</p>' } }))
    expect(r.body).toContain('## Sección')
    expect(r.body).toContain('Texto')
  })

  it('maps the WordPress category to the Nuxt slug, defaulting to guias', () => {
    expect(transformWordPressToNuxt(wp({ _embedded: { 'wp:term': [[{ name: 'Rutas' }]] } })).category).toBe('rutas')
    expect(transformWordPressToNuxt(wp({ _embedded: { 'wp:term': [[{ name: 'Destinos' }]] } })).category).toBe('destinos')
    expect(transformWordPressToNuxt(wp({ _embedded: { 'wp:term': [[{ name: 'Tips' }]] } })).category).toBe('tips')
    expect(transformWordPressToNuxt(wp()).category).toBe('guias')
    expect(transformWordPressToNuxt(wp({ _embedded: { 'wp:term': [[{ name: 'Unknown' }]] } })).category).toBe('guias')
  })

  it('prefers the flat tags array, falling back to _embedded terms', () => {
    expect(transformWordPressToNuxt(wp({ tags: ['a', 'b'] })).tags).toEqual(['a', 'b'])
    const embedded = transformWordPressToNuxt(wp({ _embedded: { 'wp:term': [[{ name: 'Guías' }], [{ name: 'x' }, { name: 'y' }]] } }))
    expect(embedded.tags).toEqual(['x', 'y'])
    expect(transformWordPressToNuxt(wp()).tags).toEqual([])
  })

  it('computes reading time from word count (200 wpm, ceil)', () => {
    expect(transformWordPressToNuxt(wp({ content: { rendered: `<p>${'palabra '.repeat(250)}</p>` } })).readingTime).toBe(2)
    expect(transformWordPressToNuxt(wp({ content: { rendered: '<p>una dos tres</p>' } })).readingTime).toBe(1)
  })

  it('extracts featured image + alt, or null when absent', () => {
    const withImg = transformWordPressToNuxt(wp({ _embedded: { 'wp:featuredmedia': [{ source_url: 'https://x/y.jpg', alt_text: 'alt' }] } }))
    expect(withImg.image).toBe('https://x/y.jpg')
    expect(withImg.alt).toBe('alt')
    const noImg = transformWordPressToNuxt(wp())
    expect(noImg.image).toBeNull()
    expect(noImg.alt).toBeNull()
  })

  it('passes through metaTitle and faqItems', () => {
    const r = transformWordPressToNuxt(wp({ metaTitle: 'Meta', faqItems: [{ question: 'q', answer: 'a' }] }))
    expect(r.metaTitle).toBe('Meta')
    expect(r.faqItems).toEqual([{ question: 'q', answer: 'a' }])
  })

  it('carries slug and dates through', () => {
    const r = transformWordPressToNuxt(wp())
    expect(r.slug).toBe('test-slug')
    expect(r.date).toBe('2026-02-13T10:30:00')
    expect(r.updated).toBe('2026-02-13T12:00:00')
  })

  it('produces no Firebase/GCS author URL (author is set by the endpoint)', () => {
    const r = transformWordPressToNuxt(wp())
    expect(JSON.stringify(r)).not.toContain('firebasestorage')
    expect(JSON.stringify(r)).not.toContain('storage.googleapis.com')
  })
})
