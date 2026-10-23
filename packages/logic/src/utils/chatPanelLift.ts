/**
 * Cuánto tiene que elevarse el panel inline del chat para no aterrizar encima de
 * lo que quede visible debajo: en alquilatucarro y alquicarros, el lanzador
 * único del FAB de contacto (`openChat` cierra el menú antes de abrir el panel,
 * así que el menú nunca queda debajo); en alquilame, la fila de píldoras de su
 * barra de contacto.
 *
 * La lección que este helper congela sigue viva: una constante escrita a mano
 * ya falló una vez. El panel vivía con `bottom: 9rem` (la pila de DOS filas) y
 * las marcas rendían tres; la tercera fila caía dentro del panel y se comía el
 * 40% del campo de texto — medido en producción con `elementFromPoint` sobre el
 * borde derecho del input, el clic cerraba el chat en vez de enfocar el campo.
 * Por eso la separación se deriva SIEMPRE de la altura medida del elemento real
 * (antes la lista de canales, ahora el lanzador o la fila de píldoras), nunca de
 * un número adivinado.
 */

/**
 * Separación de lo medido al fondo: `.contact-fab-stack { bottom: 1.5rem }` en
 * las marcas con lanzador y `.contact-dock { bottom: 1.5rem }` en alquilame.
 */
export const FAB_STACK_BOTTOM_PX = 24

/** Aire entre la primera fila de la pila y el borde inferior del panel. */
export const CHAT_PANEL_GAP_PX = 12

/**
 * Devuelve el `bottom` del panel en píxeles, o `null` cuando todavía no hay una
 * medida utilizable — ahí manda el fallback CSS de cada marca para SSR y el
 * primer frame: `5.75rem` con el lanzador de 56 px (56 + 24 + 12 = 92 px),
 * `5rem` con la píldora de 44 px de alquilame (44 + 24 + 12 = 80 px).
 */
export function chatPanelLiftPx(channelsHeightPx: number): number | null {
  if (!Number.isFinite(channelsHeightPx) || channelsHeightPx <= 0) return null
  return Math.round(channelsHeightPx) + FAB_STACK_BOTTOM_PX + CHAT_PANEL_GAP_PX
}
