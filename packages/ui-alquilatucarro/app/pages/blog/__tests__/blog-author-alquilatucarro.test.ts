import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Guards the alquilatucarro byline (issue #440, second brand).
 *
 * The structure ships before the facts do: the owner named Elisa Arcos but has
 * not yet supplied her job title or anything true about her experience. These
 * tests exist so the placeholder CANNOT reach production — SCEN-A1 fails on
 * purpose until real data replaces the markers.
 *
 * Reading the files as text (instead of mounting) is deliberate: mount-based
 * suites cannot run in this checkout (jsdom pulls html-encoding-sniffer@6,
 * which require()s an ESM module and dies with ERR_REQUIRE_ESM), so a mounted
 * assertion here would silently report "no tests" and guard nothing.
 */

const BLOG_DIR = resolve(__dirname, '..')
const authorData = readFileSync(resolve(BLOG_DIR, 'autores/elisa-arcos.author.ts'), 'utf-8')
const authorPage = readFileSync(resolve(BLOG_DIR, 'autores/elisa-arcos.vue'), 'utf-8')
const postPage = readFileSync(resolve(BLOG_DIR, '[...slug].vue'), 'utf-8')
const nuxtConfig = readFileSync(resolve(BLOG_DIR, '../../../nuxt.config.ts'), 'utf-8')

const PLACEHOLDER = 'PENDIENTE_DATOS_REALES'

describe('SCEN-A1: el marcador impide publicar una biografía inventada', () => {
  it('falla mientras el cargo o la biografía sigan siendo marcador', () => {
    expect(
      authorData.includes(PLACEHOLDER),
      `La página de autor de Elisa Arcos todavía tiene ${PLACEHOLDER}. ` +
        'Reemplázalo con el cargo y la biografía reales antes de fusionar: ' +
        'una biografía inventada para una persona con nombre es peor que firmar como empresa.',
    ).toBe(false)
  })
})

describe('SCEN-A2: el autor es una persona real, no la marca', () => {
  it('declara Person con un nombre de persona', () => {
    expect(postPage).toContain("'@type': 'Person'")
    expect(postPage).toContain("name: 'Elisa Arcos'")
  })

  it('no declara Person con el nombre de la franquicia', () => {
    const personBlock = postPage.slice(postPage.indexOf("author: {"), postPage.indexOf('publisher:'))
    expect(personBlock).not.toContain('franchise.shortname')
  })
})

describe('SCEN-A3: la firma lleva a algún lado', () => {
  // La ruta vive en el módulo de datos y el artículo la consume como
  // `blogAuthor.path`, así que la cadena literal NO aparece en `[...slug].vue`.
  // Se comprueban las dos mitades por separado, no la cadena en el archivo
  // equivocado: el invariante sigue siendo "author.url lleva a la página".
  it('la ruta declarada es la de la página de autor', () => {
    expect(authorData).toContain("path: '/blog/autores/elisa-arcos'")
  })

  it('author.url se construye desde esa ruta', () => {
    expect(postPage).toContain('const authorUrl = `${franchise.website}${blogAuthor.path}`')
    expect(postPage).toContain('url: authorUrl')
  })

  it('el artículo enlaza la página con NuxtLink, no solo en el JSON-LD', () => {
    const template = postPage.slice(0, postPage.indexOf('<script'))
    expect(template).toContain('blogAuthor.path')
  })

  it('la página de autor está declarada en el sitemap', () => {
    expect(nuxtConfig).toContain("{ loc: '/blog/autores/elisa-arcos' }")
  })
})

describe('SCEN-A4: sin foto no se rompe nada', () => {
  it('la imagen de la página de autor está condicionada', () => {
    expect(authorPage).toContain('v-if="authorPhoto"')
  })

  it('el artículo omite `image` del schema cuando no hay foto', () => {
    expect(postPage).toContain('authorImageUrl ?')
  })
})

describe('SCEN-A5: el cargo va en su propio campo', () => {
  it('jobTitle es una propiedad aparte, no parte del nombre', () => {
    expect(postPage).toContain('jobTitle:')
    expect(postPage).not.toMatch(/name: 'Elisa Arcos[^']/)
  })
})
