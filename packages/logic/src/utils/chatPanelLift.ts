/**
 * Cuánto tiene que elevarse el panel inline del chat para no aterrizar encima de
 * lo que quede visible debajo: hoy, el lanzador único del FAB de contacto
 * (`openChat` cierra el menú antes de abrir el panel, así que el menú nunca
 * queda debajo).
 *
 * La lección que este helper congela sigue viva: una constante escrita a mano
 * ya falló una vez. El panel vivía con `bottom: 9rem` (la pila de DOS filas) y
 * las marcas rendían tres; la tercera fila caía dentro del panel y se comía el
 * 40% del campo de texto — medido en producción con `elementFromPoint` sobre el
 * borde derecho del input, el clic cerraba el chat en vez de enfocar el campo.
 * Por eso la separación se deriva SIEMPRE de la altura medida del elemento real
 * (antes la lista de canales, ahora el lanzador), nunca de un número adivinado.
 */

/** `.contact-fab-stack { bottom: 1.5rem }` — separación de la pila al fondo. */
export const FAB_STACK_BOTTOM_PX = 24

/** Aire entre la primera fila de la pila y el borde inferior del panel. */
export const CHAT_PANEL_GAP_PX = 12

/**
 * Devuelve el `bottom` del panel en píxeles, o `null` cuando todavía no hay una
 * medida utilizable — ahí manda el fallback CSS de `5.75rem`, que es el caso del
 * lanzador de 56 px (56 + 24 + 12 = 92 px) para SSR y el primer frame.
 */
export function chatPanelLiftPx(channelsHeightPx: number): number | null {
  if (!Number.isFinite(channelsHeightPx) || channelsHeightPx <= 0) return null
  return Math.round(channelsHeightPx) + FAB_STACK_BOTTOM_PX + CHAT_PANEL_GAP_PX
}
