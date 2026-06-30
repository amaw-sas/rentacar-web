// Un error de búsqueda es "bloqueante" cuando impide mostrar tarjetas por una
// causa técnica/transitoria (server_error, errores Localiza inesperados, etc.) y
// NO por inventario agotado: no_available_categories_error es una respuesta
// terminal válida (no reintentable de inmediato), no un fallo.
//
// Sirve para dos decisiones que deben coincidir: el store no debe construir
// tarjetas mensuales ante un error bloqueante (useStoreSearchData), y el botón
// BUSCAR debe seguir habilitado para reintentar la consulta idéntica
// (useSearch — dogfood hallazgo #1).
export function isBlockingSearchError(
  error: { error: string } | null | undefined,
): boolean {
  return !!error && error.error !== 'no_available_categories_error';
}
