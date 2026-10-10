/**
 * IndexNow: tells Bing (and every engine sharing the protocol) that URLs were
 * added or changed. Google does not take part.
 *
 * Each key is public by design: search engines verify it by fetching
 * `https://<host>/<key>.txt`, served from the brand's `public/` folder.
 * alquicarros is left out while it is under construction.
 */
export const INDEXNOW_SITES = {
  alquilatucarro: { host: 'alquilatucarro.com', key: 'ac1159dcfa10a13cc2f8330fd84df52e' },
  alquilame: { host: 'alquilame.co', key: '2f5d79c16407b2be1acf80cf302c52b0' },
} as const

export type IndexNowBrand = keyof typeof INDEXNOW_SITES

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

/** The protocol caps one POST at 10,000 URLs. */
export const INDEXNOW_MAX_URLS = 10_000

export interface IndexNowResult {
  status: number
  ok: boolean
  submitted: string[]
}

export function isIndexNowBrand(brand: string): brand is IndexNowBrand {
  return Object.hasOwn(INDEXNOW_SITES, brand)
}

export function blogPostUrls(brand: IndexNowBrand, slug: string): string[] {
  const origin = `https://${INDEXNOW_SITES[brand].host}`
  return [`${origin}/blog/${encodeURIComponent(slug)}`, `${origin}/blog`]
}

export function sitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(match => match[1]!.replaceAll('&amp;', '&'))
}

/**
 * Engines answer 422 for the whole batch when any URL is off-host, so foreign
 * URLs are refused here instead of silently poisoning a submission.
 */
export function buildIndexNowPayload(brand: IndexNowBrand, urls: string[]) {
  const { host, key } = INDEXNOW_SITES[brand]
  const urlList = [...new Set(urls)]
  const foreign = urlList.filter((url) => {
    try {
      return new URL(url).host !== host
    }
    catch {
      return true
    }
  })
  if (foreign.length) throw new Error(`URLs outside ${host}: ${foreign.join(', ')}`)
  if (!urlList.length) throw new Error('No URLs to submit')
  if (urlList.length > INDEXNOW_MAX_URLS) throw new Error(`More than ${INDEXNOW_MAX_URLS} URLs in one submission`)
  return { host, key, keyLocation: `https://${host}/${key}.txt`, urlList }
}

/** 200 = accepted, 202 = accepted while the key file is still being verified. */
export async function submitToIndexNow(
  brand: IndexNowBrand,
  urls: string[],
  fetchImpl: typeof fetch = fetch,
): Promise<IndexNowResult> {
  const payload = buildIndexNowPayload(brand, urls)
  const response = await fetchImpl(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  })
  return { status: response.status, ok: response.status === 200 || response.status === 202, submitted: payload.urlList }
}
