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

describe('ReservationForm — a failed submit brings the first invalid field into view (issue #366, D6)', () => {
  const uFormOpenTag = source.match(/<u-form\b[\s\S]*?>/)

  it('wires @error to a NAMED handler, not an inline arrow', () => {
    // El regex de arriba corta en el primer `>`, así que una `=>` dentro del tag
    // truncaría el match y tumbaría el aserto de class="light" con un mensaje que no
    // señala la causa. El handler va nombrado por eso, no por estilo.
    expect(uFormOpenTag).not.toBeNull()
    expect(uFormOpenTag![0]).toMatch(/@error="\s*\w+\s*"/)
    expect(uFormOpenTag![0]).not.toMatch(/=>/)
  })

  it('falls back to #telefono, whose UFormField id never lands in the DOM', () => {
    // VueTelInput no usa useFormField (ver el comentario de ese campo), así que el id
    // que viaja en el evento no corresponde a ningún elemento y getElementById devuelve
    // null. usePhoneField fija `id: "telefono"` de forma determinista.
    expect(source).toMatch(/telefono['"]\s*\?\s*['"]telefono['"]/)
  })

  it('focuses the first invalid field in DOM order, not errors[0]', () => {
    // Medido: valibot devuelve los issues en orden de declaración del schema, que NO es
    // el del DOM. `vehiculo` encabeza la lista y no tiene campo en el formulario (se
    // elige en el Paso 2), así que errors[0] resolvería a null y el submit no tendría
    // efecto visible — el mismo defecto que #366 viene a cerrar. Y email/telefono están
    // cruzados entre ambos órdenes.
    expect(source).toMatch(/compareDocumentPosition/)
    expect(source).not.toMatch(/errors\[0\]/)
  })
})
