import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ReservationForm.vue', import.meta.url)),
  'utf8',
)

describe('ReservationForm — label contrast on white form background', () => {
  const uFormOpenTag = source.match(/<u-form\b[\s\S]*?>/)

  it('does not apply scheme-dark to the <u-form>', () => {
    expect(uFormOpenTag).not.toBeNull()
    expect(uFormOpenTag![0]).not.toMatch(/\bscheme-dark\b/)
  })

  it('applies class="light" to the <u-form> so Nuxt UI tokens resolve to neutral-700 even when the page uses colorMode dark', () => {
    expect(uFormOpenTag).not.toBeNull()
    expect(uFormOpenTag![0]).toMatch(/class="[^"]*\blight\b[^"]*"/)
  })
})

describe('ReservationForm — Tus datos heading', () => {
  it('uses Plus Jakarta while letting the explicit colour utility win', () => {
    // El color pasó de text-red-700 a text-gray-900 (ver "encabezado sin rojo"
    // más abajo); lo que este test protege es que el título siga usando la
    // fuente de marca por utilidad y no por el token heading-card.
    // Se afirman los atributos, no la cadena literal: el encabezado ganó tamaño
    // y peso al emparejarse con el Resumen, y eso no debe romper este guardián.
    const atributos = source.match(/<h3([^>]*)>Tus datos<\/h3>/)?.[1] ?? ''
    expect(atributos).toMatch(/font-heading/)
    expect(atributos).toMatch(/text-gray-900/)
    expect(source).not.toMatch(/<h3[^>]*\bheading-card\b[^>]*>Tus datos<\/h3>/)
  })
})

/**
 * El paso "Datos" heredaba el rojo de marca en el encabezado de sección: una
 * raya de acento y "Tus datos" en text-red-700. El Resumen ya no usa rojo para
 * texto —lo reserva para la marca— y las dos superficies del mismo slideover
 * deben leerse igual.
 */
describe('ReservationForm — encabezado sin rojo, como el Resumen', () => {
  const fuente = readFileSync(
    fileURLToPath(new URL('../ReservationForm.vue', import.meta.url)),
    'utf8',
  )

  it('"Tus datos" usa la tinta de títulos del Resumen', () => {
    expect(fuente).toMatch(/<h3[^>]*>Tus datos<\/h3>/)
    const titulo = fuente.match(/<h3([^>]*)>Tus datos<\/h3>/)?.[1] ?? ''
    expect(titulo).toMatch(/text-gray-900/)
    expect(titulo).not.toMatch(/text-red-\d{3}/)
  })

  it('la raya roja de acento desaparece', () => {
    expect(fuente).not.toMatch(/bg-red-600/)
  })
})

/**
 * El paso "Datos" usaba cuatro grises distintos para el mismo cuerpo de texto
 * —gris-700 en la intro, zinc-700 en las etiquetas, negro puro en los inputs y
 * gris-900 en el consentimiento— y dos tratamientos distintos para sus dos
 * encabezados de grupo. El Resumen ya está en una sola tinta de cuerpo
 * (gris-800) y un solo nivel de título; los dos pasos comparten slideover.
 */
describe('ReservationForm — tipografía emparejada con el Resumen', () => {
  const fuente = readFileSync(
    fileURLToPath(new URL('../ReservationForm.vue', import.meta.url)),
    'utf8',
  )

  it('usa una sola tinta de cuerpo, la del Resumen', () => {
    expect(fuente).not.toMatch(/text-gray-700/)
    expect(fuente).not.toMatch(/text-black/)
    expect(fuente).toMatch(/text-gray-800/)
  })

  it('sus dos encabezados de grupo comparten tratamiento', () => {
    const requisitos = fuente.match(/<p([^>]*)>Requisitos para alquilar:/)?.[1] ?? ''
    const tusDatos = fuente.match(/<h3([^>]*)>Tus datos/)?.[1] ?? ''
    for (const enc of [requisitos, tusDatos]) {
      expect(enc).toMatch(/font-heading/)
      expect(enc).toMatch(/text-base/)
      expect(enc).toMatch(/font-bold/)
      expect(enc).toMatch(/text-gray-900/)
    }
  })

  it('los enlaces legales dejan el rojo de marca', () => {
    // Rojo era señal de marca y de error; en un consentimiento legal el azul de
    // enlace no compite con nada y se lee como lo que es.
    const enlaces = fuente.match(/<nuxt-link[\s\S]*?>/g) ?? []
    expect(enlaces.length).toBeGreaterThanOrEqual(2)
    for (const a of enlaces) {
      expect(a).toMatch(/text-blue-700/)
      expect(a).not.toMatch(/text-red-\d{3}/)
    }
  })
})

describe('ReservationForm — etiquetas de campo en la tinta de cuerpo', () => {
  const fuente = readFileSync(
    fileURLToPath(new URL('../ReservationForm.vue', import.meta.url)),
    'utf8',
  )

  it('sobrescribe el gris por defecto de Nuxt UI', () => {
    // El default de UFormField es zinc-700, otra rampa de gris: en pantalla
    // convivían dos grises casi iguales para el mismo tipo de texto.
    expect(fuente).toMatch(/const formFieldUi = \{[\s\S]*?label:\s*'[^']*text-gray-800/)
  })

  it('lo aplica en todos los campos que muestran etiqueta', () => {
    const conLabel = fuente.match(/<u-form-field[^>]*\slabel="/g) ?? []
    const conUi = fuente.match(/<u-form-field[^>]*:ui="formFieldUi"[^>]*\slabel="/g) ?? []
    expect(conLabel.length).toBeGreaterThan(0)
    expect(conUi.length).toBe(conLabel.length)
  })
})

describe('ReservationForm — requisitos con viñeta neutra', () => {
  const fuente = readFileSync(
    fileURLToPath(new URL('../ReservationForm.vue', import.meta.url)),
    'utf8',
  )

  it('no usa emojis de chulo verde', () => {
    // El verde del ✅ es el mismo del CTA y del pill de descuento: tres señales
    // distintas con el mismo color. Un punto negro no compite con nada.
    expect(fuente).not.toMatch(/✅/)
  })

  it('cada requisito lleva un punto negro decorativo', () => {
    const vinetas = fuente.match(/<span class="vineta-requisito"[^>]*><\/span>/g) ?? []
    expect(vinetas.length).toBe(3)
    for (const v of vinetas) {
      expect(v).toMatch(/aria-hidden="true"/)
    }
  })
})
