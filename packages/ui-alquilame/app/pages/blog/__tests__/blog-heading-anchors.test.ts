import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Blog prose headings must NOT be self-referencing anchor links.
 *
 * @nuxtjs/mdc wraps every heading in <a href="#slug"> by default; that link
 * (a) does nothing useful — it scrolls to itself — and (b) paints the heading
 * with the primary link color, so titles and real body links compete in the
 * same red. `mdc.headings.anchorLinks: false` disables the wrapper while the
 * heading keeps its `id`, so the table of contents still deep-links.
 */
describe('blog headings are not self-links', () => {
  const cfg = readFileSync(
    fileURLToPath(new URL('../../../../nuxt.config.ts', import.meta.url)),
    'utf8',
  )

  it('disables MDC heading anchor links in nuxt.config', () => {
    expect(cfg).toMatch(/mdc:\s*\{\s*[^}]*headings:\s*\{\s*anchorLinks:\s*false\s*\}/)
  })
})
