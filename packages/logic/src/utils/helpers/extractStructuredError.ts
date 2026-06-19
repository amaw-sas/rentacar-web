import type { FetchError } from 'ofetch';

export interface StructuredErrorForward {
  status: number;
  statusText?: string;
  body: Record<string, unknown>;
}

// Pulls a structured {error, message, ...} body out of an ofetch FetchError so
// a Nuxt server proxy route can forward it to the browser verbatim (with the
// original status). Without this, Nitro wraps the error in its generic
// envelope and the client receives {error: true, url, statusCode, ...} instead
// of the Localiza error code it needs to render the matching toast.
//
// This gate is deliberately broad (`'error' in data`). The client-side
// `mapAvailabilityFetchError` is the tighter chokepoint: it only treats a body
// as a Localiza error when `error` is a non-empty STRING code, so a stray
// `{error: true}` envelope still resolves to a friendly server_error toast
// (dogfood ISSUE-003). Don't loosen the client to "match" this — narrow this
// instead if the two ever need to agree.
export function extractStructuredError(
  e: unknown,
): StructuredErrorForward | null {
  if (!e || typeof e !== 'object') return null;
  const fe = e as FetchError;
  if (!fe.data || typeof fe.data !== 'object') return null;
  if (!('error' in fe.data)) return null;
  return {
    status: fe.status ?? 500,
    statusText: fe.statusText,
    body: fe.data as Record<string, unknown>,
  };
}
