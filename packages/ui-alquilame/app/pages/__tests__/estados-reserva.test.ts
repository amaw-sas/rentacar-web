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

describe('SCEN-E2 — la salida de /sindisponibilidad devuelve al buscador en limpio', () => {
  const source = read(SIN)
  const block = markup(source)

  /*
   * Historia de este escenario, porque el "cómo" ya cambió dos veces:
   *
   * 1. Original: el CTA reconstruía el deep link `/reservas/lugar-recogida/…`
   *    con las fechas que acababan de fallar. El cliente repetía la búsqueda
   *    agotada y volvía aquí.
   * 2. Intento intermedio: `navigateTo('/reservas')` tras reescribir las fechas
   *    del store. Se descartó — introducía dos regresiones verificadas:
   *      · `useSearchByQueryParams.ts:66-72` corta sin query, así que la
   *        búsqueda no se re-dispara y `categoriesAvailabilityData` conserva la
   *        parrilla agotada (solo se limpia dentro de `search()`,
   *        useStoreSearchData.ts:85).
   *      · `isSubmittingForm` nunca se libera en la rama sin-stock
   *        (useStoreReservationForm.ts:435, dentro de `if (releaseSubmit)`), y
   *        el CTA de reserva se deshabilita con ese flag
   *        (CategorySelectionSection.vue:200) → botón muerto el resto de la
   *        sesión SPA.
   * 3. Actual: un ancla HTML normal a `/reservas`. La navegación de documento
   *    reinicia Pinia, así que ambos estados sucios desaparecen sin tocar
   *    `packages/logic` ni el store desde una página.
   *
   * Lo observable —y lo único que este bloque fija— es que el cliente sale
   * hacia el buscador sin arrastrar la búsqueda que acaba de fallar.
   */

  it('no reconstruye el deep link con las fechas que acaban de fallar', () => {
    expect(source).not.toContain('fecha-recogida/')
    expect(source).not.toContain('/reservas/lugar-recogida')
  })

  it('la salida es un ancla a /reservas, no una navegación de router', () => {
    // `href` y no `NuxtLink`/`navigateTo` A PROPÓSITO: la recarga es la que
    // limpia el estado. Si esto vuelve a ser navegación de cliente, regresan
    // la parrilla obsoleta y el botón de reserva atascado.
    expect(block).toMatch(/<a[^>]*href="\/reservas"/)
    expect(block).toContain('Buscar con otras fechas')
    expect(source).not.toMatch(/navigateTo\(/)
    expect(source).not.toMatch(/<NuxtLink[^>]*to="\/reservas"/)
  })

  it('la página no escribe en el store — no hay estado que sincronizar', () => {
    // El intento 2 escribía fechas aquí. Sin escrituras no hay carrera con los
    // watchers bidireccionales del Searcher ni defaults duplicados entre
    // paquetes.
    // Sobre la LLAMADA, no sobre la mención: el comentario del <script setup>
    // cita `useStoreReservationForm.ts:435` para explicar por qué el ancla es
    // ancla. Prohibir la palabra prohibiría documentar el motivo.
    expect(source).not.toMatch(/useStoreReservationForm\(/)
    expect(source).not.toMatch(/store\.\w+\s*=[^=]/)
  })
})

describe('SCEN-E7 — el contenido no va dentro de una live region', () => {
  it.each([
    ['sindisponibilidad', SIN],
    ['pendiente', PEN],
  ])('%s no envuelve la tarjeta en role="status"', (_name, file) => {
    // `role="status"` es una live region: solo anuncia cambios POSTERIORES a
    // que exista en el DOM, y aquí el contenido llega ya pintado por SSR — no
    // aporta nada al cargar. A cambio mete un h1, dos h2, un enlace externo y
    // el CTA dentro de una región con aria-atomic implícito, que es
    // antipatrón ARIA: un parche de Vue durante la hidratación puede hacer que
    // el lector relea el bloque entero. El <h1> ya comunica el desenlace.
    expect(markup(read(file))).not.toContain('role="status"')
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
