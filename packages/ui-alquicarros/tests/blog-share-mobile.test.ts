/**
 * SCEN-001, SCEN-002, SCEN-008 y SCEN-009 de docs/specs/blog-share-mobile.
 *
 * El compartir de móvil era una píldora `fixed bottom-4 left-1/2 z-40` y el
 * stack de contacto (`z-[60]`, una o dos filas según el horario de WhatsApp) le
 * caía encima: sus dos últimos botones no se podían tocar. La guarda vive por
 * marca porque el markup está triplicado; la lógica se prueba una sola vez en
 * packages/logic (useArticleShare.test.ts).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = readFileSync(
  join(__dirname, '..', 'app/pages/blog/[...slug].vue'),
  'utf-8',
)

describe('SCEN-001: nada de compartir flota sobre el artículo', () => {
  it('no queda ninguna capa fija de compartir', () => {
    expect(SRC).not.toContain('class="lg:hidden fixed bottom-4')
    expect(SRC).not.toContain('Mobile Share Buttons (Floating)')
  })
})

describe('SCEN-002: el compartir aparece donde se termina de leer', () => {
  it('el bloque va dentro del artículo, en el flujo de la página', () => {
    const article = SRC.slice(SRC.indexOf('<article ref="articleRef"'), SRC.indexOf('</article>'))
    expect(article).toContain('class="not-prose lg:hidden mt-12 border-t border-gray-200 pt-8"')
    expect(article).toContain('¿Te sirvió? Compártelo')
  })

  it('ofrece la hoja nativa cuando existe y los tres destinos cuando no', () => {
    expect(SRC).toContain('v-if="canNativeShare"')
    expect(SRC).toContain('@click="shareNative"')
    expect(SRC).toContain('<div v-else class="flex gap-3">')
    expect(SRC).toContain('@click="shareWhatsApp"')
    expect(SRC).toContain('@click="shareFacebook"')
    expect(SRC).toContain('@click="shareTwitter"')
    expect(SRC).toContain('@click="copyLink"')
  })

  it('los botones de respaldo llegan a los 44px de área táctil', () => {
    const fallback = SRC.slice(
      SRC.indexOf('<div v-else class="flex gap-3">'),
      SRC.indexOf('@click="copyLink"'),
    )
    expect(fallback).not.toContain('w-9 h-9')
    expect(fallback.match(/w-11 h-11/g)).toHaveLength(3)
  })
})

describe('SCEN-006: el enlace compartido es el canónico', () => {
  it('la página pasa la URL canónica al composable, no window.location', () => {
    expect(SRC).toContain('} = useArticleShare(() => ({')
    expect(SRC).toContain('url: `${franchise.website}/blog/${slug.value}`,')
    // Nada de compartir se reimplementa en la página: si `window.open` o el
    // portapapeles vuelven aquí, la URL canónica deja de ser el único origen.
    expect(SRC).not.toContain('function getShareUrl')
    expect(SRC).not.toContain('window.open(')
    expect(SRC).not.toContain('navigator.clipboard')
  })
})

describe('SCEN-008: el escritorio no se entera', () => {
  it('el bloque del sidebar sigue intacto y sigue siendo el único de escritorio', () => {
    expect(SRC).toContain('<!-- Share Buttons (Desktop) -->')
    expect(SRC).toMatch(/hidden lg:block[^"]*"\s*>\s*<h3[^>]*>Compartir<\/h3>/)
  })
})
