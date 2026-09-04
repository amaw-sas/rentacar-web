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

export type ContactFormType = 'quejas' | 'flota' | 'referidos' | 'resenas'

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
  /** Sólo quejas y reseñas: número de reserva, opcional. */
  reserva?: string
  /**
   * Sólo reseñas: la calificación que dio el cliente, ya formateada ("2 de 5").
   * La pone la página, no un campo del formulario. Llega del cliente y es
   * falsificable; da igual, es una notificación interna, no una métrica.
   */
  estrellas?: string
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
  estrellas: 'Calificación',
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
  // Reseñas de 1-3★ que llegan de /opinion. Mismos mínimos que una queja: hay
  // que saber quién es y poder responderle. `estrellas` NO se exige — la pone
  // la página, y si algún día llegara sin ella el correo debe salir igual: un
  // cliente molesto perdido pesa más que un asunto incompleto.
  resenas: ['nombre', 'email', 'mensaje'],
}

const SUBJECT: Record<ContactFormType, string> = {
  quejas: 'Nueva queja o reclamo',
  flota: 'Nueva solicitud de convenio',
  referidos: 'Nuevo registro al programa de referidos',
  resenas: 'Calificación baja de un cliente',
}

/** Orden de presentación en el correo; omite lo que no aplique al formulario. */
const FIELD_ORDER = [
  // La calificación va primero porque es lo que decide si el operador abre el
  // correo ya o después.
  'estrellas',
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

/**
 * El cuerpo del correo es una línea "Etiqueta: valor" por campo. Un salto de
 * línea dentro de un campo de una sola línea fabrica una línea etiquetada
 * falsa ("Ana\nMensaje: todo perfecto"), así que se aplana todo menos los
 * campos que de verdad son multilínea.
 */
const oneLine = (v: unknown): string => clean(v).replace(/[\r\n\u2028\u2029]+/g, ' ')

/** Único campo donde los saltos de línea son del usuario y hay que respetarlos. */
const MULTILINE = new Set(['mensaje'])

/**
 * El asunto lo compone un dato que escribe quien envía el formulario. Sin tope,
 * un nombre de kilobytes viaja entero a la cabecera Subject.
 */
const SUBJECT_NAME_MAX = 120

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
  if (Array.isArray(v)) return `${LABELS[field]}: ${v.filter((x) => clean(x)).map(oneLine).join(', ')}`
  if (typeof v === 'boolean') return `${LABELS[field]}: sí`
  return `${LABELS[field]}: ${MULTILINE.has(field) ? clean(v) : oneLine(v)}`
}

/** Campos que sólo tienen sentido en un formulario concreto. */
const FIELD_OWNER: Record<string, ContactFormType> = {
  // `estrellas` la pone /opinion. Si llega en una queja, un convenio o un
  // referido es alguien posteando a mano, y como va PRIMERA en el cuerpo le
  // regalaría la línea de apertura del correo a quien la mande.
  estrellas: 'resenas',
}

export function validateAndCompose(raw: ContactFormPayload): ValidationResult {
  // Honeypot: descartar en silencio.
  if (clean(raw.website)) return { ok: false, reason: 'spam' }

  const type = raw.type
  // `in` recorre la cadena de prototipos: con `type: 'constructor'` la guarda
  // pasaba y reventaba abajo en `.filter` con un 500 en vez de un 400.
  if (!Object.hasOwn(REQUIRED, type as string)) {
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

  const lines = FIELD_ORDER.filter((f) => (FIELD_OWNER[f] ?? type) === type)
    .map((f) => render(f, raw[f as keyof ContactFormPayload]))
    .filter(Boolean)

  // En convenios el asunto identifica al NEGOCIO, que es lo que se va a evaluar;
  // en los demás, a la persona.
  const quien = (type === 'flota' ? oneLine(raw.negocio) : oneLine(raw.nombre)).slice(
    0,
    SUBJECT_NAME_MAX,
  )

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
