import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ChatConversation.vue', import.meta.url)),
  'utf8',
)

// 2026-07-28, decisión del dueño: el chat de alquilame deja de ser el clon del de
// alquilatucarro. Esta suite reemplaza a ChatConversation.bubbles.wa.test.ts, que
// congelaba el look WhatsApp (verde #d9fdd3, beige #ece5dd, radio 7.5px, piquito).
// Lo que ERA de comportamiento —agrupación por remitente, hora dentro de la burbuja,
// partes estructuradas, placeholders fantasma— se conserva aquí tal cual; sólo cambia
// la piel. Las otras dos marcas mantienen su suite WhatsApp intacta.

describe('SCEN-ALQ-CHAT-01 — cabecera de marca', () => {
  it('pinta la cabecera con el token de marca, nunca con el hex quemado', () => {
    expect(source).toMatch(/\.cc-header \{[\s\S]{0,260}background: var\(--ui-primary, #cc022b\);/)
    // El texto de la cabecera vive sobre rojo: blanco y blanco translúcido.
    expect(source).toMatch(/\.cc-title \{[^}]*color: #fff;/)
    expect(source).toMatch(/\.cc-status \{[^}]*color: rgba\(255, 255, 255, 0\.82\);/)
  })

  it('usa los textos propios de alquilame, no los de la marca hermana', () => {
    expect(source).toContain('<p class="cc-title">Camila · alquilame</p>')
    expect(source).toContain('<p class="cc-status">Responde al instante · 24/7</p>')
    expect(source).not.toContain('¿En qué te ayudamos?')
    expect(source).not.toContain('En línea · Disponible 24/7')
  })

  it('el punto de "en línea" se recorta contra la cabecera roja', () => {
    expect(source).toMatch(/\.cc-avatar-dot \{[\s\S]{0,260}border: 2px solid var\(--ui-primary, #cc022b\);/)
  })
})

describe('SCEN-ALQ-CHAT-02 — avatar propio de la marca', () => {
  it('apunta al asset servido por el public de alquilame', () => {
    expect(source).toContain('src="/images/asesora-camila.webp"')
    // El de la capa compartida (packages/logic/public) queda para las otras marcas.
    expect(source).not.toContain('asesora-avatar.webp')
  })

  it('describe a quién se ve, no un rol genérico', () => {
    expect(source).toContain('alt="Camila"')
  })
})

describe('SCEN-ALQ-CHAT-03 — burbujas grafito sobre lienzo claro', () => {
  it('viste al cliente de grafito con letra blanca', () => {
    expect(source).toMatch(/\.cc-msg\.is-user \{[\s\S]{0,200}background: #4b5563;[\s\S]{0,80}color: #fff;/)
  })

  it('deja la burbuja del bot en blanco con filo, sin sombra de WhatsApp', () => {
    expect(source).toMatch(/\.cc-msg\.is-assistant \{[\s\S]{0,200}box-shadow: inset 0 0 0 1px #e6e8ec;/)
    expect(source).not.toMatch(/box-shadow: 0 1px 0\.5px rgba\(11, 20, 26, 0\.13\)/)
  })

  it('usa radio de 1rem con la esquina viva del lado del remitente', () => {
    expect(source).toMatch(/\.cc-msg \{\n  position: relative;\n  max-width: 85%;\n  padding: 0\.5rem 0\.75rem;\n  border-radius: 1rem;/)
    expect(source).toMatch(/\.cc-msg\.is-user \{[\s\S]{0,200}border-bottom-right-radius: 0\.25rem;/)
    expect(source).toMatch(/\.cc-msg\.is-assistant \{[\s\S]{0,200}border-bottom-left-radius: 0\.25rem;/)
  })

  it('borra todo rastro de la paleta de WhatsApp', () => {
    expect(source).not.toContain('#d9fdd3')
    expect(source).not.toContain('#ece5dd')
    expect(source).not.toMatch(/border-top: 10px solid/)
  })

  it('tiñe el área de mensajes con el gris del lienzo', () => {
    expect(source).toMatch(/\.cc-messages \{[\s\S]{0,320}background: #f7f8f9;/)
  })
})

describe('SCEN-ALQ-CHAT-04 — área de escritura y botón de enviar', () => {
  it('deja el campo sin borde, sobre gris y con esquina blanda', () => {
    expect(source).toMatch(/\.cc-input input \{[\s\S]{0,260}background: #f2f3f5;/)
    expect(source).toMatch(/\.cc-input input \{[\s\S]{0,260}border-radius: 0\.75rem;/)
    expect(source).not.toMatch(/border: 2px solid #cbd0d6/)
  })

  it('apoya el composer sobre blanco, no sobre el beige heredado', () => {
    expect(source).toMatch(/\.cc-input \{[^}]*background: #fff;/)
  })

  it('convierte el botón de enviar en un cuadrado redondeado de marca', () => {
    expect(source).toMatch(/\.cc-send \{[\s\S]{0,320}border-radius: 0\.75rem;/)
    expect(source).toMatch(/\.cc-send \{[\s\S]{0,320}background: var\(--ui-primary, #cc022b\);/)
    // Ya no arranca gris a la espera del foco: es un control de marca siempre.
    expect(source).not.toMatch(/\.cc-send\.cc-send-active \{ background: var\(--ui-primary/)
  })
})

// ---- invariantes de comportamiento heredados de la suite WhatsApp ----
// Cambia la piel, no la mecánica. Si algo de esto se cae, el rediseño rompió una
// función, no un color.

describe('SCEN-ALQ-CHAT-B1 — agrupación por remitente', () => {
  it('marca el arranque de cada tanda en usuario, "escribiendo" y asistente', () => {
    expect(source).toMatch(/is-user"[^>]{0,60}:class="\{ 'has-time': !!m\.createdAt, 'is-group-start': isGroupStart\(msgIdx\) \}"/)
    expect(source).toMatch(/!m\.text && isStreaming" class="cc-msg is-assistant" :class="\{ 'is-group-start': isGroupStart\(msgIdx\) \}"/)
    expect(source).toMatch(/'is-group-start': i === 0 && isGroupStart\(msgIdx\),/)
  })

  it('detecta el arranque comparando contra el rol del mensaje anterior', () => {
    expect(source).toMatch(/function isGroupStart\(idx: number\): boolean/)
    expect(source).toMatch(/return m\?\.role !== role/)
  })

  it('separa las tandas con aire en vez de con un piquito', () => {
    expect(source).toMatch(/\.cc-msg\.is-group-start \{ margin-top: 0\.5rem; \}/)
  })

  it('salta los placeholders del asistente que no pintan burbuja', () => {
    expect(source).toMatch(/m\.role === 'assistant' && !m\.text && !m\.quoteTable && !m\.gamaCards && !m\.actions/)
  })
})

describe('SCEN-ALQ-CHAT-B2 — la hora sigue metida en la burbuja', () => {
  it('posiciona cc-time en la esquina inferior derecha', () => {
    expect(source).toMatch(/\.cc-time \{\n  position: absolute;\n  right: 0\.5rem;\n  bottom: 0\.3125rem;/)
  })

  it('reserva el ancho de la hora con un espaciador en la última línea', () => {
    expect(source).toMatch(/\.cc-msg\.is-user\.has-time::after,\n\.cc-msg\.is-assistant\.has-time \.cc-text::after \{[\s\S]{0,120}display: inline-block;\n  width: 4\.5em;/)
  })

  it('devuelve la hora a su propia fila en burbujas con partes estructuradas', () => {
    expect(source).toMatch(/'has-parts': i === bubblesFor\(m\)\.length - 1 && !!\(m\.quoteTable \|\| m\.gamaCards \|\| m\.actions\),/)
    // Guardia de especificidad: los selectores de opt-out tienen que llevar el
    // prefijo .cc-msg.is-assistant completo — con menos clases PIERDEN (0,3,1)
    // contra la regla del espaciador (0,4,1) y el override queda muerto.
    expect(source).toMatch(/\.cc-msg\.is-assistant\.has-parts \.cc-time \{ position: static; display: block; margin-top: 0\.25rem; text-align: right; \}/)
    expect(source).toMatch(/\.cc-msg\.is-assistant\.has-parts \.cc-text::after \{ content: none; \}/)
    expect(source).not.toMatch(/\.cc-msg\.has-parts \.cc-text::after/)
  })

  it('la hora del cliente se lee sobre el grafito', () => {
    expect(source).toMatch(/\.cc-msg\.is-user \.cc-time \{ color: rgba\(255, 255, 255, 0\.7\); \}/)
  })
})

describe('SCEN-ALQ-CHAT-B3 — chunk que termina en un CTA de bloque', () => {
  it('quita el espaciador y devuelve la hora a su fila', () => {
    expect(source).toMatch(/\.cc-msg\.is-assistant\.has-time \.cc-text:has\(> \.cc-link-btn:last-child\)::after \{ content: none; \}/)
    expect(source).toMatch(/\.cc-msg\.is-assistant:has\(\.cc-text > \.cc-link-btn:last-child\) \.cc-time \{/)
  })
})
