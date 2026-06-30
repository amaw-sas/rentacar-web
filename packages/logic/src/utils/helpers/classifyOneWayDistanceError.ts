import type LocalizaErrorResponse from '../types/data/LocalizaErrorResponse';

// Localiza no puede cotizar el one-way cuando la distancia entre las ciudades de
// recogida y devolución no está registrada: responde unknown_error con shortText
// LLNRRE003 (OTA Code 303, "Distância entre cidades não cadastrada"). Reframe ese
// caso —y SOLO ese— como un código semántico que createErrorMessage traduce a
// copy accionable. El gate pickup≠return evita reetiquetar un unknown_error de
// infraestructura genuino. Causa raíz upstream: rentacar-dashboard#205.
export function classifyOneWayDistanceError(
  error: LocalizaErrorResponse,
  pickupLocation: string | null,
  returnLocation: string | null,
): LocalizaErrorResponse {
  if (
    error.shortText === 'LLNRRE003' &&
    pickupLocation &&
    returnLocation &&
    pickupLocation !== returnLocation
  ) {
    return { ...error, error: 'one_way_not_available' };
  }
  return error;
}
