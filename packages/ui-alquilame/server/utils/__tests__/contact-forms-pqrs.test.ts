/**
 * Holdout: rentacar-dashboard docs/specs/pqrs-mesa-de-ayuda/scenarios/pqrs.scenarios.md
 * Cubre SCEN-PQRS-027 en la capa de payload: los tres formularios viejos siguen intactos
 * mientras quejas gana campos.
 *
 * `contact-forms.test.ts:250` ya fija el asunto y la PRIMERA LÍNEA exactos de quejas,
 * flota y referidos, y existe porque `estrellas` se coló al frente de FIELD_ORDER una
 * vez. Este fichero añade lo que esa red no cubre: que los campos nuevos se validen y
 * salgan en el correo SIN desplazar nada de lo que ya estaba.
 */
import { describe, it, expect } from 'vitest'
import { validateAndCompose } from '../contact-forms'

const queja = {
  type: 'quejas' as const,
  nombre: 'Ana Pérez',
  email: 'ana@example.com',
  mensaje: 'El carro llegó sucio.',
  pqrs_type: 'Queja',
  consentimiento: true,
}

describe('quejas con los campos de PQRS', () => {
  it('una queja completa compone su correo', () => {
    const r = validateAndCompose(queja)
    expect(r.ok).toBe(true)
  })

  it('el tipo de PQRS sale en el cuerpo', () => {
    const r = validateAndCompose(queja)
    expect(r.ok && r.email.text).toContain('Queja')
  })

  it('sin tipo de PQRS el correo SIGUE saliendo', () => {
    // Esta ruta es la del correo. Rechazar una queja porque le falta el campo que la
    // clasifica sería el fallo que el módulo viene a evitar: la validación estricta
    // vive en el endpoint del dashboard, donde se radica (SCEN-013, cubierto en
    // pqrs-service.test.ts y en el schema zod).
    const { pqrs_type, ...sinTipo } = queja
    const r = validateAndCompose(sinTipo as never)
    expect(r.ok).toBe(true)
  })

  it('sin consentimiento el correo SIGUE saliendo, y no miente diciendo que lo hubo', () => {
    const r = validateAndCompose({ ...queja, consentimiento: false })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    // Un `false` no debe aparecer como si se hubiera autorizado.
    expect(r.email.text).not.toContain('Autoriza el tratamiento de datos: sí')
  })

  it('la primera línea del correo de quejas NO cambia', () => {
    // Es la garantía de contact-forms.test.ts:250, repetida aquí porque los campos
    // nuevos son exactamente el tipo de cambio que la rompería.
    const r = validateAndCompose(queja)
    expect(r.ok && r.email.text.split('\n')[0]).toBe('Nombre: Ana Pérez')
  })

  it('el tipo de PQRS tiene tope, como el resto de campos que llegan al correo', () => {
    // Las etiquetas reales miden 10 caracteres como mucho. Sin tope, un POST a mano mete
    // kilobytes en el cuerpo del correo, que es lo que los topes por campo existen para impedir.
    const r = validateAndCompose({ ...queja, pqrs_type: 'x'.repeat(41) })
    expect(r).toEqual({ ok: false, reason: 'too-long', tooLong: ['pqrs_type'] })
    expect(validateAndCompose({ ...queja, pqrs_type: 'Sugerencia' }).ok).toBe(true)
  })

  it('el asunto de quejas NO cambia', () => {
    const r = validateAndCompose(queja)
    expect(r.ok && r.email.subject).toBe('Nueva queja o reclamo — Ana Pérez')
  })
})

describe('los otros tres formularios no ven los campos nuevos', () => {
  const casos = [
    {
      nombre: 'flota',
      payload: {
        type: 'flota' as const,
        negocio: 'Rentadora X',
        nombre: 'Luis',
        telefono: '3001234567',
        ubicacion: 'Bogotá',
        vehiculos: '12',
        tipos: ['Automóvil'],
        compromiso: true,
      },
      primeraLinea: 'Negocio: Rentadora X',
    },
    {
      nombre: 'referidos',
      payload: {
        type: 'referidos' as const,
        nombre: 'Carla',
        email: 'carla@example.com',
        telefono: '3001234567',
      },
      primeraLinea: 'Nombre: Carla',
    },
    {
      nombre: 'resenas',
      payload: {
        type: 'resenas' as const,
        nombre: 'Diego',
        email: 'diego@example.com',
        mensaje: 'Regular',
        estrellas: '2 de 5',
      },
      primeraLinea: 'Calificación: 2 de 5',
    },
  ]

  for (const c of casos) {
    it(`${c.nombre}: no exige los campos nuevos y su primera línea no se mueve`, () => {
      const r = validateAndCompose(c.payload as never)
      expect(r.ok, `${c.nombre} dejó de validar`).toBe(true)
      if (!r.ok) return
      expect(r.email.text.split('\n')[0]).toBe(c.primeraLinea)
      // Y no aparece rastro de los campos de PQRS en su cuerpo.
      expect(r.email.text).not.toMatch(/Tipo de PQRS|Autoriza/i)
    })
  }
})
