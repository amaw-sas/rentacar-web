import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { RESERVATION_REQUIREMENTS } from '../app/config/reservationRequirements'

/**
 * Issue #368 hallazgo 1, Paso 3 — los requisitos "qué llevar" viven en una sola
 * fuente. Los consume el formulario de reserva Y el checklist de la confirmación;
 * una constante compartida evita que diverjan. El formulario no cambia de
 * comportamiento: sigue mostrando los mismos 3 requisitos.
 */

describe('Paso 3 — requisitos en una sola fuente', () => {
  it('la constante lista los 3 requisitos, textualmente iguales a los del form original', () => {
    expect(RESERVATION_REQUIREMENTS).toEqual([
      'Contar con una tarjeta de crédito',
      'Ser mayor de edad con cédula o pasaporte',
      'Contar con licencia de conducción vigente.',
    ])
  })

  it('ReservationForm los renderiza DESDE la constante, no hardcodeados', () => {
    const form = readFileSync(
      fileURLToPath(new URL('../app/components/ReservationForm.vue', import.meta.url)),
      'utf8',
    )
    expect(form).toMatch(/RESERVATION_REQUIREMENTS/)
    expect(form).toMatch(/v-for="[^"]*RESERVATION_REQUIREMENTS/)
    // El texto ya no está hardcodeado en el <li>
    expect(form).not.toContain('Contar con una tarjeta de crédito')
    // La intro del titular es distinta y se queda
    expect(form).toContain('titular de la tarjeta de crédito')
  })
})
