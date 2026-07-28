// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ReservationConfirmation from '../ReservationConfirmation.vue'
import type { ReservationRecapView } from '~/composables/useReservationRecap'

/**
 * Issue #368 hallazgo 1, Pasos 4-6 — la página de confirmación. El componente es
 * prop-driven (la página async le pasa status/recap/contacto), así que se monta
 * sin Nuxt. Cubre SCEN-01 (recap en el DOM), 02 (degradación), 05 (enlaces),
 * 06/07 (copiar), 08 (unavailable). El contraste (SCEN-09) va en su propio test.
 */

const RECAP: ReservationRecapView = {
  categoryName: 'Compacto',
  total: '$ 150.000',
  pickupDate: '15 de agosto de 2026',
  pickupTime: '12:00 p. m.',
  returnDate: '22 de agosto de 2026',
  returnTime: '12:00 p. m.',
  pickupBranch: 'Bogotá Aeropuerto',
  pickupCity: 'bogota',
  returnBranch: 'Medellín Centro',
  returnCity: 'medellin',
  days: 7,
  insuranceLabel: 'Seguro Total',
  mileageLabel: null,
}

const CONTACT = {
  whatsappUrl: 'https://wa.me/573187703670',
  email: 'alquicarros@gmail.com',
  phone: '+57 318 770 3670',
}

function mountConfirmed(overrides: Record<string, unknown> = {}) {
  return mount(ReservationConfirmation, {
    props: {
      status: 'found',
      reserveCode: 'ABCD1234',
      show: true,
      recap: RECAP,
      ...CONTACT,
      ...overrides,
    },
  })
}

describe('SCEN-368A-01 — el recap pinta los valores exactos', () => {
  it('muestra vehículo, fechas+horas, sedes, días, seguro y total', () => {
    const w = mountConfirmed()
    const recap = w.get('[data-testid="reservation-recap"]')
    const text = recap.text()
    expect(text).toContain('Compacto')
    expect(text).toContain('15 de agosto de 2026')
    expect(text).toContain('12:00 p. m.')
    expect(text).toContain('Bogotá Aeropuerto')
    expect(text).toContain('Medellín Centro')
    expect(text).toContain('7')
    expect(text).toContain('Seguro Total')
    expect(text).toContain('$ 150.000')
    expect(text).not.toContain('undefined')
  })

  it('la variante confirmada lleva role="status"', () => {
    const w = mountConfirmed()
    expect(w.get('[data-reservation-state="confirmed"]').attributes('role')).toBe('status')
  })

  it('etiqueta de km cuando el recap la trae', () => {
    const w = mountConfirmed({ recap: { ...RECAP, mileageLabel: '2.000 km' } })
    expect(w.get('[data-testid="reservation-recap"]').text()).toContain('2.000 km')
  })
})

describe('SCEN-368A-02 — sin recap, la página sigue útil', () => {
  it('show=false → sin bloque recap, pero checklist y enlaces presentes', () => {
    const w = mountConfirmed({ show: false, recap: null })
    expect(w.find('[data-testid="reservation-recap"]').exists()).toBe(false)
    expect(w.text()).not.toContain('undefined')
    // checklist "qué llevar"
    expect(w.text()).toContain('Contar con una tarjeta de crédito')
    // enlaces
    expect(w.find('[data-testid="contact-whatsapp"]').exists()).toBe(true)
  })
})

describe('SCEN-368A-05 — enlaces de contacto reales', () => {
  it('WhatsApp, correo y teléfono con href correctos', () => {
    const w = mountConfirmed()
    expect(w.get('[data-testid="contact-whatsapp"]').attributes('href')).toBe('https://wa.me/573187703670')
    expect(w.get('[data-testid="contact-email"]').attributes('href')).toBe('mailto:alquicarros@gmail.com')
    expect(w.get('[data-testid="contact-phone"]').attributes('href')).toBe('tel:+573187703670')
  })
})

describe('SCEN-368A-06 — copiar el código y anunciarlo', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  })

  it('pulsar copiar escribe el código y anuncia "Código copiado"', async () => {
    const w = mountConfirmed()
    await w.get('[data-testid="copy-code"]').trigger('click')
    await Promise.resolve()
    await w.vm.$nextTick()
    expect((navigator.clipboard.writeText as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('ABCD1234')
    expect(w.get('[data-testid="copy-feedback"]').text()).toContain('Código copiado')
  })
})

describe('SCEN-368A-07 — sin clipboard el botón no rompe', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: undefined })
  })

  it('pulsar copiar sin clipboard no lanza y el código sigue visible', async () => {
    const w = mountConfirmed()
    await expect(w.get('[data-testid="copy-code"]').trigger('click')).resolves.toBeUndefined()
    expect(w.text()).toContain('ABCD1234')
    // sin clipboard no se anuncia copiado
    expect(w.find('[data-testid="copy-feedback"]').exists()).toBe(false)
  })
})

describe('SCEN-368A-08 — el estado "verificando" ofrece una salida', () => {
  it('unavailable: reintento + contacto + role="status"', () => {
    const w = mount(ReservationConfirmation, {
      props: { status: 'unavailable', reserveCode: null, show: false, recap: null, ...CONTACT },
    })
    const container = w.get('[data-reservation-state="unavailable"]')
    expect(container.attributes('role')).toBe('status')
    expect(w.find('[data-testid="retry"]').exists()).toBe(true)
    expect(w.find('[data-testid="contact-whatsapp"]').exists()).toBe(true)
  })
})
