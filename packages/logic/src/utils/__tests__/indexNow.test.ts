import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_SITES,
  blogPostUrls,
  buildIndexNowPayload,
  isIndexNowBrand,
  sitemapLocs,
  submitToIndexNow,
} from '../indexNow'

const PACKAGES = join(__dirname, '..', '..', '..', '..')

describe('IndexNow', () => {
  it.each(Object.entries(INDEXNOW_SITES))('%s serves its key file with exactly the key', (brand, { key }) => {
    const file = readFileSync(join(PACKAGES, `ui-${brand}`, 'public', `${key}.txt`), 'utf8')

    expect(key).toMatch(/^[a-f0-9]{32}$/)
    expect(file).toBe(key)
  })

  it('leaves alquicarros out while it is under construction', () => {
    expect(isIndexNowBrand('alquicarros')).toBe(false)
    expect(isIndexNowBrand('alquilame')).toBe(true)
  })

  it('maps a blog slug to the article and the blog index on the brand host', () => {
    expect(blogPostUrls('alquilame', 'de-santa-marta-al-tayrona-y-palomino')).toEqual([
      'https://alquilame.co/blog/de-santa-marta-al-tayrona-y-palomino',
      'https://alquilame.co/blog',
    ])
  })

  it('decodes every XML entity, not only &amp;', () => {
    expect(sitemapLocs("<loc>https://alquilame.co/a?q=&quot;x&quot;&amp;n=&apos;1&apos;&amp;amp;</loc>")).toEqual(['https://alquilame.co/a?q="x"&n=\'1\'&amp;'])
  })

  it('reads every <loc> from a sitemap, decoding &amp;', () => {
    const xml = '<urlset><url><loc>https://alquilame.co/</loc></url><url><loc> https://alquilame.co/a?x=1&amp;y=2 </loc><image:loc>https://alquilame.co/i.webp</image:loc></url></urlset>'

    expect(sitemapLocs(xml)).toEqual(['https://alquilame.co/', 'https://alquilame.co/a?x=1&y=2'])
  })

  it('builds the protocol payload with the root key location and deduplicated URLs', () => {
    expect(buildIndexNowPayload('alquilatucarro', ['https://alquilatucarro.com/bogota', 'https://alquilatucarro.com/bogota'])).toEqual({
      host: 'alquilatucarro.com',
      key: INDEXNOW_SITES.alquilatucarro.key,
      keyLocation: `https://alquilatucarro.com/${INDEXNOW_SITES.alquilatucarro.key}.txt`,
      urlList: ['https://alquilatucarro.com/bogota'],
    })
  })

  it.each([
    ['another brand', ['https://alquilame.co/blog']],
    ['the www host', ['https://www.alquilatucarro.com/blog']],
    ['a malformed URL', ['not a url']],
    ['an empty list', []],
  ])('refuses %s before sending anything', (_label, urls) => {
    expect(() => buildIndexNowPayload('alquilatucarro', urls)).toThrow()
  })

  it.each([
    [200, true],
    [202, true],
    [403, false],
    [422, false],
    [429, false],
  ])('POSTs JSON to the shared endpoint and reads %i as ok=%s', async (status, ok) => {
    const fetchImpl = vi.fn(async () => new Response(null, { status }))

    const result = await submitToIndexNow('alquilame', ['https://alquilame.co/blog'], fetchImpl as unknown as typeof fetch)

    expect(result).toEqual({ status, ok, submitted: ['https://alquilame.co/blog'] })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(INDEXNOW_ENDPOINT)
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toMatchObject({ host: 'alquilame.co', urlList: ['https://alquilame.co/blog'] })
  })
})
