/**
 * WhatsApp line back on 301 672 9250 (2026-10-03).
 *
 * WhatsApp banned 301 672 9250 in September, so the web moved WhatsApp to the
 * temporary 310 434 5165 (PR #494). The line was restored and the dashboard's
 * `franchises.whatsapp` points to 573016729250 again, so every WhatsApp surface
 * returns to 301 672 9250 and the temporary number must not survive anywhere.
 * The CALL line was never moved: `app.config.phone` stays on 301 672 9250.
 *
 * Static-source assertions over every file that carried the WhatsApp number.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8')

const TEMP_LINE = /573104345165|3104345165|310[\s-]?434[\s-]?5165/

const WHATSAPP_SURFACES = [
  'app/app.config.ts',
  'app/error.vue',
  'app/plugins/wa-message.client.ts',
  'app/components/CategorySelectionSection.vue',
  'app/pages/politica-privacidad.vue',
  'app/pages/terminos-condiciones.vue',
  'app/pages/gana/index.vue',
  '../ui-alquilame/app/components/CategorySelectionSection.vue',
]

describe('alquilatucarro WhatsApp is back on 301 672 9250', () => {
  const appConfig = read('app/app.config.ts')

  it('app.config.whatsapp deep-links to wa.me/573016729250', () => {
    expect(appConfig).toContain('whatsapp: "https://wa.me/573016729250"')
  })

  it('app.config.phone (tel: links) is still +57 301 672 9250', () => {
    expect(appConfig).toContain('phone: "+57 301 672 9250"')
  })

  it('the prefill plugin rewrites anchors of the 301 line', () => {
    expect(read('app/plugins/wa-message.client.ts')).toContain("const WA_NUMBER = '573016729250'")
  })

  it('the error page links to the 301 line', () => {
    expect(read('app/error.vue')).toContain('href="https://wa.me/573016729250"')
  })

  it('the outage block links and shows the 301 line', () => {
    expect(read('app/components/CategorySelectionSection.vue')).toContain(
      'alquilatucarro: { phone: "3016729250", display: "301 672 9250" }',
    )
  })

  it("alquilame's cross-brand fallback map carries the 301 line", () => {
    expect(read('../ui-alquilame/app/components/CategorySelectionSection.vue')).toContain(
      'alquilatucarro: { phone: "3016729250", display: "301 672 9250" }',
    )
  })

  it('privacy policy and terms list WhatsApp on the 301 line', () => {
    expect(read('app/pages/politica-privacidad.vue')).toContain('<strong>WhatsApp:</strong> +57 301 672 9250')
    expect(read('app/pages/terminos-condiciones.vue')).toContain('<strong>WhatsApp:</strong> +57 301 672 9250')
  })

  it('/gana derives the WhatsApp link text from franchise.whatsapp and its FAQ names the 301 line', () => {
    const gana = read('app/pages/gana/index.vue')
    expect(gana).toMatch(/:href="franchise\.whatsapp"[^>]*>\s*\{\{ whatsappDisplay \}\}\s*<\/a>/)
    expect(gana).toMatch(/const whatsappDisplay = String\(franchise\.whatsapp/)
    expect(gana).toContain('nuestro WhatsApp +57 301 672 9250')
  })

  it.each(WHATSAPP_SURFACES)('%s no longer carries the temporary 310 434 5165', (file) => {
    expect(read(file)).not.toMatch(TEMP_LINE)
  })
})
