import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../CityPage.vue', import.meta.url)),
  'utf8',
)

describe('CityPage — copy-to-WhatsApp trigger lives on the LocationIcon (pin)', () => {
  it('does not render the legacy clipboard UButton', () => {
    expect(source).not.toMatch(/i-heroicons-clipboard-document/)
  })

  it('wraps the LocationIcon in a <button> bound to copySearchToWhatsapp', () => {
    const pattern = /<button\b[^>]*@click="copySearchToWhatsapp"[^>]*>[\s\S]*?<LocationIcon\b[\s\S]*?\/>[\s\S]*?<\/button>/
    expect(source).toMatch(pattern)
  })

  it('exposes the pin button to assistive tech with a Spanish aria-label', () => {
    expect(source).toMatch(/<button\b[^>]*aria-label="Copiar datos de búsqueda para WhatsApp"/)
  })

  it('keeps the useShareSearchParams binding so the handler is still wired', () => {
    expect(source).toMatch(/copyToWhatsapp:\s*copySearchToWhatsapp\s*\}\s*=\s*useShareSearchParams\(\)/)
  })
})
