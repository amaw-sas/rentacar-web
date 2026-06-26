/**
 * Brand contact number — single source of truth (dogfood /reservas, finding #2).
 *
 * SoT = Supabase `franchises` row for alquilame (operator-confirmed):
 *   phone = 3002436677, whatsapp = 573002436677  →  "300 243 6677".
 *
 * Regression context: the brand leaked OTHER brands' numbers across its contact
 * surfaces — app.config `phone` + the privacy policy + error.vue carried
 * 301 672 9250 (which is ALQUILATUCARRO's line per the franchises table), and
 * app.config `whatsapp` carried a stale 314 682 6821 that maps to no franchise
 * row at all. Only the in-page outage block (CategorySelectionSection's
 * per-brand map) was already correct.
 *
 * Every alquilame contact surface must resolve to 300 243 6677 and nothing else.
 * Static-source assertions; runtime hrefs/tel verified in the dogfood pass.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8')

// Numbers that must NEVER appear as an alquilame contact:
//  - 301 672 9250 / 573016729250  -> alquilatucarro's line
//  - 314 682 6821 / 573146826821  -> stale, present in no franchises row
const FOREIGN = /301[\s-]?672[\s-]?9250|573016729250|314[\s-]?682[\s-]?6821|573146826821/

describe('alquilame contact number — single SoT 300 243 6677', () => {
  const appConfig = read('app/app.config.ts')

  it('app.config.phone is the alquilame number (300 243 6677), not 301', () => {
    expect(appConfig).toMatch(/phone:\s*["']\+?57\s*300\s*243\s*6677["']/)
  })

  it('app.config.whatsapp deep-links to wa.me/573002436677', () => {
    expect(appConfig).toContain('whatsapp: "https://wa.me/573002436677"')
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

  it('the outage-block per-brand map keeps the correct alquilame number', () => {
    // CategorySelectionSection's whatsappContacts mirrors the franchises table;
    // its alquilatucarro entry legitimately holds 301 — that file is exempt.
    const section = read('app/components/CategorySelectionSection.vue')
    expect(section).toMatch(/alquilame:\s*\{\s*phone:\s*["']3002436677["']/)
  })
})
