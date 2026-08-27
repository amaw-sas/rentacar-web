import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Mismo hallazgo de la revision en navegador que en alquilatucarro, en otra marca: el subtitulo
// "Consulta disponibilidad y precios. Elige ciudad, fechas y horarios..." quedaba al lado de
// "no estamos alquilando en Pereira".

const src = readFileSync(
  resolve(process.cwd().endsWith('ui-alquicarros') ? process.cwd() : resolve(process.cwd(), 'packages/ui-alquicarros'), 'app/components/city/Hero.vue'),
  'utf8',
)

describe('city/Hero — aviso de ciudad sin servicio', () => {
  it('el subtitulo que invita a consultar disponibilidad se va con el motor', () => {
    expect(src).toMatch(/v-if="cityIsBookable"[\s\S]{0,200}Consulta disponibilidad y precios/)
  })

  it('el aviso reemplaza tanto el buscador como el CTA "Reservar ahora"', () => {
    expect(src.split(/<CityNoService/).length - 1).toBe(2)
  })

  it('conserva el contrato de modo que fija Hero.test.ts', () => {
    expect(src).toMatch(/v-if="mode === 'results'"/)
  })

  it('importa isBookable explicitamente', () => {
    expect(src).toMatch(/import \{ isBookable \} from '@rentacar-main\/logic\/utils'/)
  })
})
