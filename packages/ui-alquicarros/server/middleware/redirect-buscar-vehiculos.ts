/**
 * Independencia de enrutamiento (directiva): en alquicarros `/{city}/buscar-vehiculos/...`
 * ya no existe — la superficie de reserva es el wizard de `/reservas` (PATH). Redirige
 * 301 reescribiendo path→path: descarta el segmento de ciudad y reenvía el resto
 * (lugar-recogida/.../categoria/X, o referido/.../...) tal cual, así el link del operador
 * (con categoría → Paso 3 Seguro) y cualquier deep-link legacy conservan su búsqueda.
 *
 * Un routeRule `**` de Nitro no basta: con el `:city` intermedio reenvía el path completo
 * (`/reservas/{city}/buscar-vehiculos/...`). Aquí capturamos el resto DESPUÉS de
 * `buscar-vehiculos/` explícitamente. Reemplaza el routeRule plano (que perdía los params).
 */
const BUSCAR_VEHICULOS_RE = /^\/[^/]+\/buscar-vehiculos(?:\/(.*))?$/

export default defineEventHandler((event) => {
  const rawPath = event.path || ''
  const queryIndex = rawPath.indexOf('?')
  const pathname = queryIndex === -1 ? rawPath : rawPath.slice(0, queryIndex)
  const search = queryIndex === -1 ? '' : rawPath.slice(queryIndex)

  const match = pathname.match(BUSCAR_VEHICULOS_RE)
  if (!match) return

  const rest = match[1] ?? ''
  const target = `/reservas${rest ? `/${rest}` : ''}${search}`
  return sendRedirect(event, target, 301)
})
