// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'

import NoService from '../NoService.vue'

// SCEN-008 — la pagina de una ciudad que dejamos de alquilar lo explica y ofrece a donde ir.
//
// El texto es literal del diseno §3, aprobado por directiva. Estos asserts existen para que un
// futuro "mejoremos el copy" tenga que pasar por la aprobacion otra vez: el "por ahora" deja
// abierto el regreso sin comprometer fecha, y el aviso no promete stock en las cercanas — invita
// a buscar, que no es lo mismo que afirmar que hay carros.

const PEREIRA_NEARBY = [
  { id: 'armenia', name: 'Armenia', distance: '30 minutos' },
  { id: 'manizales', name: 'Manizales', distance: '45 minutos' },
]

const stubs = { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } }

function render(nearby = PEREIRA_NEARBY, cityName = 'Pereira') {
  return mount(NoService, { props: { cityName, nearby }, global: { stubs } })
}

describe('CityNoService — aviso de ciudad sin servicio', () => {
  it('usa el titulo aprobado, con el nombre de la ciudad', () => {
    expect(render().text()).toContain('Por ahora no estamos alquilando en Pereira')
  })

  it('nombra las dos sedes mas cercanas con su tiempo en carro', () => {
    const text = render().text()
    expect(text).toContain('No tenemos carros disponibles en esta ciudad.')
    expect(text).toContain('Armenia, a 30 minutos')
    expect(text).toContain('Manizales, a 45 minutos')
  })

  it('ofrece un boton de busqueda por cada ciudad cercana, enlazado a su pagina', () => {
    const links = render().findAll('a')
    expect(links).toHaveLength(2)
    expect(links[0].text()).toBe('Buscar carros en Armenia')
    expect(links[0].attributes('href')).toBe('/armenia')
    expect(links[1].attributes('href')).toBe('/manizales')
  })

  // Sin salida que ofrecer, callar es mejor que inventar una.
  it('sin cercanas reservables deja solo el titulo, sin parrafo ni botones', () => {
    const w = render([])
    expect(w.text()).toContain('Por ahora no estamos alquilando en Pereira')
    expect(w.text()).not.toContain('No tenemos carros disponibles')
    expect(w.findAll('a')).toHaveLength(0)
  })

  // La copy aprobada esta escrita en plural. Con una sola cercana, el plural mentiria sobre lo
  // que viene detras, asi que la frase concuerda en vez de dejar un hueco o inventar una segunda.
  it('con una sola cercana usa el singular', () => {
    const text = render([PEREIRA_NEARBY[0]]).text()
    expect(text).toContain('La sede más cercana está en Armenia, a 30 minutos.')
    expect(text).not.toContain('Las sedes más cercanas')
  })

  it('no se disculpa ni explica el motivo — el incidente no es asunto del cliente', () => {
    const text = render().text().toLowerCase()
    for (const forbidden of ['disculpa', 'lamentamos', 'perdón', 'perdon', 'localiza']) {
      expect(text).not.toContain(forbidden)
    }
  })

  it('no promete stock en las cercanas: invita a buscar', () => {
    const text = render().text().toLowerCase()
    expect(text).toContain('buscar carros en')
    expect(text).not.toMatch(/hay carros disponibles en/)
  })
})

describe('CityNoService — invariantes de marca', () => {
  const src = readFileSync(resolve(__dirname, '../NoService.vue'), 'utf8')

  it('no se pinta dentro de ClientOnly: una arana tiene que leerlo en el HTML servido', () => {
    expect(src).not.toMatch(/ClientOnly/)
  })

  it('no mete noindex ni nada que saque la pagina del indice', () => {
    expect(src).not.toMatch(/noindex/i)
  })
})
