import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// SCEN: card "categoría no disponible" debe mostrar un banner rojo con la razón
// concreta derivada del input del searcher. Este composable provee el texto.
// Cubre formato día-mes (mismo mes, cross-month, cross-year), capitalización
// de ciudad y fallbacks cuando falta date o location.
//
// Imports estáticos al top-level: el patrón anterior (`await import(...)` por
// test) interactuaba mal con `vi.stubGlobal('useState', ...)` y el module cache
// compartido cuando este archivo corría en paralelo con otros que stubean los
// mismos globales (useStoreReservationForm queda cacheado con un Pinia que ya
// fue desactivado, y termina como `undefined` en runs concurrentes). Pinia se
// reinicializa en `beforeEach` con `setActivePinia(createPinia())`, suficiente
// para aislar el estado de cada test sin tocar el module cache.
import useStoreReservationForm from '../../stores/useStoreReservationForm'
import useUnavailabilityContext from '../useUnavailabilityContext'

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
    {
      id: 2,
      code: 'POBLADO',
      name: 'El Poblado',
      city: 'el-poblado',
      slug: 'el-poblado',
      schedule: '',
    },
    {
      id: 3,
      code: 'BLANK',
      name: 'Sucursal Centro',
      city: '   ',
      slug: 'centro',
      schedule: '',
    },
    {
      id: 4,
      code: 'UNTRIM',
      name: 'Sucursal Norte',
      city: '  bogota ',
      slug: 'norte',
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
    it('formato compacto cuando pickup y return están en el mismo mes', () => {
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = '2026-05-12'
      formStore.fechaDevolucion = '2026-05-15'

      const { dateRangeLabel } = useUnavailabilityContext()

      expect(dateRangeLabel.value).toBe('12-15 mayo')
    })

    it('mismo día recogida=devolución muestra una sola fecha, no "12-12" (#31)', () => {
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = '2026-05-12'
      formStore.fechaDevolucion = '2026-05-12'

      const { dateRangeLabel } = useUnavailabilityContext()

      expect(dateRangeLabel.value).toBe('12 mayo')
    })

    it('cross-month mismo año usa formato corto separado por " - "', () => {
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = '2026-04-30'
      formStore.fechaDevolucion = '2026-05-02'

      const { dateRangeLabel } = useUnavailabilityContext()

      expect(dateRangeLabel.value).toBe('30 abr - 2 may')
    })

    it('cross-year incluye año en ambos lados', () => {
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = '2026-12-30'
      formStore.fechaDevolucion = '2027-01-02'

      const { dateRangeLabel } = useUnavailabilityContext()

      expect(dateRangeLabel.value).toBe('30 dic 2026 - 2 ene 2027')
    })

    it('retorna string vacío cuando fechaRecogida es null', () => {
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = null
      formStore.fechaDevolucion = '2026-05-15'

      const { dateRangeLabel } = useUnavailabilityContext()

      expect(dateRangeLabel.value).toBe('')
    })
  })

  describe('locationLabel', () => {
    it('cuando el nombre de sucursal ya empieza con la ciudad, no la duplica', () => {
      const formStore = useStoreReservationForm()
      formStore.lugarRecogida = 'AABOT'

      const { locationLabel } = useUnavailabilityContext()

      // 'Bogotá Aeropuerto' ya lleva la ciudad → sin prefijo redundante.
      expect(locationLabel.value).toBe('Bogotá Aeropuerto')
    })

    it('slug de ciudad con guión cuyo nombre ya lo incluye no se duplica (#30)', () => {
      const formStore = useStoreReservationForm()
      formStore.lugarRecogida = 'POBLADO'

      const { locationLabel } = useUnavailabilityContext()

      expect(locationLabel.value).toBe('El Poblado')
    })

    it('city solo-whitespace cae al nombre de la sucursal, sin separador malformado (#32)', () => {
      const formStore = useStoreReservationForm()
      formStore.lugarRecogida = 'BLANK'

      const { locationLabel } = useUnavailabilityContext()

      expect(locationLabel.value).toBe('Sucursal Centro')
    })

    it('nombre suffix-only conserva el contexto de ciudad: "Bogotá · Sucursal Norte" (#32)', () => {
      const formStore = useStoreReservationForm()
      formStore.lugarRecogida = 'UNTRIM'

      const { locationLabel } = useUnavailabilityContext()

      // 'Sucursal Norte' NO empieza con la ciudad → se conserva el prefijo.
      expect(locationLabel.value).toBe('Bogotá · Sucursal Norte')
    })

    it('retorna string vacío cuando lugarRecogida es null', () => {
      const formStore = useStoreReservationForm()
      formStore.lugarRecogida = null

      const { locationLabel } = useUnavailabilityContext()

      expect(locationLabel.value).toBe('')
    })
  })

  describe('bannerText', () => {
    it('compone "No disponible para el {range} en {location}" cuando todo está presente', () => {
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = '2026-05-12'
      formStore.fechaDevolucion = '2026-05-15'
      formStore.lugarRecogida = 'AABOT'

      const { bannerText, isSpecific } = useUnavailabilityContext()

      expect(bannerText.value).toBe(
        'No disponible para el 12-15 mayo en Bogotá Aeropuerto',
      )
      expect(isSpecific.value).toBe(true)
    })

    it('fallback genérico cuando falta location', () => {
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = '2026-05-12'
      formStore.fechaDevolucion = '2026-05-15'
      formStore.lugarRecogida = null

      const { bannerText, isSpecific } = useUnavailabilityContext()

      expect(bannerText.value).toBe('No disponible para tu búsqueda')
      expect(isSpecific.value).toBe(false)
    })

    it('fallback genérico cuando faltan fechas', () => {
      const formStore = useStoreReservationForm()
      formStore.fechaRecogida = null
      formStore.fechaDevolucion = null
      formStore.lugarRecogida = 'AABOT'

      const { bannerText, isSpecific } = useUnavailabilityContext()

      expect(bannerText.value).toBe('No disponible para tu búsqueda')
      expect(isSpecific.value).toBe(false)
    })
  })
})
