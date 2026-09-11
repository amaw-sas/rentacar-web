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
   * Sólo quejas: qué es (petición / queja / reclamo / sugerencia). Se llama `pqrs_type`
   * y NO `type` porque el cuerpo se compone como `{ type: props.type, ...values }` en
   * PublicContactForm: un campo llamado `type` pisaría el discriminante y la queja
   * dejaría de enrutarse.
   */
  pqrs_type?: string
  /** Sólo quejas: autorización de tratamiento de datos. Debe venir en true. */
  consentimiento?: boolean
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
  | { ok: false; reason: 'too-long'; tooLong: string[] }

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
  pqrs_type: 'Tipo de PQRS',
  consentimiento: 'Autoriza el tratamiento de datos',
  mensaje: 'Mensaje',
}

/** Campos obligatorios por formulario. El resto son opcionales. */
const REQUIRED: Record<ContactFormType, string[]> = {
  // `pqrs_type` y `consentimiento` NO se exigen aquí, y es deliberado: esta ruta es la
  // del correo, y rechazar una queja porque le falta el campo que la clasifica es
  // justo el fallo que el módulo PQRS viene a evitar. La validación estricta vive en
  // el endpoint del dashboard, que es donde se radica: allí el schema zod exige el
  // consentimiento y un tipo de la lista. Aquí, si vienen, salen en el correo.
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
  // Al final a propósito. `contact-forms.test.ts:250` fija la PRIMERA LÍNEA exacta de
  // quejas, flota y referidos, y nació porque `estrellas` se coló al frente de esta
  // lista. Los campos nuevos no desplazan nada de lo que ya se leía arriba.
  'pqrs_type',
  'consentimiento',
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

/**
 * Largo máximo por campo. Vive AQUÍ, en el servidor, porque el `maxlength` del
 * formulario es comodidad para quien escribe, no autoridad: un `curl` no lo ve.
 *
 * Por qué hace falta: /api/contact es público y sin autenticar, y cada envío
 * válido gasta un correo de Resend — la misma cuota por la que salen las
 * confirmaciones de reserva. Sin tope, pegar megabytes en `mensaje` produce un
 * correo de megabytes.
 *
 * Se mide en CARACTERES y no en bytes: 2.000 «ñ» son 4.000 bytes en UTF-8, y
 * medir bytes le cobraría el doble a quien escribe en español.
 *
 * 2.000 en `mensaje` es decisión del dueño: ~350 palabras, de sobra para contar
 * qué pasó con fechas y nombres. `nombre` hereda el tope del asunto del correo
 * y `email` el máximo de la norma.
 */
/** Exportado: el handler lo nombra en el aviso al visitante, y así no se duplica. */
export const MAX_MESSAGE_LEN = 2000

const MAX_LEN: Record<string, number> = {
  mensaje: MAX_MESSAGE_LEN,
  nombre: SUBJECT_NAME_MAX,
  negocio: SUBJECT_NAME_MAX,
  email: 254,
  telefono: 40,
  reserva: 40,
  vehiculos: 40,
  estrellas: 40,
  ciudad: 120,
  ubicacion: 120,
}

/** Tope de la única lista que existe (`tipos`): 8 opciones reales, 20 de margen. */
const MAX_LIST_ITEMS = 20
const MAX_LIST_ITEM_LEN = 60

/**
 * Campos que se pasan de largo, en el orden de `FIELD_ORDER` para que el aviso
 * al visitante siga el orden en que ve el formulario.
 *
 * Devuelve TODOS los que sobran, no el primero: reportar de a uno obliga a
 * enviar, corregir y volver a fallar.
 */
function overLength(raw: ContactFormPayload): string[] {
  return FIELD_ORDER.filter((field) => {
    const value = raw[field as keyof ContactFormPayload]
    if (Array.isArray(value)) {
      return (
        value.length > MAX_LIST_ITEMS
        || value.some((item) => clean(item).length > MAX_LIST_ITEM_LEN)
      )
    }
    const max = MAX_LEN[field]
    // `clean` recorta antes de medir: los espacios de sobra no gastan tope.
    return max !== undefined && clean(value).length > max
  })
}

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
  // Los otros tres formularios no los envían ni deben verlos en su correo.
  pqrs_type: 'quejas',
  consentimiento: 'quejas',
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

  // Después de `missing` a propósito: a quien no puso el correo hay que decirle
  // eso primero. El largo es un problema de segundo orden.
  const tooLong = overLength(raw)
  if (tooLong.length) return { ok: false, reason: 'too-long', tooLong }

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
