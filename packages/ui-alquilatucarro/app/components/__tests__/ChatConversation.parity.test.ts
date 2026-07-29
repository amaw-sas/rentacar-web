import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('../../../../..', import.meta.url))
const read = (b: string) =>
  readFileSync(`${repoRoot}/packages/${b}/app/components/ChatConversation.vue`, 'utf8')

const alquicarros = read('ui-alquicarros')
const alquilatucarro = read('ui-alquilatucarro')
const alquilame = read('ui-alquilame')

// Hasta 2026-07-28 las tres copias de ChatConversation.vue eran byte-idénticas, así
// que la paridad se sostenía sola: un arreglo que aterrizara en una marca y no en las
// otras saltaba a la vista en el diff. El rediseño de alquilame rompe esa simetría a
// propósito (decisión del dueño: su chat deja de ser el clon del de alquilatucarro).
//
// Esta guardia escribe lo que antes era implícito. Sin ella, las dos marcas que SÍ
// comparten piel se quedan sin red y pueden derivar en silencio.
describe('SCEN-ALQ-CHAT-07 — paridad entre las marcas que comparten piel', () => {
  it('alquicarros y alquilatucarro siguen byte-idénticos', () => {
    expect(
      alquicarros,
      'las dos marcas que comparten el chat de WhatsApp divergieron: un arreglo '
      + 'aterrizó en una copia y no en la otra. Si el cambio es de una sola marca, '
      + 'documenta por qué antes de bifurcarla.',
    ).toBe(alquilatucarro)
  })

  it('conservan la piel de WhatsApp que alquilame abandonó', () => {
    for (const [brand, source] of [['ui-alquicarros', alquicarros], ['ui-alquilatucarro', alquilatucarro]] as const) {
      expect(source, brand).toContain('#d9fdd3')
      expect(source, brand).toContain('background: #ece5dd')
      expect(source, brand).toContain('<p class="cc-title">¿En qué te ayudamos?</p>')
      expect(source, brand).toContain('<p class="cc-status">En línea · Disponible 24/7</p>')
    }
  })

  it('siguen sirviendo el avatar compartido del layer', () => {
    expect(alquicarros).toContain('src="/images/asesora-avatar.webp"')
    expect(alquilatucarro).toContain('src="/images/asesora-avatar.webp"')
  })

  it('alquilame está bifurcada a propósito y no arrastra a las otras dos', () => {
    expect(alquilame).not.toBe(alquilatucarro)
    expect(alquilame).not.toContain('src="/images/asesora-avatar.webp"')
    expect(alquilame).not.toContain('#d9fdd3')
  })
})
