import { describe, it, expect } from 'vitest'
import { transformBlogPost, transformBlogList, type SupabaseBlogPost } from '../blogTransformers'

const validRow: SupabaseBlogPost = {
  slug: 'requisitos-alquilar-carro-colombia',
  title: 'Requisitos para alquilar carro en Colombia',
  description: 'Todo lo que necesitas para alquilar.',
  image: '/img/blog/requisitos-alquiler.webp',
  alt: 'Requisitos de alquiler',
  author_name: 'Alquilatucarro',
  author_avatar: '/img/blog/author-avatar.webp',
  date: '2026-02-11',
  updated: null,
  category: 'guias',
  tags: ['requisitos', 'documentos'],
  reading_time: 7,
  featured: true,
  faq_items: [{ question: '¿Edad mínima?', answer: '21 años.' }],
  meta_title: 'Requisitos alquiler carro Colombia',
}

describe('transformBlogPost', () => {
  it('SCEN-009: maps flat snake_case row to nested camelCase BlogPost shape', () => {
    const post = transformBlogPost(validRow)

    // nested author (template reads author.name / author.avatar)
    expect(post.author).toEqual({ name: 'Alquilatucarro', avatar: '/img/blog/author-avatar.webp' })
    // camelCase reading time (template reads related.readingTime)
    expect(post.readingTime).toBe(7)
    // camelCase faqItems
    expect(post.faqItems).toEqual([{ question: '¿Edad mínima?', answer: '21 años.' }])
    // slug carried through (replaces @nuxt/content .path)
    expect(post.slug).toBe('requisitos-alquilar-carro-colombia')
    // metaTitle camelCase
    expect(post.metaTitle).toBe('Requisitos alquiler carro Colombia')
    // no Firebase, no @nuxt/content internal fields
    expect(post.author.avatar).not.toContain('firebasestorage')
    expect((post as Record<string, unknown>)._path).toBeUndefined()
  })

  it('SCEN-009: nullable optionals collapse to undefined', () => {
    const post = transformBlogPost({ ...validRow, updated: null, featured: null, faq_items: null, meta_title: null })
    expect(post.updated).toBeUndefined()
    expect(post.featured).toBeUndefined()
    expect(post.faqItems).toBeUndefined()
    expect(post.metaTitle).toBeUndefined()
  })

  it('SCEN-009: fails loud on a malformed row (missing required field)', () => {
    const { title: _omit, ...missingTitle } = validRow
    expect(() => transformBlogPost(missingTitle as SupabaseBlogPost)).toThrow()
  })

  it('SCEN-009: fails loud on an out-of-range category', () => {
    expect(() => transformBlogPost({ ...validRow, category: 'noticias' })).toThrow()
  })
})

describe('transformBlogList', () => {
  it('returns valid posts and drops malformed ones (listing must not crash)', () => {
    const list = transformBlogList([validRow, { ...validRow, slug: '' }, { ...validRow, slug: 'segundo' }])
    expect(list.map((p) => p.slug)).toEqual(['requisitos-alquilar-carro-colombia', 'segundo'])
  })

  it('returns an empty array for no rows', () => {
    expect(transformBlogList([])).toEqual([])
  })
})
