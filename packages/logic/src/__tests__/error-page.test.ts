/**
 * Página 404 (docs/specs/pagina-404): contrato de los tres error.vue.
 *
 * entry.css se quita del HTML del servidor en toda ruta que no sea la home, y
 * error.vue nunca lo recupera en el cliente. Por eso la página de error lleva
 * su propia hoja inline (`ep-*`) y no puede depender de Tailwind ni de main.css.
 * Source-guards: los mounts con jsdom no corren en este checkout.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { goBackOrHome } from '../composables/useErrorPageNavigation'
import { PUBLIC_CITIES } from '../composables/usePublicCities'

const ROOT = join(__dirname, '..', '..', '..', '..')
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8')
const BRANDS = ['alquilame', 'alquilatucarro', 'alquicarros'] as const
const css = read('packages/logic/src/assets/error-page.css')

describe('error-page.css', () => {
  it('es autocontenida: sin @apply, @theme ni variables de main.css', () => {
    expect(css).not.toMatch(/@apply|@theme|@import|@tailwind/)
    expect(css).not.toMatch(/var\(--color-|var\(--ui-/)
  })

  it('todas las clases llevan el prefijo ep-', () => {
    const code = css.replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...code.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1])
    expect(selectors.length).toBeGreaterThan(10)
    for (const s of selectors) expect(s).toMatch(/^ep-/)
  })

  it('define el degradado por variables, el acento ámbar y foco visible', () => {
    expect(css).toContain('var(--ep-from)')
    expect(css).toContain('var(--ep-to)')
    expect(css).toContain('#f59e0b')
    expect(css).toContain(':focus-visible')
  })

  it('la lista de ciudades envuelve y no desborda a 360px', () => {
    expect(css).toMatch(/\.ep-cities\s*\{[^}]*flex-wrap:\s*wrap/)
  })
})

describe.each(BRANDS)('%s/app/error.vue', (brand) => {
  const src = read(`packages/ui-${brand}/app/error.vue`)
  const template = src.slice(0, src.indexOf('<script'))

  it('inyecta la hoja ?inline en el servidor con useHead', () => {
    expect(src).toMatch(/import errorPageCss from '@rentacar-main\/logic\/assets\/error-page\.css\?inline'/)
    expect(src).toMatch(/useHead\(\{[\s\S]*style:\s*\[\{\s*key:\s*'error-page',\s*innerHTML:\s*errorPageCss/)
  })

  it('el template no usa utilidades Tailwind', () => {
    const classes = [...template.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1]!.split(/\s+/)).filter(Boolean)
    expect(classes.length).toBeGreaterThan(5)
    for (const c of classes) expect(c).toMatch(/^ep-/)
    expect(template).not.toMatch(/ cls="(?![^"]*\bep-)/)
  })

  it('pinta un enlace /<id> por ciudad, solo en 404', () => {
    expect(template).toContain('v-if="statusCode === 404"')
    expect(template).toContain('v-for="city in cities"')
    expect(template).toContain('`/${city.id}`')
    expect(src).toContain('usePublicCities()')
  })

  it('"Volver atrás" usa goBackOrHome con history.state.back, no history.length', () => {
    expect(src).toContain('goBackOrHome')
    expect(src).toContain('hasInAppBack: import.meta.client && !!window.history.state?.back')
    expect(src).not.toContain('history.length')
  })

  it('el título no repite la marca (la plantilla del sitio ya la añade)', () => {
    expect(src).toContain("'Página no encontrada'")
    expect(src).toContain("'Algo salió mal'")
    expect(src).not.toMatch(/title:\s*`Error/)
  })

  it('re-renderiza el head al montar para vencer el título de respaldo de nuxt-seo-utils', () => {
    expect(src).toMatch(/const unhead = injectHead\(\)[\s\S]*onMounted\([\s\S]*hook\('dom:rendered'[\s\S]*setTimeout\(\(\) => unhead\.invalidate\(\)\)/)
  })

  it('los enlaces target=_blank llevan rel="noopener"', () => {
    const blanks = template.match(/target="_blank"/g) ?? []
    const rels = template.match(/rel="noopener"/g) ?? []
    expect(rels.length).toBe(blanks.length)
  })
})

describe('variables por marca', () => {
  it('alquilame usa hero-from y brand-950 resueltos', () => {
    const s = read('packages/ui-alquilame/app/error.vue')
    expect(s).toContain('--ep-from: #cc022b')
    expect(s).toContain('--ep-to: #4a000b')
    expect(s).toContain('variant="white"')
  })
  it.each(['alquilatucarro', 'alquicarros'] as const)('%s usa blue-900 a blue-950', (b) => {
    const s = read(`packages/ui-${b}/app/error.vue`)
    expect(s).toContain('--ep-from: #1e3a8a')
    expect(s).toContain('--ep-to: #172554')
  })
  it('alquilatucarro mantiene el número 301 fijo (lo vigila whatsapp-number.test.ts)', () => {
    const s = read('packages/ui-alquilatucarro/app/error.vue')
    expect(s).toContain('href="https://wa.me/573016729250"')
  })
})

describe('PUBLIC_CITIES', () => {
  it('son 19 ciudades con id navegable', () => {
    expect(PUBLIC_CITIES).toHaveLength(19)
  })
})

describe('goBackOrHome', () => {
  const make = (hasInAppBack: boolean) => {
    const calls: string[] = []
    return {
      calls,
      run: () =>
        goBackOrHome({
          hasInAppBack,
          clearError: async (o?: { redirect?: string }) => {
            calls.push(o?.redirect ? `clear:${o.redirect}` : 'clear')
          },
          back: () => {
            calls.push('back')
          },
        }),
    }
  }

  it('con página previa de la app: solo back(), sin clearError', async () => {
    const t = make(true)
    await t.run()
    expect(t.calls).toEqual(['back'])
  })

  it('sin página previa de la app (p. ej. venía de Google): redirige a /', async () => {
    const t = make(false)
    await t.run()
    expect(t.calls).toEqual(['clear:/'])
  })
})

describe('pages/ no contiene archivos .ts que se vuelvan ruta', () => {
  // Nuxt convierte cualquier .ts/.js bajo pages/ en ruta (el .author.ts daba 500).
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) return walk(p)
      // Nuxt solo ignora *.test.* / *.spec.* bajo pages/ (los .ts de __tests__ también cuentan).
      return /\.(test|spec)\.ts$/.test(name) ? [] : [p]
    })

  it.each(BRANDS)('ui-%s', (brand) => {
    const pages = join(ROOT, 'packages', `ui-${brand}`, 'app', 'pages')
    if (!existsSync(pages)) return
    const offenders = walk(pages).filter((f) => /\.(ts|js|mjs|tsx|jsx)$/.test(f))
    expect(offenders).toEqual([])
  })
})
