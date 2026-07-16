import type { FetchError } from 'ofetch';
import type LocalizaErrorResponse from '../types/data/LocalizaErrorResponse';
import { isTimeoutFetchError } from './isTimeoutFetchError';

// Friendly, non-technical copy for any infrastructure failure (backend
// unreachable, 5xx, timeout). Mirrors createErrorMessage's server_error branch.
const SERVER_ERROR_MESSAGE =
  'El servicio no está disponible en este momento. Por favor, intenta de nuevo en unos minutos.';

const TIMEOUT_ERROR_MESSAGE =
  'La consulta tardó demasiado. Por favor, intenta de nuevo en unos minutos.';

// Maps a caught availability fetch error to a LocalizaErrorResponse.
//
// A genuine Localiza error arrives as `{ error: "<string code>", message, … }`
// and is forwarded verbatim so createErrorMessage can render the right copy.
// Everything else — notably the Nitro 500 envelope `{ error: true, message:
// "[POST] \"…\": fetch failed" }` produced when the admin backend is
// unreachable — is downgraded to a friendly server_error. Without this, the
// boolean-`error` envelope passed a loose `'error' in data` check and leaked the
// raw `[POST] "…": fetch failed` string into the toast (dogfood ISSUE-003).
// Timeouts map to connection_timeout (issue 322 SCEN-322-E04).
export function mapAvailabilityFetchError(e: unknown): LocalizaErrorResponse {
  if (isTimeoutFetchError(e)) {
    return {
      error: 'connection_timeout',
      message: TIMEOUT_ERROR_MESSAGE,
    } as LocalizaErrorResponse;
  }
  const data = (e as FetchError | undefined)?.data;
  if (data && typeof data === 'object') {
    const code = (data as Record<string, unknown>).error;
    if (typeof code === 'string' && code.trim() !== '') {
      return data as LocalizaErrorResponse;
    }
  }
  return {
    error: 'server_error',
    message: SERVER_ERROR_MESSAGE,
  } as LocalizaErrorResponse;
}
