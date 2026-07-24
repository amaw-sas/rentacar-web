/**
 * Formularios públicos: quejas y reclamos + registro de flota.
 *
 *   - SCEN-FORM-01: un envío válido compone asunto y cuerpo con TODOS los campos
 *     diligenciados, en orden legible.
 *   - SCEN-FORM-02: si falta un campo obligatorio, no se compone nada y se
 *     reportan exactamente cuáles faltan (para pintarlos en el formulario).
 *   - SCEN-FORM-03: el honeypot lleno se descarta como spam, SIN error visible.
 *   - SCEN-FORM-04: un correo con formato inválido se rechaza (si no, no hay
 *     forma de responderle a la persona).
 *   - SCEN-FORM-05: el correo de quien escribe queda en reply-to, para poder
 *     responder directo desde el cliente de correo.
 *   - SCEN-FORM-06: los campos opcionales vacíos no ensucian el cuerpo.
 */
import { describe, it, expect } from 'vitest'
import { validateAndCompose } from '../contact-forms'

describe('quejas y reclamos', () => {
  const valido = {
    type: 'quejas' as const,
    nombre: 'Ana Pérez',
    email: 'ana@example.com',
    telefono: '3001234567',
    reserva: 'AV33Y3U5QA',
    mensaje: 'El carro llegó sucio.',
  }

  it('SCEN-FORM-01: compone asunto y cuerpo con los campos diligenciados', () => {
    const r = validateAndCompose(valido)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.email.subject).toBe('Nueva queja o reclamo — Ana Pérez')
    expect(r.email.text).toContain('Nombre: Ana Pérez')
    expect(r.email.text).toContain('Correo: ana@example.com')
    expect(r.email.text).toContain('Número de reserva: AV33Y3U5QA')
    expect(r.email.text).toContain('Mensaje: El carro llegó sucio.')
  })

  it('SCEN-FORM-02: reporta los obligatorios faltantes', () => {
    const r = validateAndCompose({ type: 'quejas', nombre: 'Ana' })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason).toBe('invalid')
    if (r.reason !== 'invalid') return
    expect(r.missing).toEqual(expect.arrayContaining(['email', 'mensaje']))
    expect(r.missing).not.toContain('nombre')
  })

  it('SCEN-FORM-05: deja el correo del remitente en reply-to', () => {
    const r = validateAndCompose(valido)
    expect(r.ok && r.email.replyTo).toBe('ana@example.com')
  })

  it('SCEN-FORM-06: no incluye líneas de campos opcionales vacíos', () => {
    const r = validateAndCompose({ ...valido, reserva: '', telefono: '' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.email.text).not.toContain('Número de reserva')
    expect(r.email.text).not.toContain('Teléfono')
  })
})

/**
 * Convenios con rentadoras (B2B). No es para un particular con un carro: el
 * aliado es un negocio, y la condición de entrada es ofrecer los MISMOS precios
 * que publica en su web o redes, para que el cliente final no pague adicionales.
 */
describe('convenios con rentadoras', () => {
  const valido = {
    type: 'flota' as const,
    negocio: 'Rentacar del Valle',
    nombre: 'Carlos Ruiz',
    telefono: '3009876543',
    ubicacion: 'Medellín y área metropolitana',
    vehiculos: '12',
    tipos: ['Sedán', 'SUV'],
    compromiso: true,
  }

  it('SCEN-FORM-01: el asunto identifica al NEGOCIO, no a la persona', () => {
    const r = validateAndCompose(valido)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.email.subject).toBe('Nueva solicitud de convenio — Rentacar del Valle')
    expect(r.email.text).toContain('Negocio: Rentacar del Valle')
    expect(r.email.text).toContain('Nombre: Carlos Ruiz')
    expect(r.email.text).toContain('Ubicación del negocio: Medellín y área metropolitana')
    expect(r.email.text).toContain('Cantidad de vehículos: 12')
  })

  it('SCEN-FORM-09: los tipos de vehículo llegan como lista legible', () => {
    const r = validateAndCompose(valido)
    expect(r.ok && r.email.text).toContain('Tipos de vehículo: Sedán, SUV')
  })

  it('SCEN-FORM-10: la paridad de precios es condición de entrada — sin marcar, se rechaza', () => {
    const r = validateAndCompose({ ...valido, compromiso: false })
    expect(r.ok).toBe(false)
    if (r.ok || r.reason !== 'invalid') return
    expect(r.missing).toContain('compromiso')
  })

  it('SCEN-FORM-11: una lista de tipos vacía no cuenta como diligenciada', () => {
    const r = validateAndCompose({ ...valido, tipos: [] })
    expect(r.ok).toBe(false)
    if (r.ok || r.reason !== 'invalid') return
    expect(r.missing).toContain('tipos')
  })

  it('SCEN-FORM-02: exige negocio, ubicación, cantidad y tipos', () => {
    const r = validateAndCompose({ type: 'flota', nombre: 'Carlos' })
    expect(r.ok).toBe(false)
    if (r.ok || r.reason !== 'invalid') return
    expect(r.missing).toEqual(
      expect.arrayContaining(['negocio', 'telefono', 'ubicacion', 'vehiculos', 'tipos', 'compromiso']),
    )
  })

  it('el correo es opcional aquí, pero si viene mal se rechaza', () => {
    expect(validateAndCompose(valido).ok).toBe(true)
    const r = validateAndCompose({ ...valido, email: 'no-es-un-correo' })
    expect(r.ok).toBe(false)
    if (r.ok || r.reason !== 'invalid') return
    expect(r.missing).toContain('email')
  })
})

describe('programa de referidos', () => {
  const valido = {
    type: 'referidos' as const,
    nombre: 'Laura Gómez',
    email: 'laura@example.com',
    telefono: '3011112222',
    ciudad: 'Cali',
  }

  it('SCEN-FORM-01: compone el correo de registro al programa', () => {
    const r = validateAndCompose(valido)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.email.subject).toBe('Nuevo registro al programa de referidos — Laura Gómez')
    expect(r.email.text).toContain('Correo: laura@example.com')
    expect(r.email.text).toContain('Teléfono: 3011112222')
  })

  it('SCEN-FORM-02: exige correo Y teléfono (hay que entregar el enlace y pagar la comisión)', () => {
    const r = validateAndCompose({ type: 'referidos', nombre: 'Laura' })
    expect(r.ok).toBe(false)
    if (r.ok || r.reason !== 'invalid') return
    expect(r.missing).toEqual(expect.arrayContaining(['email', 'telefono']))
  })
})

describe('antispam y entradas raras', () => {
  it('SCEN-FORM-03: el honeypot lleno se descarta como spam', () => {
    const r = validateAndCompose({
      type: 'quejas',
      nombre: 'Bot',
      email: 'bot@spam.com',
      mensaje: 'compra ahora',
      website: 'http://spam.example',
    })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason).toBe('spam')
  })

  it('SCEN-FORM-04: un tipo de formulario desconocido se rechaza', () => {
    const r = validateAndCompose({ type: 'otro' as never, nombre: 'x' })
    expect(r.ok).toBe(false)
    if (r.ok || r.reason !== 'invalid') return
    expect(r.missing).toContain('type')
  })

  it('los espacios en blanco no cuentan como valor', () => {
    const r = validateAndCompose({ type: 'quejas', nombre: '   ', email: 'a@b.co', mensaje: 'hola' })
    expect(r.ok).toBe(false)
    if (r.ok || r.reason !== 'invalid') return
    expect(r.missing).toContain('nombre')
  })
})
