/**
 * WhatsApp line moved off 301 672 9250 (2026-09-23).
 *
 * WhatsApp banned 301 672 9250 three times in two weeks, so every WhatsApp
 * surface now points to 310 434 5165. The CALL line stays on 301 672 9250:
 * `app.config.phone` feeds the `tel:` links and the company footer, and must not
 * move with WhatsApp.
 *
 * Static-source assertions over every file that carried the WhatsApp number.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8')

const OLD_WA = /wa\.me\/(?:c\/)?573016729250|WhatsApp[^\n]{0,30}301[\s-]?672[\s-]?9250/

const WHATSAPP_SURFACES = [
  'app/app.config.ts',
  'app/error.vue',
  'app/plugins/wa-message.client.ts',
  'app/components/CategorySelectionSection.vue',
  'app/pages/politica-privacidad.vue',
  'app/pages/terminos-condiciones.vue',
  'app/pages/gana/index.vue',
]

describe('alquilatucarro WhatsApp is 310 434 5165, calls stay on 301 672 9250', () => {
  const appConfig = read('app/app.config.ts')

  it('app.config.whatsapp deep-links to wa.me/573104345165', () => {
    expect(appConfig).toContain('whatsapp: "https://wa.me/573104345165"')
  })

  it('app.config.phone (tel: links) is still +57 301 672 9250', () => {
    expect(appConfig).toContain('phone: "+57 301 672 9250"')
  })

  it('the prefill plugin rewrites anchors of the new number', () => {
    expect(read('app/plugins/wa-message.client.ts')).toContain("const WA_NUMBER = '573104345165'")
  })

  it('the outage block links and shows the new number', () => {
    expect(read('app/components/CategorySelectionSection.vue')).toContain(
      'alquilatucarro: { phone: "3104345165", display: "310 434 5165" }',
    )
  })

  it('/gana shows the new number as the WhatsApp link text, not franchise.phone', () => {
    const gana = read('app/pages/gana/index.vue')
    expect(gana).toMatch(/:href="franchise\.whatsapp"[^>]*>\s*\+57 310 434 5165\s*<\/a>/)
    expect(gana).toContain('nuestro WhatsApp +57 310 434 5165')
  })

  it.each(WHATSAPP_SURFACES)('%s carries no WhatsApp reference to 301 672 9250', (file) => {
    expect(read(file)).not.toMatch(OLD_WA)
  })
})
