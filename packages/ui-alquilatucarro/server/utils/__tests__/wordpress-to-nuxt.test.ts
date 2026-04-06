import { describe, it, expect, vi } from 'vitest'
import { transformWordPressToNuxt } from '../wordpress-to-nuxt'
import type { WordPressPost } from '../wordpress-to-nuxt'

describe('wordpress-to-nuxt', () => {
  describe('stripHtml', () => {
    it('should strip HTML tags from title', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Requisitos para <strong>Alquilar</strong> un Carro' },
        content: { rendered: '<p>Content here</p>' },
        excerpt: { rendered: '<p>Excerpt here</p>' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'requisitos-alquilar-carro'
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('title: "Requisitos para Alquilar un Carro"')
    })

    it('should strip HTML and limit description to 160 chars', () => {
      const longText = 'a'.repeat(200)
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: `<p>${longText}</p>` },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test'
      }

      const result = transformWordPressToNuxt(wpPost)
      const descMatch = result.frontmatter.match(/description: "(.+)"/)

      expect(descMatch).toBeTruthy()
      expect(descMatch![1].length).toBeLessThanOrEqual(160)
    })
  })

  describe('HTML to Markdown conversion', () => {
    it('should convert HTML content to Markdown', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<h2>Heading</h2><p>Paragraph with <strong>bold</strong> text.</p>' },
        excerpt: { rendered: 'Test excerpt' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test'
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.body).toContain('## Heading')
      expect(result.body).toContain('**bold**')
    })
  })

  describe('Category mapping', () => {
    it('should map Guías to guias', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test',
        _embedded: {
          'wp:term': [
            [{ name: 'Guías' }]
          ]
        }
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('category: guias')
    })

    it('should map Rutas to rutas', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test',
        _embedded: {
          'wp:term': [
            [{ name: 'Rutas' }]
          ]
        }
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('category: rutas')
    })

    it('should default to guias when category not found', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test'
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('category: guias')
    })

    it('should default to guias for unmapped category', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test',
        _embedded: {
          'wp:term': [
            [{ name: 'Unknown Category' }]
          ]
        }
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('category: guias')
    })
  })

  describe('Tags extraction', () => {
    it('should extract tags from second term array', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test',
        _embedded: {
          'wp:term': [
            [{ name: 'Guías' }],
            [
              { name: 'requisitos' },
              { name: 'documentos' },
              { name: 'colombia' }
            ]
          ]
        }
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('tags:\n  - "requisitos"\n  - "documentos"\n  - "colombia"')
    })

    it('should use flat tags array when provided (nuxt-blog connector)', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test',
        tags: ['medellín', 'alquiler', 'automático']
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('tags:\n  - "medellín"\n  - "alquiler"\n  - "automático"')
    })

    it('should prefer flat tags over _embedded wp:term', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test',
        tags: ['flat-tag'],
        _embedded: {
          'wp:term': [
            [{ name: 'Guías' }],
            [{ name: 'embedded-tag' }]
          ]
        }
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('"flat-tag"')
      expect(result.frontmatter).not.toContain('embedded-tag')
    })

    it('should handle missing tags', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test'
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('tags: []')
    })
  })

  describe('Reading time calculation', () => {
    it('should calculate reading time based on word count', () => {
      // Create content with approximately 600 words (should be 3 min at 200 words/min)
      const words = new Array(600).fill('word').join(' ')
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: `<p>${words}</p>` },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test'
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('readingTime: 3')
    })

    it('should round up reading time', () => {
      // Create content with 250 words (should be 2 min at 200 words/min, rounded up)
      const words = new Array(250).fill('word').join(' ')
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: `<p>${words}</p>` },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test'
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('readingTime: 2')
    })
  })

  describe('Featured media', () => {
    it('should extract featured image and alt text', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test',
        _embedded: {
          'wp:featuredmedia': [
            {
              source_url: 'https://example.com/image.jpg',
              alt_text: 'Test image'
            }
          ]
        }
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('image: "https://example.com/image.jpg"')
      expect(result.frontmatter).toContain('alt: "Test image"')
    })

    it('should quote alt text containing colon-space to prevent YAML parsing corruption', () => {
      // Regression: "Renting de Carros en Colombia: Guía Completa 2023" as alt_text
      // caused YAML to interpret "Colombia:" as a mapping key, absorbing all
      // subsequent frontmatter fields (author, date, category...) into alt.
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Renting de Carros en Colombia: Guía Completa 2023' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'renting-colombia',
        _embedded: {
          'wp:featuredmedia': [
            {
              source_url: 'https://example.com/image.jpg',
              alt_text: 'Renting de Carros en Colombia: Guía Completa 2023'
            }
          ]
        }
      }

      const result = transformWordPressToNuxt(wpPost)

      // alt must be quoted so YAML parsers don't split on ": "
      expect(result.frontmatter).toContain('alt: "Renting de Carros en Colombia: Guía Completa 2023"')
      // All subsequent fields must still be present at top level (not absorbed into alt)
      expect(result.frontmatter).toContain('author:')
      expect(result.frontmatter).toContain('date: 2026-02-13T10:30:00')
      expect(result.frontmatter).toContain('category: guias')
    })

    it('should handle missing featured media', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test'
      }

      const result = transformWordPressToNuxt(wpPost)

      // Should not have image or alt in frontmatter
      expect(result.frontmatter).not.toContain('image:')
      expect(result.frontmatter).not.toContain('alt:')
    })
  })

  describe('metaTitle field', () => {
    it('should include metaTitle in frontmatter when provided', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test Post Title' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test',
        metaTitle: 'Alquiler Carros Colombia | Blog'
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('metaTitle: "Alquiler Carros Colombia | Blog"')
    })

    it('should omit metaTitle from frontmatter when not provided', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test Post Title' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test'
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).not.toContain('metaTitle:')
    })

    it('should escape special characters in metaTitle', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test',
        metaTitle: 'Alquiler "Carros" | Blog'
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('metaTitle: "Alquiler \\"Carros\\" | Blog"')
    })
  })

  describe('Complete transformation', () => {
    it('should transform complete WordPress post to Nuxt Content format', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Requisitos para Alquilar un Carro en Colombia 2026' },
        content: { rendered: '<p>¿Estás planeando un viaje por Colombia...</p>' },
        excerpt: { rendered: '<p>Guía completa con todos los documentos necesarios...</p>' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'requisitos-alquilar-carro',
        _embedded: {
          'wp:featuredmedia': [
            {
              source_url: 'https://firebasestorage.googleapis.com/.../imagen.webp',
              alt_text: 'Persona mostrando documentos para alquilar carro'
            }
          ],
          'wp:term': [
            [{ name: 'Guías' }],
            [
              { name: 'requisitos' },
              { name: 'documentos' },
              { name: 'colombia' }
            ]
          ]
        }
      }

      const result = transformWordPressToNuxt(wpPost)

      // Check slug
      expect(result.slug).toBe('requisitos-alquilar-carro')

      // Check frontmatter contains expected fields
      expect(result.frontmatter).toContain('title: "Requisitos para Alquilar un Carro en Colombia 2026"')
      expect(result.frontmatter).toContain('description:')
      expect(result.frontmatter).toContain('image:')
      expect(result.frontmatter).toContain('alt:')
      expect(result.frontmatter).toContain('author:')
      expect(result.frontmatter).toContain('name: Alquilatucarro')
      expect(result.frontmatter).toContain('date: 2026-02-13T10:30:00')
      expect(result.frontmatter).toContain('updated: 2026-02-13T12:00:00')
      expect(result.frontmatter).toContain('category: guias')
      expect(result.frontmatter).toContain('tags:')
      expect(result.frontmatter).toContain('readingTime:')
      expect(result.frontmatter).toContain('featured: false')

      // Check body
      expect(result.body).toContain('¿Estás planeando un viaje por Colombia')
    })
  })

  describe('Error handling', () => {
    it('should handle malformed HTML gracefully', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: '<div><span>Unclosed tags' },
        content: { rendered: '<p>Unclosed paragraph' },
        excerpt: { rendered: '<p>Unclosed excerpt' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test'
      }

      // Should not throw
      expect(() => transformWordPressToNuxt(wpPost)).not.toThrow()
    })
  })

  describe('YAML escaping', () => {
    it('should escape quotes in title and description', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Alquilar un "carro" en Colombia' },
        content: { rendered: '<p>Test content</p>' },
        excerpt: { rendered: 'Description with "quotes"' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test'
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('title: "Alquilar un \\"carro\\" en Colombia"')
      expect(result.frontmatter).toContain('description: "Description with \\"quotes\\""')
    })

    it('should escape multiple quotes in title', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'The "best" car to "rent" in Colombia' },
        content: { rendered: '<p>Test content</p>' },
        excerpt: { rendered: 'Simple description' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test'
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('title: "The \\"best\\" car to \\"rent\\" in Colombia"')
    })

    it('should handle complex special characters combinations', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Cars & "SUVs" - Rental Guide' },
        content: { rendered: '<p>Test content</p>' },
        excerpt: { rendered: 'Affordable "luxury" cars' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test'
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('title: "Cars & \\"SUVs\\" - Rental Guide"')
      expect(result.frontmatter).toContain('description: "Affordable \\"luxury\\" cars"')
    })

    it('should escape special characters in tags', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test',
        _embedded: {
          'wp:term': [
            [{ name: 'Guías' }],
            [
              { name: 'colombia: guía' },
              { name: 'tag with "quotes"' },
              { name: 'backslash\\test' }
            ]
          ]
        }
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('- "colombia: guía"')
      expect(result.frontmatter).toContain('- "tag with \\"quotes\\""')
      expect(result.frontmatter).toContain('- "backslash\\\\test"')
    })

    it('should quote all tags even without special characters', () => {
      const wpPost: WordPressPost = {
        id: 1,
        title: { rendered: 'Test' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: 'Test' },
        date: '2026-02-13T10:30:00',
        modified: '2026-02-13T12:00:00',
        slug: 'test',
        _embedded: {
          'wp:term': [
            [{ name: 'Guías' }],
            [
              { name: 'colombia' },
              { name: 'viajes' }
            ]
          ]
        }
      }

      const result = transformWordPressToNuxt(wpPost)

      expect(result.frontmatter).toContain('- "colombia"')
      expect(result.frontmatter).toContain('- "viajes"')
    })
  })
})
