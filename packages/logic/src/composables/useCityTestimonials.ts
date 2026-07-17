import { computed, type ComputedRef } from 'vue'
import type Testimonial from '../utils/types/type/Testimonial'

/**
 * City-specific testimonials, fetched per city from /api/city-testimonials
 * (issue #322 PR10 — they no longer travel inside the master catalog payload).
 *
 * SSR-safe: useAsyncData resolves during server render, so the reviews stay in
 * the SSR HTML and hydrate from the payload without a second fetch. A fetch
 * failure or unknown slug degrades to an empty list — the reviews block is
 * non-critical and must never break the city page.
 *
 * These are the CITY-scoped reviews (props.city), never the brand-level
 * franchiseTestimonials that the home Reviews block renders (#312 contract).
 */
export default function useCityTestimonials(citySlug: string | undefined): ComputedRef<Testimonial[]> {
  const slug = citySlug ?? ''

  const { data } = useAsyncData<Testimonial[]>(
    `city-testimonials:${slug || 'none'}`,
    async () => {
      if (!slug) return []
      const res = await $fetch<{ testimonials: Testimonial[] }>('/api/city-testimonials', {
        query: { slug },
      })
      return res?.testimonials ?? []
    },
    { default: () => [] },
  )

  return computed(() => data.value ?? [])
}
