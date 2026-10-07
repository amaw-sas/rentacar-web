import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ChatWidget.vue', import.meta.url)),
  'utf8',
)

describe('SCEN-322-A02/A03 — chat panel a11y', () => {
  // Invariante intacto (Escape cierra lo abierto); ahora cierra menú Y panel.
  it('closes on Escape', () => {
    expect(source).toMatch(/Escape/)
    expect(source).toMatch(/keydown/)
    expect(source).toMatch(/if \(e\.key === 'Escape'\) closeAll\(\)/)
  })

  // Lanzador: el menú es un disclosure, no un role="menu" (base.css rompería
  // colores); el botón expone su estado y qué controla.
  it('launcher exposes aria-expanded and aria-controls for the contact menu', () => {
    // menuOpen || panelOpen: con el panel abierto el lanzador es una X con
    // etiqueta «Cerrar»; aria-expanded cuenta lo mismo al lector de pantalla.
    expect(source).toMatch(/:aria-expanded="menuOpen \|\| panelOpen"/)
    expect(source).toContain('aria-controls="contact-fab-menu"')
    expect(source).toMatch(/<ul[^>]*id="contact-fab-menu"/)
    expect(source).not.toMatch(/<ul[^>]*role="menu"/)
  })

  it('panel is a dialog with aria-modal and receives focus', () => {
    expect(source).toMatch(/role="dialog"/)
    expect(source).toMatch(/aria-modal="true"/)
    expect(source).toMatch(/panelEl\.value\?\.focus/)
  })

  it('keeps aria-live region for assistant announcements', () => {
    expect(source).toMatch(/aria-live="polite"/)
  })
})
