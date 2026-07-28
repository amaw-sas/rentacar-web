/**
 * Lógica pura de los formularios públicos.
 *
 * Vive separada del handler HTTP a propósito: validar y componer el correo no
 * necesita red, así que se puede probar de forma determinista. El handler sólo
 * orquesta (leer body -> validar -> enviar).
 *
 * Antispam: campo honeypot (`website`). Los bots rellenan todo; una persona
 * nunca lo ve. Si viene con contenido, se descarta SIN error para no darle al
 * bot señal de que fue detectado.
 */

export type ContactFormType = 'quejas' | 'flota' | 'referidos'

export interface ContactFormPayload {
  type: ContactFormType
  /** Sólo convenios: razón social / nombre comercial del aliado. */
  negocio?: string
  nombre?: string
  email?: string
  telefono?: string
  ciudad?: string
  /** Sólo convenios: ciudad o zona donde opera el negocio. */
  ubicacion?: string
  /** Sólo quejas: número de reserva, opcional. */
  reserva?: string
  /** Cuántos vehículos tiene la flota. */
  vehiculos?: string
  /** Sólo convenios: tipos de vehículo (selección múltiple). */
  tipos?: string[]
  /** Sólo convenios: compromiso de paridad de precios. Debe venir en true. */
  compromiso?: boolean
  mensaje?: string
  /** Honeypot — debe llegar vacío. */
  website?: string
}

export interface ComposedEmail {
  subject: string
  text: string
  replyTo?: string
}

export type ValidationResult =
  | { ok: true; email: ComposedEmail }
  | { ok: false; reason: 'spam' }
  | { ok: false; reason: 'invalid'; missing: string[] }

const LABELS: Record<string, string> = {
  negocio: 'Negocio',
  nombre: 'Nombre',
  email: 'Correo',
  telefono: 'Teléfono',
  ciudad: 'Ciudad',
  ubicacion: 'Ubicación del negocio',
  reserva: 'Número de reserva',
  vehiculos: 'Cantidad de vehículos',
  tipos: 'Tipos de vehículo',
  compromiso: 'Acepta paridad de precios',
  mensaje: 'Mensaje',
}

/** Campos obligatorios por formulario. El resto son opcionales. */
const REQUIRED: Record<ContactFormType, string[]> = {
  quejas: ['nombre', 'email', 'mensaje'],
  // Convenios con rentadoras: lo mínimo para dimensionar el negocio y llamarlo.
  // `compromiso` es la condición de entrada (mismos precios que publica), así que
  // se valida como obligatorio igual que los demás.
  flota: ['negocio', 'nombre', 'telefono', 'ubicacion', 'vehiculos', 'tipos', 'compromiso'],
  // Referidos: hace falta correo Y teléfono porque hay que entregarle su enlace
  // único y poder ubicarlo para pagarle la comisión.
  referidos: ['nombre', 'email', 'telefono'],
}

const SUBJECT: Record<ContactFormType, string> = {
  quejas: 'Nueva queja o reclamo',
  flota: 'Nueva solicitud de convenio',
  referidos: 'Nuevo registro al programa de referidos',
}

/** Orden de presentación en el correo; omite lo que no aplique al formulario. */
const FIELD_ORDER = [
  'negocio',
  'nombre',
  'telefono',
  'email',
  'ubicacion',
  'ciudad',
  'reserva',
  'vehiculos',
  'tipos',
  'compromiso',
  'mensaje',
]

const clean = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/** Un campo "tiene valor" según su forma: texto, lista o casilla marcada. */
function hasValue(v: unknown): boolean {
  if (Array.isArray(v)) return v.filter((x) => clean(x)).length > 0
  if (typeof v === 'boolean') return v === true
  return Boolean(clean(v))
}

/** Renderiza un campo para el cuerpo del correo, o '' si no aplica. */
function render(field: string, v: unknown): string {
  if (!hasValue(v)) return ''
  if (Array.isArray(v)) return `${LABELS[field]}: ${v.filter((x) => clean(x)).join(', ')}`
  if (typeof v === 'boolean') return `${LABELS[field]}: sí`
  return `${LABELS[field]}: ${clean(v)}`
}

export function validateAndCompose(raw: ContactFormPayload): ValidationResult {
  // Honeypot: descartar en silencio.
  if (clean(raw.website)) return { ok: false, reason: 'spam' }

  const type = raw.type
  if (!(type in REQUIRED)) {
    return { ok: false, reason: 'invalid', missing: ['type'] }
  }

  const missing = REQUIRED[type].filter(
    (f) => !hasValue(raw[f as keyof ContactFormPayload]),
  )
  // El correo, cuando es obligatorio o cuando viene, debe ser un correo real:
  // si no, no hay forma de responderle a la persona.
  const email = clean(raw.email)
  if (email && !isEmail(email) && !missing.includes('email')) missing.push('email')

  if (missing.length) return { ok: false, reason: 'invalid', missing }

  const lines = FIELD_ORDER.map((f) =>
    render(f, raw[f as keyof ContactFormPayload]),
  ).filter(Boolean)

  // En convenios el asunto identifica al NEGOCIO, que es lo que se va a evaluar;
  // en los demás, a la persona.
  const quien = type === 'flota' ? clean(raw.negocio) : clean(raw.nombre)

  return {
    ok: true,
    email: {
      subject: `${SUBJECT[type]} — ${quien}`,
      text: lines.join('\n'),
      // Permite responder directo a quien escribió desde el cliente de correo.
      replyTo: email && isEmail(email) ? email : undefined,
    },
  }
}
