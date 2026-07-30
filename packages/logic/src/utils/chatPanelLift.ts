/**
 * Cuánto tiene que elevarse el panel inline del chat para no aterrizar encima de
 * la pila de canales de contacto.
 *
 * El panel vivía con `bottom: 9rem` escrito a mano, que es exactamente la altura
 * de una pila de DOS filas. Las marcas vivas rinden tres (`Chat`, `WhatsApp`,
 * `Llámanos`), así que la tercera caía dentro del panel y se comía el 40% del
 * campo de texto: medido en producción, `elementFromPoint` sobre el borde
 * derecho del input devolvía la etiqueta del FAB, y el clic cerraba el chat en
 * vez de enfocar el campo.
 *
 * Ninguna constante puede arreglarlo: `whatsappVisible` sigue el horario del
 * dashboard, así que la misma marca tiene tres filas en horario y dos fuera. La
 * separación se deriva de la altura medida de la lista de canales.
 */

/** `.contact-fab-stack { bottom: 1.5rem }` — separación de la pila al fondo. */
export const FAB_STACK_BOTTOM_PX = 24

/** Aire entre la primera fila de la pila y el borde inferior del panel. */
export const CHAT_PANEL_GAP_PX = 12

/**
 * Devuelve el `bottom` del panel en píxeles, o `null` cuando todavía no hay una
 * medida utilizable — ahí manda el fallback CSS de `9rem`, que es la pila de dos
 * filas y el caso más común.
 */
export function chatPanelLiftPx(channelsHeightPx: number): number | null {
  if (!Number.isFinite(channelsHeightPx) || channelsHeightPx <= 0) return null
  return Math.round(channelsHeightPx) + FAB_STACK_BOTTOM_PX + CHAT_PANEL_GAP_PX
}
