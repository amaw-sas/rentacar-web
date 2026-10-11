// Text prefilled in the WhatsApp contact link (see plugins/wa-message.client.ts).
// Pure so the wording can be tested without a DOM.

interface TikTokSignals {
  utm_source?: string | null
  ttclid?: string | null
}

// A visitor counts as TikTok when they are on the /tiktok bio page or the stored
// attribution says so — the latter keeps the source after they tap a city.
export function isTikTokVisitor(pathname: string, attribution: TikTokSignals | null): boolean {
  if (pathname.split('/').filter(Boolean)[0] === 'tiktok') return true
  if (!attribution) return false
  return /tiktok/i.test(attribution.utm_source ?? '') || Boolean(attribution.ttclid)
}

export function buildWaContactMessage(opts: {
  pathname: string
  fromTikTok: boolean
  cities: Readonly<Record<string, string>>
}): string {
  // First non-empty path segment = city id, for both the landing and the
  // search flow. Extra segments (dates, locations, category) are ignored.
  const firstSegment = opts.pathname.split('/').filter(Boolean)[0] ?? ''
  const city = opts.cities[firstSegment]
  const base = opts.fromTikTok
    ? 'Hola, vengo de TikTok. Vi su página de alquiler de carros'
    : 'Hola, vi su página de alquiler de carros'
  return city
    ? `${base} en ${city} y quiero saber los requisitos`
    : `${base} y quiero saber los requisitos`
}
