/**
 * Inserta `referido/{code}` justo antes de `/lugar-recogida/` en las rutas de búsqueda
 * de las marcas, o reemplaza un segmento `/referido/<x>` existente. Una ruta sin
 * `/lugar-recogida/` (p. ej. la forma con query) se devuelve igual.
 */
export function withReferido(path: string, code: string): string {
  const marker = '/lugar-recogida/';
  const at = path.indexOf(marker);
  if (at === -1) return path;

  const head = path.slice(0, at).replace(/\/referido\/[^/]+$/, '');
  return `${head}/referido/${encodeURIComponent(code)}${path.slice(at)}`;
}

export interface ReservationShareUrlInput {
  origin: string;
  /** route.path actual; puede traer /referido/<x> y /categoria/<x>. */
  path: string;
  /** Código de gama seleccionada (cualquier caja). */
  vehiculo: string;
  totalInsurance: boolean;
  /** Código del asesor activo; sin él la ruta no se toca. */
  advisorCode?: string | null;
}

/** Enlace compartible de una gama: ruta semántica /categoria/{codigo} (+ ?seguro=total). */
export function buildReservationShareUrl({
  origin,
  path,
  vehiculo,
  totalInsurance,
  advisorCode,
}: ReservationShareUrlInput): string {
  const currentPath = advisorCode ? withReferido(path, advisorCode) : path;
  const basePathWithoutCategoria = currentPath.replace(/\/categoria\/[^/]+$/, '');
  const newPath = `${basePathWithoutCategoria}/categoria/${vehiculo.toLowerCase()}`;
  const suffix = totalInsurance ? '?seguro=total' : '';
  return `${origin}${newPath}${suffix}`;
}
