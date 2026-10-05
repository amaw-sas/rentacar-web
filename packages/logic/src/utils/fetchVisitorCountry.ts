// Asks our own origin where the visitor is. Pages are ISR-cached, so the country
// cannot be baked into the HTML; a same-origin endpoint avoids third-party IP
// services. The Cloudflare reasoning lives in the endpoint. Fails quietly on purpose:
// privacy-strict browsers must not produce console noise (see PR #501).

const TIMEOUT_MS = 1500

// The request is made once per page and kept, even past the cap: the preload
// asks while results are on screen, and a cold endpoint answering late must
// still serve the form opened afterwards. The 1.5 s cap applies to each call.
let request: Promise<string | null> | null = null

function parseCountry(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const raw = (body as { country?: unknown }).country
  if (typeof raw !== 'string') return null
  const country = raw.toUpperCase()
  return /^[A-Z]{2}$/.test(country) ? country : null
}

function requestCountry(): Promise<string | null> {
  try {
    // retry: 0 — ofetch retries a failed GET once by default; one lookup is enough.
    return ($fetch as (url: string, opts: { retry: number }) => Promise<unknown>)('/api/visitor-country', {
      retry: 0,
    }).then(parseCountry, () => null)
  } catch {
    return Promise.resolve(null)
  }
}

export function fetchVisitorCountry(): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  request ??= requestCountry()

  return new Promise<string | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), TIMEOUT_MS)
    request!.then((country) => {
      clearTimeout(timer)
      resolve(country)
    })
  })
}

export function __resetVisitorCountryForTests(): void {
  request = null
}
