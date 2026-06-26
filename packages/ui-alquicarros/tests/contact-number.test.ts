/**
 * Brand contact number — single source of truth (dogfood /reservas, finding #2).
 *
 * SoT = Supabase `franchises` row for alquicarros:
 *   phone = 3187703670, whatsapp = 573187703670  →  "318 770 3670".
 *
 * Regression context (same leak as alquilame): app.config `phone` carried
 * 301 672 9250 (ALQUILATUCARRO's line) and `whatsapp` a stale 314 682 6821
 * (no franchises row), with error.vue + the privacy policy hardcoding 301.
 * Only the in-page outage block (CategorySelectionSection's per-brand map) was
 * already correct.
 *
 * Every alquicarros contact surface must resolve to 318 770 3670 and nothing
 * else. Static-source assertions; runtime hrefs/tel verified in the dogfood pass.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8')

// Numbers that must NEVER appear as an alquicarros contact:
//  - 301 672 9250 / 573016729250  -> alquilatucarro's line
//  - 314 682 6821 / 573146826821  -> stale, present in no franchises row
const FOREIGN = /301[\s-]?672[\s-]?9250|573016729250|314[\s-]?682[\s-]?6821|573146826821/

describe('alquicarros contact number — single SoT 318 770 3670', () => {
  const appConfig = read('app/app.config.ts')

  it('app.config.phone is the alquicarros number (318 770 3670), not 301', () => {
    expect(appConfig).toMatch(/phone:\s*["']\+?57\s*318\s*770\s*3670["']/)
  })

  it('app.config.whatsapp deep-links to wa.me/573187703670', () => {
    expect(appConfig).toContain('whatsapp: "https://wa.me/573187703670"')
  })

  it('app.config carries no foreign brand number', () => {
    expect(appConfig).not.toMatch(FOREIGN)
  })

  it('error.vue binds WhatsApp to franchise.whatsapp (no hardcoded number)', () => {
    const errpage = read('app/error.vue')
    expect(errpage).toMatch(/:href="franchise\.whatsapp"/)
    expect(errpage).not.toMatch(/wa\.me\/\d+/)
  })

  it('privacy policy derives contact from franchise (no foreign number)', () => {
    expect(read('app/pages/politica-privacidad.vue')).not.toMatch(FOREIGN)
  })

  it('the outage-block per-brand map keeps the correct alquicarros number', () => {
    const section = read('app/components/CategorySelectionSection.vue')
    expect(section).toMatch(/alquicarros:\s*\{\s*phone:\s*["']3187703670["']/)
  })
})
