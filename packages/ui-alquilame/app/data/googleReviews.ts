export interface GoogleReview {
  name: string
  quote: string
  rating: 5
  relativeDate?: string
}

/** W1 placeholder. W5 will curate verbatim reviews from the audited Google export. */
export const googleReviews: readonly GoogleReview[] = []

/** Deterministic for a given slug; an empty result keeps current components on their fallback. */
export const pickCityReviews = (
  _slug: string,
  count = 3,
): readonly GoogleReview[] => googleReviews.slice(0, count)
