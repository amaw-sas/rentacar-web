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
 *
 * Reseñas de /opinion (spec 2026-07-29): SCEN-5, SCEN-6, SCEN-9 y SCEN-10.
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

/**
 * Reseñas de 1-3★ que llegan de /opinion (docs/specs/2026-07-29-alquilame-opinion-design.md).
 * El cliente que califica bajo no va a la ficha de Google: escribe aquí y el
 * correo cae en el buzón del operador.
 */
describe('calificación baja (/opinion)', () => {
  const valido = {
    type: 'resenas' as const,
    estrellas: '2 de 5',
    nombre: 'Ana Ramírez',
    email: 'ana@ejemplo.com',
    telefono: '300 123 4567',
    reserva: 'AV33Y3U5QA',
    mensaje: 'El carro llegó sin gasolina y esperé 40 minutos.',
  }

  it('SCEN-5: el asunto avisa que la calificación fue baja y nombra al cliente', () => {
    const r = validateAndCompose(valido)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.email.subject).toBe('Calificación baja de un cliente — Ana Ramírez')
  })

  it('SCEN-5: la calificación es la PRIMERA línea del cuerpo', () => {
    const r = validateAndCompose(valido)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    // Es lo que decide si el operador abre el correo ya o después: si queda
    // sepultada bajo los datos de contacto, deja de cumplir su función.
    expect(r.email.text.split('\n')[0]).toBe('Calificación: 2 de 5')
    expect(r.email.text).toContain('Número de reserva: AV33Y3U5QA')
    expect(r.email.text).toContain('Mensaje: El carro llegó sin gasolina y esperé 40 minutos.')
  })

  it('SCEN-5: el correo del cliente queda en reply-to', () => {
    const r = validateAndCompose(valido)
    expect(r.ok && r.email.replyTo).toBe('ana@ejemplo.com')
  })

  it('SCEN-6: sin mensaje no se compone nada — el servidor valida igual que el formulario', () => {
    const r = validateAndCompose({ ...valido, mensaje: '' })
    expect(r.ok).toBe(false)
    if (r.ok || r.reason !== 'invalid') return
    expect(r.missing).toContain('mensaje')
  })

  it('SCEN-9: el honeypot lleno se descarta sin componer correo', () => {
    const r = validateAndCompose({ ...valido, website: 'http://spam.example' })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason).toBe('spam')
  })

  it('los saltos de línea de un campo de una sola línea no fabrican líneas falsas', () => {
    // El cuerpo es "Etiqueta: valor" por línea. Con `nombre` multilínea se
    // podía insertar una línea que el operador lee como campo del sistema.
    const r = validateAndCompose({
      ...valido,
      nombre: 'Ana\nCalificación: 5 de 5\nNota interna: caso cerrado',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.email.text.split('\n')).toEqual([
      'Calificación: 2 de 5',
      'Nombre: Ana Calificación: 5 de 5 Nota interna: caso cerrado',
      'Teléfono: 300 123 4567',
      'Correo: ana@ejemplo.com',
      'Número de reserva: AV33Y3U5QA',
      'Mensaje: El carro llegó sin gasolina y esperé 40 minutos.',
    ])
  })

  it('el mensaje SÍ conserva sus saltos de línea: los escribió la persona', () => {
    const r = validateAndCompose({ ...valido, mensaje: 'Primera línea.\nSegunda línea.' })
    expect(r.ok && r.email.text.endsWith('Mensaje: Primera línea.\nSegunda línea.')).toBe(true)
  })

  it('un nombre con salto de línea NO puede colar una cabecera en el asunto', () => {
    // `Bcc:` tras un CRLF es el intento clásico de inyección de cabeceras. El
    // nombre va dentro del tope de largo a propósito: así se prueba el aplanado,
    // que es lo que defiende de verdad, y no el tope, que se prueba aparte.
    const r = validateAndCompose({ ...valido, nombre: 'Ana\r\nBcc: exfiltra@evil.co' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.email.subject).not.toMatch(/[\r\n]/)
    expect(r.email.subject).toContain('Ana Bcc: exfiltra@evil.co')
  })

  it('y un nombre kilométrico ya ni llega a componerse', () => {
    // Antes se recortaba a 120 y se dejaba pasar. Ahora se rechaza de entrada:
    // el tope de largo (MAX_LEN.nombre) corre antes que la composición, así que
    // el asunto nunca ve esos 500 caracteres. Es más estricto, no menos.
    const r = validateAndCompose({ ...valido, nombre: 'x'.repeat(500) })
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('debía rechazar')
    expect(r.reason).toBe('too-long')
    expect(r.tooLong).toEqual(['nombre'])
  })

  it('el recorte del asunto sigue en pie para lo que sí pasa el tope', () => {
    // 120 es a la vez el tope de entrada y el del asunto, así que hoy coinciden.
    // La aserción se queda: si mañana MAX_LEN.nombre sube, esto avisa de que el
    // asunto se puede desbordar.
    const r = validateAndCompose({ ...valido, nombre: 'A'.repeat(120) })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.email.subject.length).toBeLessThanOrEqual('Calificación baja de un cliente — '.length + 120)
  })

  it('sin estrellas el correo sale igual: perder al cliente molesto cuesta más', () => {
    const r = validateAndCompose({ ...valido, estrellas: undefined })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.email.text).not.toContain('Calificación:')
    expect(r.email.text.split('\n')[0]).toBe('Nombre: Ana Ramírez')
  })
})

