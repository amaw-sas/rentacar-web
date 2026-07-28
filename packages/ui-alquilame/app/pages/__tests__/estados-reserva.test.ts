/**
 * /sindisponibilidad y /pendiente — las dos pantallas de desenlace de reserva.
 *
 * Antes se veían sobre el vinotinto del layout (`default.vue` pinta
 * `from-brand-900 to-brand-950` y estas dos eran las únicas rutas que no
 * tapaban ese respaldo con fondo propio). Ahora usan el patrón de tiquete de
 * /reservado, así que las tres pantallas del final del flujo son de la misma
 * familia.
 *
 *   - SCEN-E1: ambas pintan su propio fondo — el vinotinto ya no asoma.
 *   - SCEN-E2: el CTA de /sindisponibilidad rompe el bucle de fechas.
 *   - SCEN-E3: WhatsApp es un enlace real, no texto plano.
 *   - SCEN-E4: /pendiente no se lee como una confirmación.
 *   - SCEN-E5: sin emojis del sistema.
 *   - SCEN-E6: siguen fuera del índice de Google.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..') // → packages/ui-alquilame
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8')

const SIN = 'app/pages/sindisponibilidad.vue'
const PEN = 'app/pages/pendiente.vue'

/** Markup renderizado, sin comentarios y con los espacios colapsados. */
const markup = (source: string): string =>
  source
    .slice(0, source.indexOf('</template>'))
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')

describe('SCEN-E1 — el vinotinto del layout ya no asoma', () => {
  it.each([
    ['sindisponibilidad', SIN],
    ['pendiente', PEN],
  ])('%s pinta la foto de tiquete y una tarjeta blanca', (_name, file) => {
    const block = markup(read(file))
    expect(block).toContain('/images/reservado/fondo-tiquete.webp')
    expect(block).toContain('bg-white rounded-t-3xl')
    expect(block).toContain('ticket-divider')
  })

  it.each([
    ['sindisponibilidad', SIN],
    ['pendiente', PEN],
  ])('%s deja de depender del hack de texto blanco sobre el respaldo', (_name, file) => {
    // `[--ctx-text-primary:#fff]` existía solo para que los .heading-* siguieran
    // legibles sobre el degradado oscuro. Sobre tarjeta blanca sobra, y dejarlo
    // pondría titulares blancos sobre blanco.
    const block = markup(read(file))
    expect(block).not.toContain('[--ctx-text-primary:#fff]')
  })
})

describe('SCEN-E2 — /sindisponibilidad rompe el bucle de fechas', () => {
  const source = read(SIN)

  it('ya no reconstruye el deep link con las fechas que acaban de fallar', () => {
    // El `searchUrl` viejo rearmaba /reservas/lugar-recogida/…/fecha-recogida/…
    // con los mismos valores del store, así que el cliente repetía la búsqueda
    // agotada y volvía a caer aquí.
    expect(source).not.toContain('fecha-recogida/')
    expect(source).not.toContain('lugar-recogida/')
  })

  it('limpia ambas fechas del store antes de navegar', () => {
    // El Searcher está atado en dos direcciones al store (Searcher.vue:570-590):
    // volver a /reservas sin limpiar las fechas las vuelve a prefijar.
    expect(source).toMatch(/store\.fechaRecogida\s*=/)
    expect(source).toMatch(/store\.fechaDevolucion\s*=/)
  })

  it('conserva la sede elegida — el cliente sigue queriendo esa ciudad', () => {
    expect(source).not.toMatch(/store\.lugarRecogida\s*=\s*null/)
  })

  it('manda a la página de búsqueda', () => {
    expect(source).toMatch(/navigateTo\(\s*['"]\/reservas['"]\s*\)/)
  })
})

describe('SCEN-E3 — WhatsApp deja de ser texto muerto', () => {
  it.each([
    ['sindisponibilidad', SIN],
    ['pendiente', PEN],
  ])('%s enlaza a franchise.whatsapp de forma segura', (_name, file) => {
    const block = markup(read(file))
    expect(block).toMatch(/:href="franchise\.whatsapp"/)
    expect(block).toContain('target="_blank"')
    expect(block).toContain('rel="noopener noreferrer"')
    expect(block).toContain('Escribir por WhatsApp')
  })
})

describe('SCEN-E4 — /pendiente no se lee como una confirmación', () => {
  const block = markup(read(PEN))

  it('el título deja de celebrar', () => {
    expect(block).toContain('Recibimos tu solicitud')
    expect(block).not.toContain('¡Tu solicitud está en proceso!')
  })

  it('avisa explícitamente que todavía no está confirmada', () => {
    expect(block).toContain('Todavía no es una reserva confirmada')
  })

  it('no muestra código de reserva — verlo hace creer que ya quedó hecha', () => {
    expect(block).not.toMatch(/reserveCode|Código de reserva/i)
  })

  it('da el tiempo real: la respuesta depende de la temporada', () => {
    expect(block).toContain('un par de horas')
    expect(block).toContain('algunos días')
    expect(block).not.toContain('3 a 5 horas')
    expect(block).not.toContain('Tiempo estimado')
  })
})

describe('SCEN-E5 — sin emojis del sistema', () => {
  it.each([
    ['sindisponibilidad', SIN],
    ['pendiente', PEN],
  ])('%s usa SVG en línea, no 📱 ni 📧', (_name, file) => {
    const block = markup(read(file))
    expect(block).not.toContain('📱')
    expect(block).not.toContain('📧')
    expect(block).toContain('<svg')
  })
})

describe('SCEN-E6 — siguen fuera del índice', () => {
  it.each([
    ['sindisponibilidad', SIN],
    ['pendiente', PEN],
  ])('%s se marca noindex', (_name, file) => {
    expect(read(file)).toMatch(/content: 'noindex, nofollow'/)
  })

  it('nuxt.config las mantiene excluidas del sitemap', () => {
    const config = read('nuxt.config.ts')
    const sitemapBlock = config.slice(config.indexOf('sitemap: {'))
    expect(sitemapBlock).toContain("'/pendiente'")
    expect(sitemapBlock).toContain("'/sindisponibilidad'")
  })

  it('la guarda contra páginas lab-* sigue en pie', () => {
    // En julio cinco lab-*.vue llegaron a producción Y al sitemap. Tiene que ser
    // RegExp: `sitemap.exclude` resuelve las cadenas con radix3, donde `*` y
    // `**` solo valen como SEGMENTO completo — `/lab-*` no filtraría nada.
    const config = read('nuxt.config.ts')
    expect(config).toMatch(/const LAB_ROUTES = \/\^\\\/lab-\//)

    const sitemapBlock = config.slice(config.indexOf('sitemap: {'))
    expect(sitemapBlock).toMatch(/exclude:\s*\[[^\]]*LAB_ROUTES/)
  })
})
