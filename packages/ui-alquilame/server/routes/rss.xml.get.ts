import { useSupabaseClient } from '../../../logic/server/utils/supabase'

/**
 * GET /rss.xml — dynamic RSS 2.0 feed (issue #52, Step 11).
 *
 * Generated from this brand's `blog_posts` rows. Replaces the static
 * `public/rss.xml` snapshot. URLs derive from the request origin so the
 * feed is correct per brand/host.
 */
const CHANNEL = {
  title: 'Blog de Alquilame',
  description:
    'Guías, tips y consejos para alquilar carros en Colombia. Rutas, requisitos y recomendaciones para tu viaje.',
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export default defineEventHandler(async (event) => {
  const franchise = useRuntimeConfig(event).public.rentacarFranchise as string
  const origin = getRequestURL(event).origin

  const supabase = useSupabaseClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug,title,description,date,updated,category')
    .eq('brand', franchise)
    .order('date', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `rss query failed: ${error.message}` })
  }

  const posts = data ?? []
  const lastBuild = posts[0]?.updated || posts[0]?.date
  const lastBuildDate = (lastBuild ? new Date(lastBuild) : new Date(0)).toUTCString()

  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${origin}/blog/${p.slug}</link>
      <guid isPermaLink="true">${origin}/blog/${p.slug}</guid>
      <description>${escapeXml(p.description ?? '')}</description>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <category>${escapeXml(p.category ?? '')}</category>
    </item>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(CHANNEL.title)}</title>
    <link>${origin}/blog</link>
    <description>${escapeXml(CHANNEL.description)}</description>
    <language>es-co</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  setResponseHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  return xml
})
