// Visitor country for the phone-field default flag.
//
// The 3 brand sites are proxied by Cloudflare, so on the Vercel origin
// `x-vercel-ip-country` reflects Cloudflare's egress IP, not the visitor (a
// Colombian routed through the MIA PoP shows up as US). Cloudflare adds `cf-ray`
// to every proxied request and `cf-ipcountry` with the real visitor country, so
// when `cf-ray` is present only `cf-ipcountry` is trusted. Without `cf-ray`
// (previews on *.vercel.app) the Vercel header is accurate.
//
// Never cached: the answer depends on who is asking.
const COUNTRY_RE = /^[A-Z]{2}$/

function normalize(raw: string | undefined): string | null {
  const value = (raw ?? '').trim().toUpperCase()
  // XX = Cloudflare "unknown"; T1 (Tor) already fails the regex.
  return COUNTRY_RE.test(value) && value !== 'XX' ? value : null
}

export default defineEventHandler((event) => {
  setResponseHeader(event, 'cache-control', 'private, no-store')

  const behindCloudflare = (getRequestHeader(event, 'cf-ray') ?? '').trim() !== ''
  const source = behindCloudflare ? 'cloudflare' : 'vercel'
  const country = normalize(
    getRequestHeader(event, behindCloudflare ? 'cf-ipcountry' : 'x-vercel-ip-country'),
  )

  return country ? { country, source } : { country: null, source: 'none' }
})
