import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('Alquilame GA4 wiring', () => {
  it('loads and configures the property measurement ID', () => {
    const configPath = fileURLToPath(new URL('../nuxt.config.ts', import.meta.url))
    const config = readFileSync(configPath, 'utf8')

    expect(config).toContain(
      "src: 'https://www.googletagmanager.com/gtag/js?id=G-ZPZC1TP9T0'",
    )
    expect(config).toContain("gtag('config','G-ZPZC1TP9T0')")
  })
})
