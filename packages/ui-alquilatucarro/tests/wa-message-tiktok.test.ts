/**
 * The WhatsApp prefill keeps saying the lead came from TikTok.
 *
 * Bug: /tiktok wrote "…en TikTok…" into its WhatsApp link, but the capture-phase
 * rewrite in plugins/wa-message.client.ts replaced it on click with the generic
 * text, so the sales rep never saw the source.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildWaContactMessage, isTikTokVisitor } from '../app/utils/waContactMessage'

const CITIES = { bogota: 'Bogotá', cali: 'Cali' }

describe('SCEN-001: /tiktok keeps the TikTok source', () => {
  it('names TikTok on the /tiktok page', () => {
    const msg = buildWaContactMessage({ pathname: '/tiktok', fromTikTok: true, cities: CITIES })
    expect(msg).toBe('Hola, vengo de TikTok. Vi su página de alquiler de carros y quiero saber los requisitos')
  })

  it('treats the /tiktok path as TikTok even without stored attribution', () => {
    expect(isTikTokVisitor('/tiktok', null)).toBe(true)
  })
})

describe('SCEN-002: the source survives the jump to a city search', () => {
  it('names TikTok and the city', () => {
    const msg = buildWaContactMessage({
      pathname: '/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto',
      fromTikTok: true,
      cities: CITIES,
    })
    expect(msg).toBe('Hola, vengo de TikTok. Vi su página de alquiler de carros en Bogotá y quiero saber los requisitos')
  })

  it('recognises TikTok from utm_source or ttclid', () => {
    expect(isTikTokVisitor('/bogota', { utm_source: 'tiktok' })).toBe(true)
    expect(isTikTokVisitor('/bogota', { utm_source: 'TikTok' })).toBe(true)
    expect(isTikTokVisitor('/bogota', { ttclid: 'abc' })).toBe(true)
  })
})

describe('SCEN-003: everyone else gets today’s text, unchanged', () => {
  it('keeps the city message', () => {
    expect(buildWaContactMessage({ pathname: '/cali', fromTikTok: false, cities: CITIES }))
      .toBe('Hola, vi su página de alquiler de carros en Cali y quiero saber los requisitos')
  })

  it('keeps the generic message', () => {
    expect(buildWaContactMessage({ pathname: '/blog/x', fromTikTok: false, cities: CITIES }))
      .toBe('Hola, vi su página de alquiler de carros y quiero saber los requisitos')
  })

  it('does not flag Google or direct visitors as TikTok', () => {
    expect(isTikTokVisitor('/cali', { utm_source: 'google', gclid: 'x' })).toBe(false)
    expect(isTikTokVisitor('/', null)).toBe(false)
  })
})

describe('SCEN-004: the click rewrite uses the TikTok check', () => {
  it('the plugin reads the stored attribution and passes it through the helper', () => {
    const plugin = readFileSync(join(__dirname, '..', 'app/plugins/wa-message.client.ts'), 'utf-8')
    expect(plugin).toMatch(/readStoredAttribution\(\)/)
    expect(plugin).toMatch(/isTikTokVisitor\(/)
    expect(plugin).toMatch(/buildWaContactMessage\(/)
  })
})
