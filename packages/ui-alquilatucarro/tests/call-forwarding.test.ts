/**
 * Google forwarding number on call links (alquilatucarro only).
 * Spec: docs/specs/2026-09-23-website-call-forwarding/design.md
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const pkgRoot = join(__dirname, '..')
const appRoot = join(pkgRoot, 'app')
const repoRoot = join(pkgRoot, '..', '..')
const read = (p: string) => readFileSync(p, 'utf-8')

const pluginPath = join(appRoot, 'plugins/call-forwarding.client.ts')
const layout = read(join(appRoot, 'layouts/default.vue'))
const tiktok = read(join(appRoot, 'pages/tiktok.vue'))
const chat = read(join(appRoot, 'components/ChatWidget.vue'))
const gana = read(join(appRoot, 'pages/gana/index.vue'))

const telAnchors = (src: string) =>
  (src.match(/<a\b[^>]*>/g) ?? []).filter((a) => /tel:|telHref|callPhone/.test(a))

describe('SCEN-006: Google Ads phone snippet on alquilatucarro', () => {
  it('registers the Ads tag and the call conversion with the visible number', () => {
    expect(existsSync(pluginPath)).toBe(true)
    const plugin = read(pluginPath)
    expect(plugin).toMatch(/AW-18234487332/)
    expect(plugin).toMatch(/SC3KCKnx7YIdEKTk8PZD/)
    expect(plugin).toMatch(/buildPhoneConversionConfig\(\s*franchise\.phone/)
  })

  it('does not load the alquilatucarro Ads tag on the other two brands', () => {
    for (const brand of ['ui-alquilame', 'ui-alquicarros']) {
      const dir = join(repoRoot, 'packages', brand)
      for (const rel of ['nuxt.config.ts', 'app/plugins/call-forwarding.client.ts']) {
        const f = join(dir, rel)
        if (existsSync(f)) expect(read(f)).not.toMatch(/AW-18234487332/)
      }
    }
  })
})

describe('SCEN-001/002/003: call links follow the call phone', () => {
  it('mobile menu call link uses the call phone', () => {
    const anchors = telAnchors(layout)
    expect(anchors.length).toBeGreaterThanOrEqual(1)
    expect(layout).toMatch(/useCallPhone\(\)/)
    expect(layout).not.toMatch(/`tel:\$\{\(franchise\.phone/)
  })

  it('/tiktok "Llamar" link uses the call phone', () => {
    expect(telAnchors(tiktok).length).toBeGreaterThanOrEqual(1)
    expect(tiktok).toMatch(/useCallPhone\(\)/)
    expect(tiktok).not.toMatch(/`tel:\$\{\(franchise\.phone/)
  })

  it('chat call button dials and announces the call phone', () => {
    expect(chat).toMatch(/useCallPhone\(\)/)
    expect(chat).not.toMatch(/`tel:\$\{franchise\.phone\}`/)
    expect(chat).not.toMatch(/`Llamar al \$\{franchise\.phone\}`/)
  })
})

describe('SCEN-004: WhatsApp is never touched', () => {
  it('/gana WhatsApp link keeps showing the real number', () => {
    const wa = (gana.match(/<a\b[\s\S]*?<\/a>/g) ?? []).find((a) => /franchise\.whatsapp/.test(a))
    expect(wa).toBeDefined()
    expect(wa).toMatch(/\{\{\s*franchise\.phone\s*\}\}/)
  })
})

describe('SCEN-005: structured data keeps the real number', () => {
  it('JSON-LD telephone is the franchise phone, not the call phone', () => {
    const seo = read(join(repoRoot, 'packages/logic/src/composables/useBaseSEO.ts'))
    expect(seo).toMatch(/telephone:\s*franchise\.phone/)
  })
})
