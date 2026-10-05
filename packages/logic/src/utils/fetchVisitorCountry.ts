// Asks our own origin where the visitor is. Pages are ISR-cached, so the country
// cannot be baked into the HTML; a same-origin endpoint avoids third-party IP
// services. The Cloudflare reasoning lives in the endpoint. Fails quietly on purpose:
// privacy-strict browsers must not produce console noise (see PR #501).

const TIMEOUT_MS = 1500

let pending: Promise<string | null> | null = null

function parseCountry(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const raw = (body as { country?: unknown }).country
  if (typeof raw !== 'string') return null
  const country = raw.toUpperCase()
  return /^[A-Z]{2}$/.test(country) ? country : null
}

export function fetchVisitorCountry(): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (pending) return pending

  pending = new Promise<string | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), TIMEOUT_MS)
    const done = (value: string | null) => {
      clearTimeout(timer)
      resolve(value)
    }
    try {
      // retry: 0 — ofetch retries a failed GET once by default; one lookup is enough.
      ;($fetch as (url: string, opts: { retry: number }) => Promise<unknown>)('/api/visitor-country', {
        retry: 0,
      })
        .then((body) => done(parseCountry(body)))
        .catch(() => done(null))
    } catch {
      done(null)
    }
  })
  return pending
}

export function __resetVisitorCountryForTests(): void {
  pending = null
}
