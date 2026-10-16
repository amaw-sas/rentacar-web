/**
 * The Google Maps profile of each brand links to `/maps`, which redirects to
 * the home with UTMs so GA4 can tell profile visits apart from other organic
 * Google traffic.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const BRANDS = ['alquilame', 'alquilatucarro']
const TARGET = '/?utm_source=google&utm_medium=organic&utm_campaign=perfil-maps'

function readBrandConfig(brand: string): string {
  return readFileSync(join(__dirname, '..', '..', `ui-${brand}`, 'nuxt.config.ts'), 'utf-8')
}

describe('/maps short link', () => {
  for (const brand of BRANDS) {
    it(`${brand}: /maps redirects with 302 to the home with the profile UTMs`, () => {
      expect(readBrandConfig(brand)).toContain(
        `'/maps': { redirect: { to: '${TARGET}', statusCode: 302 } }`,
      )
    })

    // On Vercel `/maps` and `/maps/` both become `maps.func` and the build
    // fails with EEXIST; the single rule already covers the trailing slash.
    it(`${brand}: no separate /maps/ rule`, () => {
      expect(readBrandConfig(brand)).not.toContain(`'/maps/':`)
    })
  }
})
