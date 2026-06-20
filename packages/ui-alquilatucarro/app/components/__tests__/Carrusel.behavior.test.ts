// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import Carrusel from '../Carrusel.vue'

/**
 * clic-foto-abre-reserva (Alquilatucarro) — verificación de COMPORTAMIENTO.
 * Réplica de la función ya corregida en ui-alquilame: tap/click o Enter/Espacio
 * sobre la foto emiten `select` → goNextStep en el padre. NO se rastrean pointer
 * events (Embla ya suprime el click tras un swipe en captura), evitando el bug
 * que rompía el tap en la primera versión de Alquílame.
 */

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

describe('Carrusel.vue (alquilatucarro) — la foto abre la reserva (runtime)', () => {
  it('un click en la foto emite `select`', async () => {
    const wrapper = mountCarrusel()
    await photo(wrapper).trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('Enter sobre la foto emite `select`', async () => {
    const wrapper = mountCarrusel()
    await photo(wrapper).trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('Espacio sobre la foto emite `select`', async () => {
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
