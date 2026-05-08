import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// SCEN: card "categoría no disponible" debe mostrar un banner rojo con la razón
// concreta derivada del input del searcher. Este composable provee el texto.
// Cubre formato día-mes (mismo mes, cross-month, cross-year), capitalización
// de ciudad y fallbacks cuando falta date o location.

const ADMIN_PAYLOAD = {
  categories: [],
  branches: [
    {
      id: 1,
      code: 'AABOT',
      name: 'Bogotá Aeropuerto',
      city: 'bogota',
      slug: 'bogota-aeropuerto',
      schedule: '',
    },
  ],
  extras: undefined,
  vehicleCategories: {},
}

describe('useUnavailabilityContext', () => {
  beforeEach(() => {
    vi.stubGlobal('useState', () => ref(ADMIN_PAYLOAD))
    vi.stubGlobal('useToast', () => ({ add: vi.fn(), clear: vi.fn() }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('dateRangeLabel', () => {
    it('formato compacto cuando pickup y return están en el mismo mes', async () => {
      const { default: useStoreReservationForm } = await import('../../stores/useStoreReservationForm')
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = '2026-05-12'
      formStore.fechaDevolucion = '2026-05-15'

      const { default: useUnavailabilityContext } = await import('../useUnavailabilityContext')
      const { dateRangeLabel } = useUnavailabilityContext()

      expect(dateRangeLabel.value).toBe('12-15 mayo')
    })

    it('cross-month mismo año usa formato corto separado por " - "', async () => {
      const { default: useStoreReservationForm } = await import('../../stores/useStoreReservationForm')
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = '2026-04-30'
      formStore.fechaDevolucion = '2026-05-02'

      const { default: useUnavailabilityContext } = await import('../useUnavailabilityContext')
      const { dateRangeLabel } = useUnavailabilityContext()

      expect(dateRangeLabel.value).toBe('30 abr - 2 may')
    })

    it('cross-year incluye año en ambos lados', async () => {
      const { default: useStoreReservationForm } = await import('../../stores/useStoreReservationForm')
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = '2026-12-30'
      formStore.fechaDevolucion = '2027-01-02'

      const { default: useUnavailabilityContext } = await import('../useUnavailabilityContext')
      const { dateRangeLabel } = useUnavailabilityContext()

      expect(dateRangeLabel.value).toBe('30 dic 2026 - 2 ene 2027')
    })

    it('retorna string vacío cuando fechaRecogida es null', async () => {
      const { default: useStoreReservationForm } = await import('../../stores/useStoreReservationForm')
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = null
      formStore.fechaDevolucion = '2026-05-15'

      const { default: useUnavailabilityContext } = await import('../useUnavailabilityContext')
      const { dateRangeLabel } = useUnavailabilityContext()

      expect(dateRangeLabel.value).toBe('')
    })
  })

  describe('locationLabel', () => {
    it('formato "{ciudad} · {nombre sucursal}" con city capitalizada', async () => {
      const { default: useStoreReservationForm } = await import('../../stores/useStoreReservationForm')
      const formStore = useStoreReservationForm()
      formStore.lugarRecogida = 'AABOT'

      const { default: useUnavailabilityContext } = await import('../useUnavailabilityContext')
      const { locationLabel } = useUnavailabilityContext()

      expect(locationLabel.value).toBe('Bogotá · Bogotá Aeropuerto')
    })

    it('retorna string vacío cuando lugarRecogida es null', async () => {
      const { default: useStoreReservationForm } = await import('../../stores/useStoreReservationForm')
      const formStore = useStoreReservationForm()
      formStore.lugarRecogida = null

      const { default: useUnavailabilityContext } = await import('../useUnavailabilityContext')
      const { locationLabel } = useUnavailabilityContext()

      expect(locationLabel.value).toBe('')
    })
  })

  describe('bannerText', () => {
    it('compone "No disponible para el {range} en {location}" cuando todo está presente', async () => {
      const { default: useStoreReservationForm } = await import('../../stores/useStoreReservationForm')
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = '2026-05-12'
      formStore.fechaDevolucion = '2026-05-15'
      formStore.lugarRecogida = 'AABOT'

      const { default: useUnavailabilityContext } = await import('../useUnavailabilityContext')
      const { bannerText } = useUnavailabilityContext()

      expect(bannerText.value).toBe(
        'No disponible para el 12-15 mayo en Bogotá · Bogotá Aeropuerto',
      )
    })

    it('fallback genérico cuando falta location', async () => {
      const { default: useStoreReservationForm } = await import('../../stores/useStoreReservationForm')
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = '2026-05-12'
      formStore.fechaDevolucion = '2026-05-15'
      formStore.lugarRecogida = null

      const { default: useUnavailabilityContext } = await import('../useUnavailabilityContext')
      const { bannerText } = useUnavailabilityContext()

      expect(bannerText.value).toBe('No disponible para tu búsqueda')
    })

    it('fallback genérico cuando faltan fechas', async () => {
      const { default: useStoreReservationForm } = await import('../../stores/useStoreReservationForm')
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = null
      formStore.fechaDevolucion = null
      formStore.lugarRecogida = 'AABOT'

      const { default: useUnavailabilityContext } = await import('../useUnavailabilityContext')
      const { bannerText } = useUnavailabilityContext()

      expect(bannerText.value).toBe('No disponible para tu búsqueda')
    })
  })
})
