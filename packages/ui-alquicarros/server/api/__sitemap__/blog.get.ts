import type { SitemapUrlInput } from '#sitemap/types'
import { defineSitemapEventHandler } from '#imports'
import { useSupabaseClient } from '../../../../logic/server/utils/supabase'

/**
 * Dynamic sitemap source for blog posts (issue #52, Step 10).
 *
 * Referenced from `sitemap.sources` in nuxt.config — replaces the hardcoded
 * `/blog/*` list that previously lived in `sitemap.urls`. Reads `blog_posts`
 * from Supabase (NOT `queryCollection`), so the "queryCollectionWithEvent
 * fails at runtime" failure mode the old hardcode worked around does not apply.
 *
 * Returns one entry per post for this brand; the `/blog` index stays static
 * in `sitemap.urls`.
 */
export default defineSitemapEventHandler(async (event) => {
  const franchise = useRuntimeConfig(event).public.rentacarFranchise as string

  const supabase = useSupabaseClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug,updated,date')
    .eq('brand', franchise)
    .order('date', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `sitemap blog query failed: ${error.message}` })
  }

  return (data ?? []).map((row) => ({
    loc: `/blog/${row.slug}`,
    lastmod: row.updated || row.date,
    changefreq: 'monthly',
    priority: 0.7,
  })) satisfies SitemapUrlInput[]
})
