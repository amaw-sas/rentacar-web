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

  it('delega la resolución del primer campo inválido al util puro (S1)', () => {
    // La resolución (orden-de-DOM vía compareDocumentPosition + caso especial `telefono`)
    // se extrajo a firstInvalidFieldEl y se prueba en reservation-form-error-focus.test.ts.
    // El componente solo debe DELEGAR en ese util: si volviera a resolver inline, la S1
    // quedaría a medias y el foco podría romperse en silencio sin que ese test lo cazara.
    expect(source).toMatch(/firstInvalidFieldEl\(\s*event\?\.errors\s*,\s*document\s*\)/)
    // Y no debe volver a leer errors[0] por su cuenta: el orden es de DOM, no de lista.
    expect(source).not.toMatch(/errors\[0\]/)
  })

  it('espera un frame (requestAnimationFrame) antes de enfocar — loadingAuto deshabilita los campos', () => {
    // Lo único de D6 que se queda en el componente: `loadingAuto` mantiene los campos
    // deshabilitados en el tick del evento `error`, así que enfocar ahí cae en un
    // <input disabled> y el navegador lo ignora. El foco espera al frame siguiente.
    expect(source).toMatch(/requestAnimationFrame/)
  })
})
