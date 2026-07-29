/**
 * SCEN-ALQ-CHAT-09 — el chat no se repinta con el auto-dark de Chrome Android.
 *
 * Medido en local (2026-07-29) con `document.documentElement.classList.add('dark')`,
 * que es lo que hace @nuxtjs/color-mode en un teléfono con tema oscuro:
 *
 *     html      light     ← base.css lo fuerza
 *     body      dark      ← el .dark de Nuxt UI rompe la cadena aquí
 *     .cc-root  dark      ← el chat hereda, en /chat y en el panel teleportado
 *
 * `color-scheme` se hereda, así que basta con volver a declararlo en la raíz de
 * cada superficie del chat. Sólo 10 de las 20 páginas de alquilame declaran
 * `colorMode: 'light'`; /chat es una de las que NO, y el botón flotante sale en
 * todas porque vive en el layout.
 *
 * Ojo al re-testear: el force-dark es un efecto de PINTADO, invisible para
 * getComputedStyle (siempre reporta los valores claros). Lo observable es la
 * cadena de `color-scheme`, y eso es lo que congelan estas pruebas.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const conversation = readFileSync(
  join(__dirname, '..', 'app/components/ChatConversation.vue'),
  'utf-8',
)
const config = readFileSync(join(__dirname, '..', 'nuxt.config.ts'), 'utf-8')

describe('SCEN-ALQ-CHAT-09: el chat se sale del auto-dark de Android', () => {
  it('la superficie de conversación se declara light (cubre /chat y el panel)', () => {
    expect(conversation).toMatch(/\.cc-root \{[^}]*color-scheme: light;/)
  })

  it('la capa flotante teleportada se declara light desde el CSS crítico', () => {
    // Va en el CSS crítico y no en el <style> del widget a propósito: el widget
    // tiene el número de líneas congelado contra la copia base (SCEN-5a en
    // ui-alquilatucarro), y aquí además aplica desde el primer paint.
    expect(config).toMatch(/\.contact-fab-layer \{[^}]*color-scheme: light;/)
  })

  it('el opt-out global de base.css sigue en su sitio', () => {
    const base = readFileSync(
      join(__dirname, '..', 'app/assets/css/rentacar-main/base.css'),
      'utf-8',
    )
    expect(base).toMatch(/html \{\s*color-scheme: light;\s*\}/)
  })
})
