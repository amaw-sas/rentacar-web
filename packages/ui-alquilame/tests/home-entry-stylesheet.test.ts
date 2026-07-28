import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { rewriteHomeEntryStylesheets } from '../server/utils/home-entry-stylesheet'

const ENTRY_LINK = '<link rel="stylesheet" href="/_nuxt/entry.CT6BPCpu.css" crossorigin>'
const PAGE_LINK = '<link rel="stylesheet" href="/_nuxt/index.BxLaW0RJ.css" crossorigin>'
const MODULE_PRELOAD = '<link rel="modulepreload" href="/_nuxt/entry.DgYvKr4x.js" crossorigin>'

function renderedHead(pathname: string): string {
  return rewriteHomeEntryStylesheets(pathname, [
    '<meta charset="utf-8">',
    `${PAGE_LINK}${ENTRY_LINK}${MODULE_PRELOAD}`,
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
    expect(home).toContain(MODULE_PRELOAD)
  })

  it.each(['/reservas', '/bogota', '/blog', '/terminos-condiciones'])(
    'removes the entry stylesheet on %s',
    (pathname) => {
      const routeHead = renderedHead(pathname)

      expect(routeHead).not.toContain(ENTRY_LINK)
      expect(routeHead).not.toContain('href="/_nuxt/entry.CT6BPCpu.css"')
      expect(routeHead).toContain(PAGE_LINK)
      expect(routeHead).toContain(MODULE_PRELOAD)
      expect(routeHead).not.toContain('data-home-entry-css')
      expect(routeHead).not.toContain('rel="preload" href="/_nuxt/entry.')
    },
  )

  it('transforms only same-origin hashed Nuxt entry stylesheets and is idempotent', () => {
    const cdnLink = '<link rel="stylesheet" href="https://cdn.example.com/_nuxt/entry.hash.css?v=1">'
    const unhashedLink = '<link rel="stylesheet" href="/_nuxt/entry.css">'
    const modulePreload = '<link rel="modulepreload" href="/_nuxt/entry.hash.css">'
    const firstPass = rewriteHomeEntryStylesheets('/', [
      PAGE_LINK,
      cdnLink,
      unhashedLink,
      modulePreload,
      ENTRY_LINK,
    ])
    const secondPass = rewriteHomeEntryStylesheets('/', firstPass)

    expect(firstPass[1]).toBe(cdnLink)
    expect(firstPass[2]).toBe(unhashedLink)
    expect(firstPass[3]).toBe(modulePreload)
    expect(firstPass[4]).toContain('data-home-entry-css="async"')
    expect(secondPass).toEqual(firstPass)
  })

  it('delegates stylesheet handling to the route-aware Nitro renderer', () => {
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
