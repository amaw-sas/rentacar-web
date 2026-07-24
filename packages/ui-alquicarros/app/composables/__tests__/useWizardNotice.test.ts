/**
 * Issue #368 B1, paso 6 — el texto de la ranura del aviso.
 *
 * La ranura en sí se prueba montando (`ReservationWizard.mount.test.ts`): lo que se
 * escribe, cuándo, y que no haya borrado. Aquí solo el texto, que es la parte que un
 * mount no distingue bien —el banner existe en los tres casos— y la que el cliente lee.
 *
 * Las tres combinaciones tienen frase propia a propósito. Componerlas pegando etiquetas
 * en una plantilla obliga a un verbo único que sirva para las dos pérdidas, y "no ofrece
 * el plan de kilometraje" no es lo que se quiere decir.
 */
import { describe, it, expect } from 'vitest'

import { noticeMessage } from '../useWizardNotice'

describe('noticeMessage — qué lee el cliente', () => {
  it('sin aviso no hay texto', () => {
    expect(noticeMessage(null)).toBe('')
  })

  it('el reset por búsqueda nueva explica el recálculo y pide elegir otra vez', () => {
    const texto = noticeMessage({ kind: 'search-reset' })

    expect(texto).toContain('Volviste a buscar')
    expect(texto).toContain('Elige el vehículo de nuevo')
  })

  it('perder solo el Seguro Total nombra la pérdida Y con qué se quedó el cliente', () => {
    // Nombrar la pérdida sin decir qué queda deja al cliente buscando el dato.
    const texto = noticeMessage({ kind: 'carry', dropped: ['seguroTotal'] })

    expect(texto).toContain('Seguro Total')
    expect(texto).toContain('Seguro Básico')
    expect(texto).not.toContain('kilometraje')
  })

  it('perder solo el kilometraje no menciona el seguro', () => {
    const texto = noticeMessage({ kind: 'carry', dropped: ['kilometraje'] })

    expect(texto).toContain('kilometraje')
    expect(texto).not.toContain('Seguro')
  })

  it('perder las dos cosas las nombra en una sola frase, sin repetir el sujeto', () => {
    const texto = noticeMessage({ kind: 'carry', dropped: ['seguroTotal', 'kilometraje'] })

    expect(texto).toContain('Seguro Total')
    expect(texto).toContain('kilometraje')
    expect(texto.match(/Este vehículo/g)?.length, 'el sujeto se repite: dos frases pegadas').toBe(1)
  })

  it('un arrastre sin pérdidas no produce texto', () => {
    // La ranura se escribe con `null` en ese caso, pero si algún día llegara un
    // `carry` vacío el banner no puede aparecer en blanco.
    expect(noticeMessage({ kind: 'carry', dropped: [] })).toBe('')
  })
})
