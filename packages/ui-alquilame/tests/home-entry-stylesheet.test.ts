import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { rewriteHomeEntryStylesheets } from '../server/utils/home-entry-stylesheet'

const ENTRY_LINK = '<link rel="stylesheet" href="/_nuxt/entry.CT6BPCpu.css" crossorigin>'
const PAGE_LINK = '<link rel="stylesheet" href="/_nuxt/index.BxLaW0RJ.css" crossorigin>'

function renderedHead(pathname: string): string {
  return rewriteHomeEntryStylesheets(pathname, [
    '<meta charset="utf-8">',
    `${PAGE_LINK}${ENTRY_LINK}`,
  ]).join('')
}

describe('T6-G1 — home-only async entry stylesheet', () => {
  it('preloads and asynchronously applies the entry stylesheet on home', () => {
    const home = renderedHead('/')

    expect(home).toContain(
      '<link rel="preload" href="/_nuxt/entry.CT6BPCpu.css" crossorigin as="style" data-home-entry-css="preload">',
    )
    expect(home).toContain(
      '<link rel="stylesheet" href="/_nuxt/entry.CT6BPCpu.css" crossorigin media="print" onload="this.onload=null;this.media=\'all\'" data-home-entry-css="async">',
    )
    expect(home).toContain(
      '<noscript><link rel="stylesheet" href="/_nuxt/entry.CT6BPCpu.css" crossorigin data-home-entry-css="fallback"></noscript>',
    )
    expect(home).toContain(PAGE_LINK)
  })

  it.each(['/reservas', '/bogota', '/blog', '/terminos-condiciones'])(
    'keeps the entry stylesheet blocking on %s',
    (pathname) => {
      const routeHead = renderedHead(pathname)

      expect(routeHead).toContain(ENTRY_LINK)
      expect(routeHead).not.toContain('data-home-entry-css')
      expect(routeHead).not.toContain('rel="preload" href="/_nuxt/entry.')
    },
  )

  it('matches only the hashed Nuxt entry stylesheet and is idempotent', () => {
    const firstPass = rewriteHomeEntryStylesheets('/', [
      PAGE_LINK,
      '<link rel="stylesheet" href="https://cdn.example.com/_nuxt/entry.hash.css?v=1">',
      '<link rel="stylesheet" href="/_nuxt/entry.css">',
    ])
    const secondPass = rewriteHomeEntryStylesheets('/', firstPass)

    expect(firstPass.join('')).toContain('href="https://cdn.example.com/_nuxt/entry.hash.css?v=1"')
    expect(firstPass.join('')).toContain('<link rel="stylesheet" href="/_nuxt/entry.css">')
    expect(secondPass).toEqual(firstPass)
  })

  it('keeps the normal manifest link enabled for non-home routes', () => {
    const config = readFileSync(
      fileURLToPath(new URL('../nuxt.config.ts', import.meta.url)),
      'utf8',
    )
    const plugin = readFileSync(
      fileURLToPath(new URL('../server/plugins/home-entry-stylesheet.ts', import.meta.url)),
      'utf8',
    )

    expect(config).toMatch(/disableStylesheets:\s*false/)
    expect(plugin).toContain('getRequestURL(event).pathname')
    expect(plugin).toContain('rewriteHomeEntryStylesheets')
  })
})
