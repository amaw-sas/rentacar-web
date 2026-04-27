import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../CategorySelectionSection.vue', import.meta.url)),
  'utf8',
)

const submitButtonBlock = (() => {
  const start = source.indexOf('>Solicitar reserva')
  const before = source.lastIndexOf('<u-button', start)
  const after = source.indexOf('</u-button>', start) + '</u-button>'.length
  return source.slice(before, after)
})()

describe('CategorySelectionSection — Solicitar reserva button loading state', () => {
  beforeAll(() => {
    expect(submitButtonBlock).toContain('Solicitar reserva')
  })

  it('preserves brand green background during loading (overrides Nuxt UI neutral+solid disabled:bg-inverted)', () => {
    expect(submitButtonBlock).toMatch(/disabled:bg-green-700/)
    expect(submitButtonBlock).toMatch(/aria-disabled:bg-green-700/)
  })

  it('dims the button subtly while loading so users perceive the state', () => {
    expect(submitButtonBlock).toMatch(/disabled:opacity-80/)
    expect(submitButtonBlock).toMatch(/aria-disabled:opacity-80/)
  })

  it('hides the trailing chevron during loading so the label has room on a single line', () => {
    expect(submitButtonBlock).toMatch(/<ChevronRightIcon[^>]*v-if="!isSubmittingForm"[^>]*\/>/)
    expect(submitButtonBlock).toMatch(/cls="size-5"/)
    expect(submitButtonBlock).not.toMatch(/animate-spin/)
  })
})

// Scenarios captured: the "Compartir" capsule in the reservation summary
// slideover offers WhatsApp / Facebook / X / Copy Link, all sourcing the URL
// from getReservationShareUrl(). The user reaches this slideover from a
// landing-city URL (e.g. /bogota/...) but the pickup branch may belong to a
// different city (e.g. armenia-aeropuerto → city "armenia"). The shared URL
// must be anchored to the pickup branch's city, not the landing city.
//
//   S1  getReservationShareUrl reads selectedPickupLocation.value?.city to
//       determine the city slug for the shared URL.
//   S2  The leading [city] segment of route.path is replaced via
//       /^\/[^/]+/ → only the first segment, never deeper (would otherwise
//       collapse /bogota/buscar-vehiculos into /armenia).
//   S3  When selectedPickupLocation is null, fall back to route.path without
//       attempting a replace (no crash on intermediate states).
//   S4  When a category is selected (vehiculo.value), the URL still appends
//       /categoria/[codigo] using the lowercased code (existing behavior).
const shareUrlBlock = (() => {
  const start = source.indexOf('function getReservationShareUrl')
  const end = source.indexOf('\n}', start) + '\n}'.length
  return source.slice(start, end)
})()

describe('CategorySelectionSection — getReservationShareUrl city anchoring', () => {
  beforeAll(() => {
    expect(shareUrlBlock).toContain('getReservationShareUrl')
  })

  it('S1: derives the target city from selectedPickupLocation, not the URL [city] param', () => {
    expect(shareUrlBlock).toMatch(/selectedPickupLocation\.value\?\.city/)
  })

  it('S2: replaces only the first path segment so deeper segments stay intact', () => {
    expect(shareUrlBlock).toMatch(/\/\^\\\/\[\^\/\]\+\//)
    expect(shareUrlBlock).toMatch(/`\/\$\{pickupCity\}`/)
  })

  it('S3: falls back to route.path when there is no pickup location yet', () => {
    expect(shareUrlBlock).toMatch(/pickupCity\s*\?\s*route\.path\.replace[\s\S]*?:\s*route\.path/)
  })

  it('S4: appends /categoria/[codigo] (lowercased) when a category is selected', () => {
    expect(shareUrlBlock).toMatch(/vehiculo\.value\.toLowerCase\(\)/)
    expect(shareUrlBlock).toMatch(/\/categoria\/\$\{vehiculo\.value\.toLowerCase\(\)\}/)
  })
})
