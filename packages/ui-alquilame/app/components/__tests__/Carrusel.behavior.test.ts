// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import Carrusel from '../Carrusel.vue'

/**
 * clic-foto-abre-reserva — verificación de COMPORTAMIENTO (runtime), no de source.
 * Scenarios: docs/specs/clic-foto-abre-reserva/scenarios/clic-foto-abre-reserva.scenarios.md
 *
 * El bug del PR #199 era exactamente "el handler no emite `select`": el
 * pointer-tracking se anulaba con el `pointercancel` que dispara Embla en un tap
 * normal. Estos tests MONTAN el componente y disparan eventos reales para probar
 * el contrato observable: un click sobre la foto, y Enter/Espacio, emiten
 * `select`. La supresión del click tras un swipe es responsabilidad de Embla
 * (UCarousel) y se valida en e2e (e2e/clic-foto-abre-reserva.spec.ts).
 */

// Stub de UCarousel: renderiza el slot por defecto UNA vez con un item mock,
// reproduciendo el contrato `v-slot="{ item, index }"` sin arrastrar Embla/Nuxt.
const UCarouselStub = defineComponent({
  name: 'UCarousel',
  setup(_, { slots }) {
    return () =>
      h(
        'div',
        slots.default?.({ item: { nombre: 'Aveo', image: '/aveo.jpg' }, index: 0 }),
      )
  },
})

function mountCarrusel() {
  return mount(Carrusel, {
    props: { category: 'C', vehicleModels: [{ nombre: 'Aveo', image: '/aveo.jpg' }] },
    global: {
      stubs: { UCarousel: UCarouselStub, NuxtImg: true },
    },
  })
}

const photo = (wrapper: ReturnType<typeof mountCarrusel>) =>
  wrapper.get('[role="button"][aria-label="Reservar Aveo"]')

describe('Carrusel.vue — la foto abre la reserva (runtime)', () => {
  it('SCEN-001: un click en la foto emite `select`', async () => {
    const wrapper = mountCarrusel()
    await photo(wrapper).trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('SCEN-003: Enter sobre la foto emite `select`', async () => {
    const wrapper = mountCarrusel()
    await photo(wrapper).trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('SCEN-003: Espacio sobre la foto emite `select`', async () => {
    const wrapper = mountCarrusel()
    await photo(wrapper).trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('la foto es un botón accesible enfocable con nombre derivado del modelo', () => {
    const wrapper = mountCarrusel()
    const el = photo(wrapper)
    expect(el.attributes('role')).toBe('button')
    expect(el.attributes('tabindex')).toBe('0')
    expect(el.attributes('aria-label')).toBe('Reservar Aveo')
  })
})
