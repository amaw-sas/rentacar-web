/**
 * SCEN-002 y SCEN-003 de docs/specs/blog-breadcrumb-overflow.
 *
 * La miga de pan del detalle recortaba el título en 320px fijos (`max-w-xs`)
 * dentro de una fila flex que no podía encogerse: 459px de documento en un
 * viewport de 412, y la página se arrastraba de lado. El recorte pasa a ser
 * «lo que sobre». Sólo alquilatucarro tiene miga de pan en el blog.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = readFileSync(
  join(__dirname, '..', 'app/pages/blog/[...slug].vue'),
  'utf-8',
)

const breadcrumb = SRC.slice(
  SRC.indexOf('<nav aria-label="Breadcrumb"'),
  SRC.indexOf('</nav>', SRC.indexOf('<nav aria-label="Breadcrumb"')),
)

describe('SCEN-003: el recorte se adapta al ancho disponible', () => {
  it('el título ya no lleva un tope fijo de 320px', () => {
    const titleSpan = breadcrumb.match(/<span[^>]*>\{\{ post\.title \}\}/)
    expect(titleSpan, 'title span not found in the breadcrumb').not.toBeNull()
    expect(titleSpan![0]).not.toMatch(/max-w-/)
  })

  it('el tramo del título puede encogerse — un flex item nace con min-width auto', () => {
    const titleItem = breadcrumb.slice(breadcrumb.lastIndexOf('<li'))
    expect(titleItem).toMatch(/class="[^"]*\bmin-w-0\b/)
    expect(titleItem).toMatch(/class="[^"]*\btruncate\b/)
  })

  it('el separador no se encoge con el título', () => {
    const titleItem = breadcrumb.slice(breadcrumb.lastIndexOf('<li'))
    const icon = titleItem.slice(titleItem.indexOf('<UIcon'))
    expect(icon).toMatch(/class="[^"]*\bshrink-0\b/)
  })
})

describe('SCEN-002/005: la miga sigue completa y navegable', () => {
  it('conserva los tres tramos y sus destinos', () => {
    expect(breadcrumb).toContain('to="/"')
    expect(breadcrumb).toContain('to="/blog"')
    expect(breadcrumb).toContain('Inicio')
    expect(breadcrumb).toContain('Blog')
    expect((breadcrumb.match(/<li/g) ?? []).length).toBe(3)
  })
})
