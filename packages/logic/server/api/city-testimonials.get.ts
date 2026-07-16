import { useSupabaseClient } from '../utils/supabase'
import { parseTestimonials } from '../utils/transformers'
import { rentacarDataCacheKey } from '../utils/rentacarDataCacheKey'
import type Testimonial from '../../src/utils/types/type/Testimonial'

// Issue #322 PR10: city testimonials used to travel inside the master catalog
// (/api/rentacar-data) — ~35KB shipped on every page while only the city pages
// render them. This endpoint serves them per city; useCityTestimonials is the
// client entry point.
//
// Slug charset guard: the slug participates in the cache key, so it is
// restricted to the canonical slug alphabet — no cache-key injection, no
// unbounded key cardinality from junk requests.
const SLUG_RE = /^[a-z0-9-]{1,64}$/

export default defineCachedEventHandler(async (event) => {
  const slug = String(getQuery(event).slug ?? '')
  if (!SLUG_RE.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid city slug' })
  }

  const supabase = useSupabaseClient()
  const { data, error } = await supabase
    .from('cities')
    .select('testimonials')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, message: `City testimonials query failed: ${error.message}` })
  }

  // Unknown/inactive city → empty list, not a 404: the reviews block is
  // non-critical and the city page must keep rendering.
  return {
    testimonials: (data ? parseTestimonials(data.testimonials) : []) as Testimonial[],
  }
}, {
  maxAge: 3600,
  name: 'city-testimonials',
  // Same deploy-scoping rationale as rentacar-data (restored Nitro cache across
  // builds), plus the validated slug for per-city entries. getKey runs before
  // the handler, so the slug is normalized defensively here too.
  getKey: (event) => {
    const slug = String(getQuery(event).slug ?? '')
    const safeSlug = SLUG_RE.test(slug) ? slug : 'invalid'
    return `${rentacarDataCacheKey(useRuntimeConfig(event).app.buildId)}:${safeSlug}`
  },
})
