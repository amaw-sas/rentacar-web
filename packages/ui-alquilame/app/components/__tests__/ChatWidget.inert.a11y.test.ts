import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ChatWidget.vue', import.meta.url)),
  'utf8',
)

// SCEN-322-X05 (issue #322): with the inline chat panel open, the page behind
// the backdrop must not be reachable (tab or AT). The overlay is teleported to
// <body> so the app root (#__nuxt) can be marked inert without inerting the
// chat itself; unmount cleanup prevents an orphaned inert.
describe('SCEN-322-X05 — background is inert while the chat panel is open', () => {
  it('teleports the overlay out of the app root', () => {
    expect(source).toMatch(/<Teleport to="body">/)
    expect(source).toMatch(/<\/Teleport>/)
  })

  it('sets/removes inert on #__nuxt driven by panelOpen', () => {
    expect(source).toMatch(/getElementById\('__nuxt'\)/)
    expect(source).toMatch(/setAttribute\('inert', ''\)/)
    expect(source).toMatch(/removeAttribute\('inert'\)/)
    expect(source).toMatch(/watch\(panelOpen, \(open\) => setBackgroundInert\(open\)\)/)
  })

  it('cleans up on unmount so no orphaned inert survives the widget', () => {
    expect(source).toMatch(/onBeforeUnmount\(\(\) => setBackgroundInert\(false\)\)/)
  })

  it('is SSR-safe (document guarded)', () => {
    expect(source).toMatch(/typeof document === 'undefined'/)
  })
})
