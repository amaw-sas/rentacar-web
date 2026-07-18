import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')
const BRANDS = ['alquilatucarro', 'alquilame', 'alquicarros']

function brandFile(brand: string, path: string): string {
  return readFileSync(join(ROOT, `ui-${brand}`, path), 'utf8')
}

describe('C5b payload and bundle contracts', () => {
  it('has no global async catalog plugin', () => {
    expect(existsSync(join(ROOT, 'logic', 'plugins', 'rentacar-data.ts'))).toBe(false)
  })

  for (const brand of BRANDS) {
    it(`${brand}: footer uses compact city links without booking graph imports`, () => {
      const layout = brandFile(brand, 'app/layouts/default.vue')
      expect(layout).toContain('usePublicCities()')
      expect(layout).toMatch(/:to="`\/\$\{city\.id\}`"/)
      expect(layout).not.toContain('buildCityReservationURL')
      expect(layout).not.toContain('@internationalized/date')
      expect(layout).not.toContain('useStoreAdminData')
    })

    it(`${brand}: catalog fetch is route-gated`, () => {
      const middleware = brandFile(brand, 'app/middleware/rentacar-data.global.ts')
      expect(middleware).toContain('routeNeedsRentacarData(to.path)')
      expect(middleware).toContain('await useRentacarData()')
    })

    it(`${brand}: chat engine and drawer panel are interaction imports`, () => {
      const chat = brandFile(brand, 'app/components/ChatWidget.vue')
      const drawer = brandFile(brand, 'app/components/SearcherSelectDrawer.vue')
      expect(chat).toMatch(/defineAsyncComponent\(\(\) => import\('\.\/ChatConversation\.vue'\)\)/)
      expect(chat).toMatch(/v-if="chatActivated"/)
      expect(chat).toMatch(/v-show="panelOpen"/)
      expect(chat).not.toMatch(/useChatConversation\(\)/)
      expect(drawer).toMatch(/defineAsyncComponent\([\s\S]*SearcherSelectDrawerPanel\.vue/)
      expect(drawer).toMatch(/v-if="drawerActivated"/)
    })
  }

  it('keeps private dashboard utilities out of the public critical block', () => {
    const config = brandFile('alquilatucarro', 'nuxt.config.ts')
    const start = config.indexOf("key: 'critical-cls'")
    const end = config.indexOf('link: []', start)
    const publicCritical = config.slice(start, end)
    expect(publicCritical).not.toContain('SEO Dashboard Critical CSS - Grid Layout')
    expect(Buffer.byteLength(publicCritical)).toBeLessThan(12_000)

    const seoLayout = brandFile('alquilatucarro', 'app/layouts/seo.vue')
    expect(seoLayout).toContain("key: 'critical-seo-layout'")
  })
})
