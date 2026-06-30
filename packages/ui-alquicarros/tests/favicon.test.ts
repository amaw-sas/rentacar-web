/**
 * SCEN-FAV-ALQUICARROS — the brand favicon shows in production.
 *
 * Root cause it guards against: all three brands shipped the SAME favicon.ico
 * (a 28×28 PNG renamed to .ico, md5 d0dc0cd8…) and alquicarros declared an
 * empty `link: []`, so the browser fell back to that leaked shared icon.
 *
 * Observable contract (static-source + on-disk; runtime HTTP check on preview):
 *   - public/favicon.ico exists, is non-empty, and is NOT the shared placeholder.
 *   - nuxt.config declares a `.ico` favicon <link> and is no longer `link: []`.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

// The single icon that was duplicated across alquilatucarro/alquilame/alquicarros.
const SHARED_PLACEHOLDER_MD5 = 'd0dc0cd81676758c19ac93674bdd94f0'

describe('SCEN-FAV-ALQUICARROS — brand favicon', () => {
  it('ships a brand favicon.ico that is NOT the leaked shared placeholder', () => {
    const ico = join(ROOT, 'public/favicon.ico')
    expect(existsSync(ico)).toBe(true)
    expect(statSync(ico).size).toBeGreaterThan(0)
    const md5 = createHash('md5').update(readFileSync(ico)).digest('hex')
    expect(md5).not.toBe(SHARED_PLACEHOLDER_MD5)
  })

  it('declares the .ico favicon <link> (no empty link array)', () => {
    const cfg = read('nuxt.config.ts')
    expect(cfg).toMatch(/href:\s*['"]\/favicon\.ico['"]/)
    expect(cfg).not.toMatch(/link:\s*\[\s*\]/)
  })
})