describe('SCEN-10 — los tres formularios que ya existían no cambian', () => {
  // `estrellas` se coló al frente de FIELD_ORDER. Ningún otro formulario lo
  // envía, así que ninguno debe notarlo: ni en el asunto, ni en el cuerpo, ni
  // en la primera línea (que es lo que se movería si el orden se rompiera).
  it.each([
    [
      'quejas',
      { type: 'quejas' as const, nombre: 'Ana Pérez', email: 'ana@example.com', mensaje: 'El carro llegó sucio.' },
      'Nueva queja o reclamo — Ana Pérez',
      'Nombre: Ana Pérez',
    ],
    [
      'flota',
      {
        type: 'flota' as const,
        negocio: 'Rentacar del Valle',
        nombre: 'Carlos Ruiz',
        telefono: '3009876543',
        ubicacion: 'Medellín y área metropolitana',
        vehiculos: '12',
        tipos: ['Sedán', 'SUV'],
        compromiso: true,
      },
      'Nueva solicitud de convenio — Rentacar del Valle',
      'Negocio: Rentacar del Valle',
    ],
    [
      'referidos',
      { type: 'referidos' as const, nombre: 'Laura Gómez', email: 'laura@example.com', telefono: '3011112222' },
      'Nuevo registro al programa de referidos — Laura Gómez',
      'Nombre: Laura Gómez',
    ],
  ])('%s conserva asunto y primera línea', (_name, payload, subject, firstLine) => {
    const r = validateAndCompose(payload)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.email.subject).toBe(subject)
    expect(r.email.text.split('\n')[0]).toBe(firstLine)
    expect(r.email.text).not.toContain('Calificación')
  })

  it('mandar `estrellas` a mano no le regala la primera línea a nadie', () => {
    // `estrellas` la pone /opinion. En una queja sólo puede venir de un POST
    // fabricado, y como abre el cuerpo, era una línea de correo a la carta.
    const r = validateAndCompose({
      type: 'quejas',
      estrellas: 'IGNORAR ESTE MENSAJE',
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
      mensaje: 'El carro llegó sucio.',
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.email.text).not.toContain('IGNORAR ESTE MENSAJE')
    expect(r.email.text.split('\n')[0]).toBe('Nombre: Ana Pérez')
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

  it.each(['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__'])(
    'un tipo heredado de Object.prototype (%s) se rechaza como cualquier otro',
    (type) => {
      // La guarda usaba `in`, que recorre la cadena de prototipos: estos tipos
      // la pasaban y reventaban abajo en `.filter` con un 500 sin capturar.
      const r = validateAndCompose({ type: type as never, nombre: 'x', email: 'a@b.co', mensaje: 'y' })
      expect(r.ok).toBe(false)
      if (r.ok || r.reason !== 'invalid') return
      expect(r.missing).toContain('type')
    },
  )

  it('los espacios en blanco no cuentan como valor', () => {
    const r = validateAndCompose({ type: 'quejas', nombre: '   ', email: 'a@b.co', mensaje: 'hola' })
    expect(r.ok).toBe(false)
    if (r.ok || r.reason !== 'invalid') return
    expect(r.missing).toContain('nombre')
  })
})

describe('topes de largo — que una biblia pegada en el mensaje no nos afecte', () => {
  /**
   * `/api/contact` es público y sin autenticar: cada POST válido gasta un correo
   * de Resend. Sin tope de largo, pegar megabytes en `mensaje` produce un correo
   * de megabytes. Los máximos viven en el SERVIDOR porque el `maxlength` del
   * formulario es comodidad, no autoridad: un `curl` no lo ve.
   *
   * Se RECHAZA, no se corta. Truncar en silencio se traga las palabras de un
   * cliente que ya está molesto, y encima sin decírselo.
   */
  const base = { type: 'resenas' as const, nombre: 'Ana', email: 'a@b.co' }

  it('2.000 caracteres de mensaje pasan: es el tope, no un caracter menos', () => {
    const r = validateAndCompose({ ...base, mensaje: 'x'.repeat(2000) })
    expect(r.ok).toBe(true)
  })

  it('2.001 se rechazan, y dice cuál campo', () => {
    const r = validateAndCompose({ ...base, mensaje: 'x'.repeat(2001) })
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('debía rechazar')
    expect(r.reason).toBe('too-long')
    expect(r.tooLong).toEqual(['mensaje'])
  })

  it('el nombre también tiene tope: alimenta el asunto del correo', () => {
    const r = validateAndCompose({ ...base, nombre: 'A'.repeat(121), mensaje: 'hola' })
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('debía rechazar')
    expect(r.tooLong).toEqual(['nombre'])
  })

  it('varios campos largos se reportan TODOS, no solo el primero', () => {
    // Devolver uno solo obliga a la persona a enviar, corregir y volver a fallar.
    const r = validateAndCompose({
      ...base,
      nombre: 'A'.repeat(121),
      mensaje: 'x'.repeat(2001),
    })
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('debía rechazar')
    expect(r.tooLong).toEqual(['nombre', 'mensaje'])
  })

  it('el correo largo se rechaza por largo, no por inválido', () => {
    // 254 es el máximo de la norma. Un correo de 300 caracteres es basura.
    const largo = 'a'.repeat(250) + '@ejemplo.com'
    const r = validateAndCompose({ ...base, email: largo, mensaje: 'hola' })
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('debía rechazar')
    expect(r.tooLong).toEqual(['email'])
  })

  it('una lista con demasiados elementos también se corta', () => {
    // `tipos` tiene 8 opciones reales; 21 significa que alguien postea a mano.
    const r = validateAndCompose({
      type: 'flota',
      negocio: 'N',
      nombre: 'Ana',
      telefono: '3001234567',
      ubicacion: 'Cali',
      vehiculos: '10',
      compromiso: true,
      tipos: Array.from({ length: 21 }, (_, i) => `t${i}`),
    })
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('debía rechazar')
    expect(r.tooLong).toEqual(['tipos'])
  })

  it('un elemento gigante dentro de la lista cuenta igual', () => {
    const r = validateAndCompose({
      type: 'flota',
      negocio: 'N',
      nombre: 'Ana',
      telefono: '3001234567',
      ubicacion: 'Cali',
      vehiculos: '10',
      compromiso: true,
      tipos: ['SUV', 'x'.repeat(61)],
    })
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('debía rechazar')
    expect(r.tooLong).toEqual(['tipos'])
  })

  it('el honeypot gana al tope: un bot no merece saber por qué falló', () => {
    // Si el orden fuera al revés, un bot aprendería el tamaño exacto del tope.
    const r = validateAndCompose({ ...base, mensaje: 'x'.repeat(9999), website: 'spam' })
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('debía rechazar')
    expect(r.reason).toBe('spam')
  })

  it('faltar un campo pesa más que pasarse de largo', () => {
    // Quien no puso el correo tiene que saberlo primero; el largo es secundario.
    const r = validateAndCompose({ type: 'resenas', nombre: 'Ana', mensaje: 'x'.repeat(2001) })
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('debía rechazar')
    expect(r.reason).toBe('invalid')
  })

  it('el tope se mide en caracteres, no en bytes: los acentos no roban espacio', () => {
    // 2.000 "ñ" son 4.000 bytes en UTF-8. Medir bytes castigaría al español.
    const r = validateAndCompose({ ...base, mensaje: 'ñ'.repeat(2000) })
    expect(r.ok).toBe(true)
  })

  it('los espacios de sobra no gastan tope', () => {
    // `clean` recorta antes de medir: 2.000 útiles rodeados de espacios pasan.
    const r = validateAndCompose({ ...base, mensaje: '   ' + 'x'.repeat(2000) + '   ' })
    expect(r.ok).toBe(true)
  })
})
