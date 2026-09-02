import { useSupabaseClient } from '../utils/supabase'
import { fetchRentacarData, RentacarDataTimeoutError } from '../utils/rentacarDataFetch'
import { buildMonthlyAnchorMap } from '../utils/monthlyAnchors'
import { buildPriceFloor } from '../utils/priceFloors'
import { transformCategories, transformBranches, transformExtras, transformVehicleCategories, transformCities, transformFranchiseTestimonials, transformFAQs } from '../utils/transformers'

// Catalog freshness has one cache clock: the one-hour ISR window declared by
// each price-bearing page. Do not add a handler cache here. Stacking another
// TTL would let a document regenerate from an older catalog snapshot and push
// tariff staleness beyond the documented one-hour SLA.
export default defineEventHandler(async (event) => {
  const supabase = useSupabaseClient()

  // Issue #322 PR10: scope the franchises query to this deploy's brand — each
  // deployment serves exactly one brand, so cross-brand testimonials were pure
  // payload bloat (perf #11). Empty/absent config (standalone logic layer)
  // falls back to unfiltered, preserving the old behavior.
  const franchiseCode = useRuntimeConfig(event).public?.rentacarFranchise as string | undefined

  // Monthly struck-price anchor pilot. This is the ONLY place the flag is read:
  // the value never reaches the client, so a brand can be flipped on in its own
  // Vercel project without shipping a different bundle.
  const monthlyAnchorsEnabled = useRuntimeConfig(event).public?.priceAnchorMonthly === 'on'

  // Home "desde" claim (migration 142). Same read-once-on-the-server contract as
  // the anchors flag above, and the reason it is a flag at all: the floor is
  // computed for all three franchises, so which brand PUBLISHES it is a decision,
  // not an accident of which rows happen to exist. Today only alquilame.
  const priceFloorsEnabled = useRuntimeConfig(event).public?.priceFloorHomeSeo === 'on'

  const [categoriesResult, locationsResult, companyResult, citiesResult, franchisesResult, faqsResult, anchorsResult, floorsResult] =
    await fetchRentacarData(supabase, undefined, franchiseCode, monthlyAnchorsEnabled, priceFloorsEnabled).catch((err) => {
      if (err instanceof RentacarDataTimeoutError) {
        throw createError({ statusCode: 504, statusMessage: 'rentacar-data upstream timeout' })
      }
      throw err
    })

  if (categoriesResult.error) {
    throw createError({ statusCode: 500, message: `Categories query failed: ${categoriesResult.error.message}` })
  }
  if (locationsResult.error) {
    throw createError({ statusCode: 500, message: `Locations query failed: ${locationsResult.error.message}` })
  }
  // A missing `localiza` row (PGRST116 from .single()) must NOT crash the
  // page: extras fall back client-side (useCategory `?? 12000`). PGRST116 here
  // means zero rows or a transient failure only — never a duplicate, since
  // rental_companies.code is UNIQUE — so tolerating companyResult.error cannot
  // silently mask an integrity violation. Categories/branches/cities/
  // franchises/faqs errors keep throwing — those break the booking flow.
  // See issue #16, Finding 1.
  if (citiesResult.error) {
    throw createError({ statusCode: 500, message: `Cities query failed: ${citiesResult.error.message}` })
  }
  if (franchisesResult.error) {
    throw createError({ statusCode: 500, message: `Franchises query failed: ${franchisesResult.error.message}` })
  }
  if (faqsResult.error) {
    throw createError({ statusCode: 500, message: `FAQs query failed: ${faqsResult.error.message}` })
  }

  // DELIBERATE exception to the 500 pattern above: the anchors only cap a
  // struck-through price. Throwing here would let one accessory table take the
  // entire catalog — and with it the booking flow of all three brands — down.
  // Warn, drop the cap, serve the catalog. Pinned by test so a refactor that
  // "harmonises" the error handling above cannot quietly delete this.
  if (anchorsResult?.error) {
    console.warn('[rentacar-data] monthly price anchors unavailable; serving catalog without the monthly cap:', anchorsResult.error)
  }
  const monthlyAnchors = anchorsResult?.error
    ? {}
    : buildMonthlyAnchorMap(anchorsResult?.data as Parameters<typeof buildMonthlyAnchorMap>[0])

  // Same deliberate exception, and here the fail-open IS the feature: with no
  // floor the home title publishes no number at all rather than falling back to
  // the list price, which is the $220.000 defect this replaced.
  if (floorsResult?.error) {
    console.warn('[rentacar-data] price floors unavailable; serving catalog without the home price claim:', floorsResult.error)
  }
  const dayPriceFloorGross = floorsResult?.error
    ? null
    : buildPriceFloor(floorsResult?.data as Parameters<typeof buildPriceFloor>[0])
  // Losing the claim without an error is the quiet failure: rows that are all
  // stale, all below the sample threshold, or all missing a fiscal factor read
  // exactly like a healthy empty response. Say it once here so a title that has
  // silently gone numeric-less is greppable instead of merely invisible.
  if (priceFloorsEnabled && !floorsResult?.error && dayPriceFloorGross === null) {
    console.warn('[rentacar-data] price floors carried nothing publishable; the home title will show no price')
  }

  return {
    // Coupled to the body (rather than client receipt time) so an ISR-restored
    // snapshot retains its real age throughout an open SPA session.
    catalogFetchedAt: Date.now(),
    // Cheapest gama's real p05 day price, taxes in — the only figure honest
    // enough to publish as "desde". Top-level and already reduced to one number
    // because its single consumer (useHomeSEO) speaks for the whole catalog,
    // not for a gama the visitor has not picked yet.
    //
    // Absent vs null is load-bearing and must not be "simplified" to always
    // emitting the key. ABSENT = this brand never opted into the real floor, so
    // useHomeSEO keeps the legacy list-rate claim. NULL = it DID opt in and
    // there is nothing publishable today (stale, thin sample, table down), so
    // the title must publish no number at all. Collapsing the two would make a
    // stale pipeline silently reprint the $220.000 this replaced — the exact
    // failure the floor exists to prevent.
    ...(priceFloorsEnabled ? { dayPriceFloorGross } : {}),
    // `undefined` keeps transformCategories' own todayIsoUtc() default — the
    // handler has no business picking the pruning date.
    categories: transformCategories(categoriesResult.data, undefined, monthlyAnchors),
    // Supabase infers the to-one `cities(slug)` embed as an array (the explicit-
    // column select yields a structured type, unlike the `*` selects), but the
    // FK is to-one, so at runtime `cities` is a single object|null — matching
    // SupabaseLocation. Assert the real runtime shape; transformBranches reads
    // `row.cities?.slug`. (The `*`-based transforms above infer `any` and pass.)
    branches: transformBranches(locationsResult.data as unknown as Parameters<typeof transformBranches>[0]),
    extras: companyResult.error || !companyResult.data
      ? undefined
      : transformExtras(companyResult.data),
    vehicleCategories: transformVehicleCategories(categoriesResult.data),
    cities: transformCities(
      citiesResult.data,
      locationsResult.data as unknown as Parameters<typeof transformCities>[1],
    ),
    franchiseTestimonials: transformFranchiseTestimonials(franchisesResult.data),
    faqs: transformFAQs(faqsResult.data),
  }
})
