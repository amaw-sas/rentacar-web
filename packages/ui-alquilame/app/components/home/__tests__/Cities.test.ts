/**
 * F1 step04 — Cities (issue #112).
 *
 * Static-source assertions encoding the observable cities contract (full
 * runtime/visual check deferred to the F1 preview verification):
 *   - SCEN-F1-04: the section lists ALL active cities from the data source, each
 *     with an INTERNAL link `/{city.id}` — ZERO wa.me.
 *   - The city set is iterated from useData().cities (Supabase-dynamic); the
 *     component never hardcodes a count or slices the grid to a fixed subset.
 *   - Gradient guard (F0 lesson): the section MUST use the v4 `bg-linear-to-*`
 *     utility, NEVER the broken v3 gradient alias (asserted via BROKEN_V3_GRADIENT,
 *     assembled from fragments so this file never contains the forbidden literal).
 *   - Headings adopt the `.heading-*` utilities (Plus Jakarta).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquilame

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

// The broken v3 alias, assembled from fragments so this guard file never itself
// contains the literal token a project-wide grep forbids in rendered markup.
const BROKEN_V3_GRADIENT = new RegExp(['bg', 'gradient', 'to-'].join('-'))

describe('F1 step04 — Cities.vue', () => {
  const cities = read('app/components/home/Cities.vue')

  it('sources cities from the deterministic SERVICE_CITIES set (issue #221, not a hardcoded inline list)', () => {
    // AMENDED for #221 (see docs/specs/city-count-derivation/
    // AMEND-2026-07-04-issue-221.md): the pill grid now renders from the
    // build-time SERVICE_CITIES source of truth, NOT live useData().cities —
    // live data drifted between the ISR HTML and the hydration payload and
    // caused hydration mismatches. SERVICE_CITIES is the single guarded list
    // (still not a hardcoded literal inside this component).
    expect(cities).toMatch(/import\s*\{\s*SERVICE_CITIES\s*\}\s*from\s*'@rentacar-main\/logic\/utils'/)
    expect(cities).not.toMatch(/const\s*\{\s*cities\s*\}\s*=\s*useData\(\)/)
  })

  it('iterates the full SERVICE_CITIES set — no hardcoded subset/slice for the grid', () => {
    // The pill grid must v-for over the full SERVICE_CITIES collection, never a
    // literal array of city names nor a slice that hides a city.
    expect(cities).toMatch(/v-for="city in SERVICE_CITIES"/)
    expect(cities).not.toMatch(/SERVICE_CITIES\.slice\(/)
  })

  it('links every city INTERNALLY to /{city.id} via NuxtLink :to', () => {
    expect(cities).toMatch(/:to="`\/\$\{city\.id\}`"/)
    expect(cities).toMatch(/<NuxtLink\b/)
  })

  it('contains ZERO wa.me links (no WhatsApp anywhere in the section)', () => {
    expect(cities).not.toMatch(/wa\.me/)
    expect(cities).not.toMatch(/whatsapp/i)
  })

  it('uses no external/new-tab anchors for city links (internal navigation only)', () => {
    expect(cities).not.toMatch(/href="https?:\/\//)
    expect(cities).not.toMatch(/target="_blank"/)
  })

  it('renders the brand gradient via the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(cities).toMatch(/bg-linear-to-[a-z]/)
    expect(cities).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('adopts the .heading-* utilities (Plus Jakarta) for its headings', () => {
    expect(cities).toMatch(/heading-(section|card)/)
  })

  it('reserves image space with aspect-ratio (CLS) for the featured cards', () => {
    expect(cities).toMatch(/aspect-\[/)
  })
})
