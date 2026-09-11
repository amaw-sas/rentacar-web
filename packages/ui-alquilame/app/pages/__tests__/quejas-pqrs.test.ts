/**
 * Holdout: rentacar-dashboard docs/specs/pqrs-mesa-de-ayuda/scenarios/pqrs.scenarios.md
 * Cubre SCEN-PQRS-023 y 024 en la página, y la decisión de los 7 campos.
 *
 * Se lee el `.vue` como texto, igual que city-index-links.test.ts, porque lo que se
 * juzga aquí es la COMPOSICIÓN de la página: qué campos declara y con qué contrato
 * llama al componente. El comportamiento del formulario ya se ejercita montándolo en
 * app/components/__tests__/public-contact-form-radio.test.ts.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const pagina = readFileSync(join(__dirname, '../quejas-y-reclamos.vue'), 'utf8')

describe('los campos del formulario', () => {
  it('siete campos, cinco de los cuales ya existían', () => {
    const nombres = [...pagina.matchAll(/name:\s*'([a-z_]+)'/g)].map((m) => m[1])
    expect(nombres).toEqual([
      'nombre',
      'email',
      'telefono',
      'reserva',
      'pqrs_type',
      'mensaje',
      'consentimiento',
    ])
  })

  it('el tipo es un radio con las cuatro clases de PQRS', () => {
    const bloque = pagina.slice(pagina.indexOf("name: 'pqrs_type'"))
    expect(bloque).toContain("type: 'radio'")
    for (const opcion of ['Petición', 'Queja', 'Reclamo', 'Sugerencia']) {
      expect(bloque).toContain(opcion)
    }
  })

  it('el campo del tipo NO se llama `type`, que pisaría el discriminante', () => {
    expect(pagina).not.toMatch(/name:\s*'type'/)
  })

  it('el consentimiento es obligatorio y enlaza la política', () => {
    const bloque = pagina.slice(pagina.indexOf("name: 'consentimiento'"))
    expect(bloque).toContain('required: true')
    // Sin el enlace, la casilla pide aceptar algo que no se puede leer.
    expect(pagina).toContain('politica-privacidad')
  })

  it('el texto de la casilla es el mismo que se guarda con la radicación', () => {
    // Si divergen, lo que se enseña como prueba no es lo que la persona leyó.
    expect(pagina).toContain('CONSENT_TEXT')
  })

  it('el teléfono y la reserva siguen siendo opcionales', () => {
    for (const campo of ['telefono', 'reserva']) {
      const bloque = pagina.slice(pagina.indexOf(`name: '${campo}'`), pagina.indexOf(`name: '${campo}'`) + 200)
      expect(bloque, campo).not.toContain('required: true')
    }
  })
})

describe('el acuse muestra el radicado', () => {
  it('SCEN-023: successMessage es una función que usa la respuesta del servidor', () => {
    expect(pagina).toMatch(/success-message="\(/)
    expect(pagina).toContain('radicado')
  })

  it('si no llegara radicado, el acuse no promete un número vacío', () => {
    // El endpoint puede responder sin él en la rama de convivencia; el texto tiene que
    // sostenerse igual.
    const bloque = pagina.slice(pagina.indexOf('success-message'))
    expect(bloque).toMatch(/\?|\|\||radicado\s*\?/)
  })
})

describe('SCEN-024: las salidas alternativas siguen a la vista', () => {
  it('WhatsApp y teléfono se mantienen en la página', () => {
    // Es la mitigación de fallar a la vista: si el dashboard cae, quien no pueda
    // radicar tiene a quién escribir sin buscarlo.
    expect(pagina).toContain('franchise.whatsapp')
    expect(pagina).toContain('franchise.phone')
  })
})
