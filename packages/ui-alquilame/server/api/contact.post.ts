import { defineEventHandler, readBody, createError } from 'h3'
import { validateAndCompose, type ContactFormPayload } from '../utils/contact-forms'

/**
 * Recepción de los formularios públicos (quejas y reclamos, registro de flota)
 * y envío por correo al buzón del operador.
 *
 * Se usa la API REST de Resend con `fetch` en vez del SDK: es una sola llamada
 * HTTP y así no se suma una dependencia al bundle del servidor.
 *
 * Fail-loud a propósito: si falta RESEND_API_KEY el endpoint devuelve 500 con un
 * mensaje explícito. Un formulario que "parece" enviar pero se traga los mensajes
 * es peor que uno que falla visiblemente — el operador perdería clientes sin
 * enterarse.
 */
const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const SEND_TIMEOUT_MS = 10_000

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey as string | undefined
  const to = config.contactEmailTo as string | undefined
  const from = config.contactEmailFrom as string | undefined

  const body = await readBody<ContactFormPayload>(event)
  const result = validateAndCompose(body ?? ({} as ContactFormPayload))

  // Spam (honeypot): responder 200 como si nada. Darle un error al bot sólo le
  // enseña a evadir el filtro.
  if (!result.ok && result.reason === 'spam') return { ok: true }

  if (!result.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Faltan campos obligatorios',
      data: { missing: result.missing },
    })
  }

  if (!apiKey || !to || !from) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'Falta configuración de correo (NUXT_RESEND_API_KEY / NUXT_CONTACT_EMAIL_TO / NUXT_CONTACT_EMAIL_FROM)',
    })
  }

  try {
    await $fetch<unknown>(RESEND_ENDPOINT, {
      method: 'POST',
      timeout: SEND_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        from,
        to: [to],
        subject: result.email.subject,
        text: result.email.text,
        ...(result.email.replyTo ? { reply_to: result.email.replyTo } : {}),
      },
    })
  } catch {
    // No se filtra el detalle del proveedor al cliente; en el servidor sí queda
    // el stack por el error-handler del proyecto.
    throw createError({
      statusCode: 502,
      statusMessage: 'No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.',
    })
  }

  return { ok: true }
})
