/**
 * Correcciones de metadatos on-page detectadas en la auditoría SEO de Alquilame
 * (docs/seo/alquilame/auditoria-onpage-2026-07-24.md).
 *
 *   - SCEN-SEO-01: la home declara `og:image` UNA sola vez. Declarar `ogImage` y
 *     `ogImageUrl` a la vez hace que nuxt-seo emita dos <meta property="og:image">
 *     con el mismo valor; el crawl del 2026-07-24 lo confirmó en el HTML SSR.
 *   - SCEN-SEO-02: la imagen social del blog es rasterizada, no el logo SVG.
 *     Facebook, WhatsApp, LinkedIn y X no renderizan SVG en og:image, así que
 *     compartir /blog salía sin imagen.
 *   - SCEN-SEO-03: el H1 del blog escribe la marca como nombre propio. Con
 *     `franchise.shortname` salía "Blog de alquilame", en minúscula.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..') // → packages/ui-alquilame
const home = readFileSync(join(ROOT, 'app/pages/index.vue'), 'utf-8')
const blog = readFileSync(join(ROOT, 'app/pages/blog/index.vue'), 'utf-8')

describe('metadatos on-page', () => {
  it('SCEN-SEO-01: la home no declara ogImage y ogImageUrl a la vez', () => {
    expect(home).toMatch(/\bogImage:/)
    expect(home).not.toMatch(/\bogImageUrl:/)
  })

  it('SCEN-SEO-02: el blog comparte una imagen rasterizada, no el logo SVG', () => {
    const ogImage = blog.match(/\bogImage:\s*([^\n,]+)/)?.[1]?.trim()
    expect(ogImage).toBeDefined()
    expect(ogImage).not.toMatch(/franchise\.(logo|svglogo)/)
    expect(ogImage).toMatch(/franchise\.ogImage/)
    // twitterCard es summary_large_image: sin twitterImage la tarjeta va vacía.
    expect(blog).toMatch(/twitterImage:\s*franchise\.ogImage/)
  })

  it('SCEN-SEO-03: el H1 del blog usa la marca con mayúscula', () => {
    const h1 = blog.match(/<h1[\s\S]*?<\/h1>/)?.[0] ?? ''
    expect(h1).not.toMatch(/franchise\.shortname/)
    expect(h1).toMatch(/organization\.brand/)
  })
})
