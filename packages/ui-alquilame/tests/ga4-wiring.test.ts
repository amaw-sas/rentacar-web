import { afterEach, describe, expect, it, vi } from 'vitest'

type GtagCall = [command: string, eventName: string, params: Record<string, unknown>]
type NuxtHook = 'app:mounted' | 'page:finish'

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
})

describe('Alquilame GA4 wiring', () => {
  it('emits one sanitized page view per route through gtag/dataLayer', async () => {
    const reserveCode = 'ALQUILAME-RES-PII-123'
    const referrerCode = 'ALQUILAME-REFERRER-PII-456'
    const route = {
      fullPath: `/reservado/${reserveCode}?email=fake@example.invalid`,
    }
    const location = {
      href: `https://alquilame.co/reservado/${reserveCode}?email=fake@example.invalid#${reserveCode}`,
    }
    const dataLayer: GtagCall[] = []
    const gtag = vi.fn((...args: GtagCall) => dataLayer.push(args))
    const hooks = new Map<NuxtHook, () => void>()

    vi.stubGlobal('window', { dataLayer, gtag, location })
    vi.stubGlobal('document', {
      referrer: `https://alquilame.co/reservado/${referrerCode}?code=${referrerCode}`,
      title: 'Reserva confirmada',
    })
    vi.stubGlobal('useRoute', () => route)
    vi.stubGlobal('useAppConfig', () => ({
      franchise: { shortname: 'alquilame' },
    }))
    vi.stubGlobal('defineNuxtPlugin', (plugin: unknown) => plugin)
    vi.stubGlobal('queueMicrotask', (callback: () => void) => callback())

    const { default: installPageViews } = await import('../app/plugins/page-view.client')
    installPageViews({
      hook(name: NuxtHook, callback: () => void) {
        hooks.set(name, callback)
      },
    } as never)

    hooks.get('app:mounted')?.()
    hooks.get('page:finish')?.()

    route.fullPath = '/bogota'
    location.href = 'https://alquilame.co/bogota'
    hooks.get('page:finish')?.()

    expect(gtag).toHaveBeenCalledTimes(2)
    expect(gtag).toHaveBeenNthCalledWith(1, 'event', 'page_view', {
      brand: 'alquilame',
      page_location: 'https://alquilame.co/reservado/[code]',
      page_title: 'Reserva confirmada',
      page_referrer: 'https://alquilame.co/reservado/[code]',
    })
    expect(gtag).toHaveBeenNthCalledWith(2, 'event', 'page_view', {
      brand: 'alquilame',
      page_location: 'https://alquilame.co/bogota',
      page_title: 'Reserva confirmada',
      page_referrer: 'https://alquilame.co/reservado/[code]',
    })
    expect(dataLayer).toHaveLength(2)
    expect(JSON.stringify(dataLayer)).not.toContain(reserveCode)
    expect(JSON.stringify(dataLayer)).not.toContain(referrerCode)
    expect(JSON.stringify(dataLayer)).not.toContain('fake@example.invalid')
  })
})
