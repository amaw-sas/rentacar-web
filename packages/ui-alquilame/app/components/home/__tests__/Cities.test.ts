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
 *   - Headings use Plus Jakarta without unlayered `.heading-*` typography
 *     tokens overriding their explicit size/weight/color utilities.
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

  it('sources cities from useData() (Supabase-dynamic, not a hardcoded list)', () => {
    expect(cities).toMatch(/useData\(\)/)
    expect(cities).toMatch(/const\s*\{\s*cities\s*\}\s*=\s*useData\(\)/)
  })

  it('iterates the data source — no hardcoded city count or subset for the full grid', () => {
    // The pill grid must v-for over the full `cities` collection, never a literal
    // array of city names. The only allowed cap (featuredCities) is a presentation
    // slice that does not hide any city from the grid.
    expect(cities).toMatch(/v-for="city in cities"/)
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

  it('keeps the section h2 in Plus Jakarta while its explicit title utilities remain authoritative', () => {
    expect(cities).toMatch(
      /<h2 class="font-heading text-3xl md:text-4xl font-extrabold text-gray-900">/,
    )
    expect(cities).not.toMatch(/<h2[^>]*\bheading-section\b/)
  })

  it('keeps each city-name h3 in Plus Jakarta with its explicit card typography intact', () => {
    expect(cities).toMatch(
      /<h3 class="font-heading text-lg sm:text-xl font-bold text-white leading-tight drop-shadow-\[0_2px_6px_rgba\(0,0,0,0\.55\)\]">/,
    )
    expect(cities).not.toMatch(/<h3[^>]*\bheading-card\b/)
  })

  it('reserves image space with aspect-ratio (CLS) for the featured cards', () => {
    expect(cities).toMatch(/aspect-\[/)
  })

  it('adopts the reference title and keeps the pill grid untouched', () => {
    expect(cities).toContain('Alquila tu carro en las principales ciudades de Colombia')
    expect(cities).not.toContain('Presentes en más de')
    // Pill grid still iterates the full data-source order, unchanged.
    expect(cities).toMatch(/v-for="city in cities"/)
  })

  it('shows the featured cities as a STATIC grid, not a marquee', () => {
    // The marquee is gone: the reference presents the featured cities as a fixed
    // grid that reveals on scroll. No track, so no duplicated copy and no
    // aria-hidden clone to maintain.
    expect(cities).not.toMatch(/marquee-track/)
    expect(cities).not.toMatch(/cities-marquee/)
    expect(cities).toMatch(/lg:grid-cols-4/)
  })

  it('gives each featured card the tall 4:5 crop and the white frame', () => {
    expect(cities).toMatch(/aspect-\[4\/5\]/)
    expect(cities).toMatch(/\bborder-\[7px\]/)
    expect(cities).toMatch(/\bborder-white\b/)
    expect(cities).toMatch(/rounded-\[22px\]/)
  })

  it('derives the branch badge from REAL branch data, never a hardcoded count', () => {
    // The reference hardcodes "4 puntos de entrega" for Bogotá; our data says 5.
    // The badge must come from the branches already present in the shared
    // rentacar-data state, matched on branch.city === city.id.
    expect(cities).toMatch(/useStoreAdminData\(\)/)
    expect(cities).toMatch(/branches/)
    expect(cities).toMatch(/\.city\s*===\s*/)
    expect(cities).toMatch(/sede/)
    // No literal "N sedes" baked into the markup.
    expect(cities).not.toMatch(/\d+\s+sedes?\b/)
  })

  it('pluralises the badge so a single-branch city never reads "1 sedes"', () => {
    expect(cities).toMatch(/'sede'/)
    expect(cities).toMatch(/'sedes'/)
  })

  it('reveals the cards on scroll and honours prefers-reduced-motion', () => {
    expect(cities).toMatch(/IntersectionObserver/)
    expect(cities).toMatch(/prefers-reduced-motion/)
    expect(cities).toMatch(/\.city-reveal\s*\{[\s\S]*transition:/)
    expect(cities).not.toMatch(
      /class="city-reveal[^"]*\btransition-all\b[^"]*\bduration-300\b/,
    )
  })

  it('shows a hover affordance on each card', () => {
    expect(cities).toMatch(/group-hover/)
  })

  it('adds the reference trust row (confianza) below the cities', () => {
    // Three reassurance items ported from the reference: seguridad, entregas
    // rápidas, soporte 24/7.
    expect(cities).toContain('Seguridad y confianza')
    expect(cities).toContain('Entregas rápidas')
    expect(cities).toContain('Soporte 24/7')
  })
})
