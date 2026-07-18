import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')
const BRANDS = ['alquilatucarro', 'alquilame', 'alquicarros']

function brandFile(brand: string, path: string): string {
  return readFileSync(join(ROOT, `ui-${brand}`, path), 'utf8')
}

function vueFilesBelow(path: string): string[] {
  if (!existsSync(path)) return []
  return readdirSync(path, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.vue'))
    .map(entry => join(entry.parentPath, entry.name))
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

    it(`${brand}: catalog fetch is attached only to booking pages`, () => {
      const brandRoot = join(ROOT, `ui-${brand}`)
      const middleware = brandFile(brand, 'app/middleware/rentacar-data.ts')
      expect(middleware).toContain('await useRentacarData()')
      expect(existsSync(join(brandRoot, 'app/middleware/rentacar-data.global.ts'))).toBe(false)

      const bookingPages = [
        join(brandRoot, 'app/pages/index.vue'),
        join(brandRoot, 'app/pages/[city]/index.vue'),
        ...vueFilesBelow(join(brandRoot, 'app/pages/reservas')),
        ...vueFilesBelow(join(brandRoot, 'app/pages/[city]/buscar-vehiculos')),
      ]
      if (brand === 'alquilatucarro') {
        bookingPages.push(join(brandRoot, 'app/pages/tarifas.vue'))
      }
      for (const page of bookingPages) {
        expect(readFileSync(page, 'utf8'), page).toContain('rentacar-data')
      }

      for (const staticPage of ['app/pages/blog/index.vue', 'app/pages/gana/index.vue']) {
        expect(brandFile(brand, staticPage), staticPage).not.toContain('rentacar-data')
      }
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
    expect(publicCritical).toContain(".replace(/\\/\\*[\\s\\S]*?\\*\\//g, '')")

    const criticalCss = publicCritical.match(/innerHTML: `([\s\S]*?)`\s*\.replace/)?.[1]
    expect(criticalCss).toBeDefined()
    const deliveredCriticalCss = criticalCss!
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .trim()
    expect(Buffer.byteLength(deliveredCriticalCss)).toBeLessThan(10_000)

    const seoLayout = brandFile('alquilatucarro', 'app/layouts/seo.vue')
    expect(seoLayout).toContain("key: 'critical-seo-layout'")
  })
})
