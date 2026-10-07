import { describe, it, expect } from 'vitest'
import {
  chatPanelLiftPx,
  CHAT_PANEL_GAP_PX,
  FAB_STACK_BOTTOM_PX,
} from '../chatPanelLift'

// Las filas del stack miden 3rem (48px) y van separadas por gap-3 (12px).
const row = (n: number) => n * 48 + (n - 1) * 12

describe('chatPanelLiftPx — el panel se ancla sobre lo medido que tiene debajo', () => {
  // SCEN-003: aritmética histórica de la pila de dos filas (el 9rem de la era
  // pre-lanzador). La función es agnóstica a qué se mide; estas cuentas fijan
  // su contrato con cualquier altura de entrada.
  it('SCEN-003 — con dos canales reproduce los 144px (9rem) de la era pre-lanzador', () => {
    expect(row(2)).toBe(108)
    expect(chatPanelLiftPx(row(2))).toBe(144)
  })

  // SCEN-001: con tres filas el tope de la pila está en 192px; el panel tiene
  // que arrancar por encima para que la intersección sea 0.
  it('SCEN-001 — con tres canales sube a 204px y libra el tope de la pila', () => {
    const lift = chatPanelLiftPx(row(3))
    expect(lift).toBe(204)
    const stackTop = FAB_STACK_BOTTOM_PX + row(3)
    expect(stackTop).toBe(192)
    expect(lift as number).toBeGreaterThan(stackTop)
  })

  // SCEN-006: quitar WhatsApp por horario baja el panel una fila justa.
  it('SCEN-006 — perder una fila baja el panel 60px, ni más ni menos', () => {
    expect(
      (chatPanelLiftPx(row(3)) as number) - (chatPanelLiftPx(row(2)) as number),
    ).toBe(60)
  })

  it('un solo canal visible también queda por encima de su fila', () => {
    expect(chatPanelLiftPx(row(1))).toBe(84)
    expect(84).toBeGreaterThan(FAB_STACK_BOTTOM_PX + row(1))
  })

  // 2026-10-06 (contact-fab-collapse): el widget ya no mide la lista de canales
  // sino el lanzador único de 56px (w-14). Es el caso que respalda el fallback
  // CSS de 5.75rem: si esta cuenta cambia, el fallback de las 3 marcas miente.
  it('el lanzador de 56px eleva el panel a 92px (5.75rem, el fallback CSS)', () => {
    expect(chatPanelLiftPx(56)).toBe(92)
    expect(92).toBeGreaterThan(FAB_STACK_BOTTOM_PX + 56)
  })

  // Sin medida utilizable no se escribe la variable: manda el fallback CSS de
  // 5.75rem, que es el lanzador colapsado (el único estado bajo el panel).
  it.each([
    ['altura cero (aún sin montar)', 0],
    ['altura negativa', -10],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('devuelve null con %s para caer en el fallback de 5.75rem', (_label, value) => {
    expect(chatPanelLiftPx(value as number)).toBeNull()
  })

  it('redondea alturas fraccionarias (zoom del navegador, fuentes a medio cargar)', () => {
    expect(chatPanelLiftPx(107.6)).toBe(144)
    expect(CHAT_PANEL_GAP_PX).toBe(12)
  })
})
