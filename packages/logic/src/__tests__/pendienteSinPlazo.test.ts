/**
 * Contrato de `/pendiente` en las tres marcas — docs/specs/pendiente-sin-plazo.
 *
 * `/pendiente` es lo que ve el cliente cuando su reserva queda en verificación.
 * Decía "Tiempo estimado: 3 a 5 horas" y "No necesitas hacer nada más". Siete de
 * cada diez reservas se resuelven en menos de dos horas, así que el plazo era
 * hasta conservador — y aun así estaba mal, porque el operador puede tardar días
 * y ese cliente ya había leído horas.
 *
 * Por eso las guardas de aquí no piden una cifra mejor: piden que no haya cifra
 * cerrada y que exista una salida. alquilame ya había quitado el plazo
 * (`SCEN-E4` de su estados-reserva.test.ts) pero no decía cuándo escribir; esta
 * suite cubre a las tres por igual para que no vuelvan a divergir.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO = join(__dirname, '..', '..', '..', '..') // → raíz del monorepo
const BRANDS = ['alquilame', 'alquilatucarro', 'alquicarros'] as const

/** Markup renderizado: sin comentarios y con los espacios colapsados. */
function markup(brand: string): string {
  const source = readFileSync(
    join(REPO, 'packages', `ui-${brand}`, 'app/pages/pendiente.vue'),
    'utf-8',
  )
  return source
    .slice(0, source.indexOf('</template>'))
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
}

/** El source completo, para lo que vive en el <script setup>. */
function source(brand: string): string {
  return readFileSync(
    join(REPO, 'packages', `ui-${brand}`, 'app/pages/pendiente.vue'),
    'utf-8',
  )
}

/**
 * La plantilla TAL CUAL se sirve, con los comentarios dentro.
 *
 * Vue manda los comentarios de plantilla en el HTML. Un comentario que cita la
 * promesa vieja para explicar por qué se fue la deja en la página igual — el
 * cliente no la lee, pero está ahí, y quien raspe el HTML la encuentra. Las
 * guardas en negativo miran esta versión, no la limpia.
 */
function shippedTemplate(brand: string): string {
  const src = source(brand)
  return src.slice(0, src.indexOf('</template>'))
}

const pages = BRANDS.map((b) => [b, markup(b)] as const)
const shipped = BRANDS.map((b) => [b, shippedTemplate(b)] as const)

describe('SCEN-001 — ninguna marca promete un plazo', () => {
  it.each(shipped)('%s: sin "Tiempo estimado" ni "3 a 5 horas", ni en comentarios', (_brand, block) => {
    expect(block).not.toContain('Tiempo estimado')
    expect(block).not.toContain('3 a 5 horas')
  })

  it.each(pages)('%s: sin ninguna otra promesa de plazo cerrado', (_brand, block) => {
    // "entre X y Y horas", "en 24 horas", "máximo 2 días"… El rango honesto usa
    // "a veces" y "puede tomarnos", que no matchean estos patrones.
    expect(block).not.toMatch(/\b(en|entre|máximo|maximo|dentro de)\s+\d+\s*(a\s*\d+\s*)?(horas?|días?|dias?)/i)
  })
})

describe('SCEN-002 — el cliente sabe cuándo escribir', () => {
  it.each(pages)('%s: dice qué hacer si mañana no ha llegado nada', (_brand, block) => {
    expect(block).toContain('Si mañana no has recibido nada')
  })

  it.each(BRANDS.map((b) => [b, source(b)] as const))(
    '%s: y el enlace para hacerlo apunta a franchise.whatsapp',
    (_brand, src) => {
      expect(src).toMatch(/:href="franchise\.whatsapp"/)
    },
  )
})

describe('SCEN-003 — la expectativa reconoce el caso lento', () => {
  it.each(pages)('%s: admite que en temporada alta puede tomar días', (_brand, block) => {
    expect(block).toContain('un par de horas')
    expect(block).toContain('algunos días')
  })
})

describe('SCEN-004 — no se contradice con la salida que ofrece', () => {
  it.each(pages)('%s: no dice "no hagas nada más" y luego pide escribir', (_brand, block) => {
    expect(block).not.toContain('No necesitas hacer nada más')
  })
})

describe('SCEN-005 — sigue sin leerse como una confirmación', () => {
  it.each(pages)('%s: no muestra código de reserva', (_brand, block) => {
    expect(block).not.toMatch(/reserveCode|Código de reserva/i)
  })
})

describe('SCEN-006 — fuera del índice de Google', () => {
  it.each(BRANDS.map((b) => [b, source(b)] as const))(
    '%s: emite robots noindex',
    (_brand, src) => {
      expect(src).toMatch(/noindex/)
    },
  )
})
