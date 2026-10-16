/**
 * Each brand publishes short links (`/fb`, `/ig`, `/maps`, ...) in its social
 * bios and Google Maps profile. They 302 to the home with UTMs so GA4 can tell
 * those visits apart without a long URL in the profile.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const social = (source: string) => `/?utm_source=${source}&utm_medium=social&utm_campaign=bio`
const MAPS = '/?utm_source=google&utm_medium=organic&utm_campaign=perfil-maps'

const LINKS: Record<string, Record<string, string>> = {
  alquilame: {
    '/fb': social('facebook'),
    '/ig': social('instagram'),
    '/yt': social('youtube'),
    '/x': social('x'),
    '/tiktok': social('tiktok'),
    '/maps': MAPS,
  },
  // `/tiktok` is a real page here (the TikTok bio landing), not a redirect.
  alquilatucarro: {
    '/fb': social('facebook'),
    '/ig': social('instagram'),
    '/yt': social('youtube'),
    '/x': social('x'),
    '/maps': MAPS,
  },
  alquicarros: {
    '/fb': social('facebook'),
    '/ig': social('instagram'),
    '/yt': social('youtube'),
    '/x': social('x'),
    '/tiktok': social('tiktok'),
    '/maps': MAPS,
  },
}

function readBrandConfig(brand: string): string {
  return readFileSync(join(__dirname, '..', '..', `ui-${brand}`, 'nuxt.config.ts'), 'utf-8')
}

describe('short links', () => {
  for (const [brand, links] of Object.entries(LINKS)) {
    for (const [path, target] of Object.entries(links)) {
      it(`${brand}: ${path} redirects with 302 to ${target}`, () => {
        expect(readBrandConfig(brand)).toContain(
          `'${path}': { redirect: { to: '${target}', statusCode: 302 } }`,
        )
      })

      // On Vercel `/x` and `/x/` both become `x.func` and the build fails
      // with EEXIST; the single rule already covers the trailing slash.
      it(`${brand}: no separate ${path}/ rule`, () => {
        expect(readBrandConfig(brand)).not.toMatch(new RegExp(`['"]${path}/['"]\\s*:`))
      })
    }
  }

  it('alquilatucarro: /tiktok stays a page, not a redirect', () => {
    expect(readBrandConfig('alquilatucarro')).not.toMatch(/'\/tiktok':\s*\{\s*redirect/)
  })
})
