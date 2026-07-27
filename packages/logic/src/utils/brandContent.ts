import { PUBLIC_BRAND_IDENTITIES } from './structuredDataIdentity'
import type { ContentBrand } from './trailingSlashRedirect'

/**
 * Brand-name hygiene for shared editorial content.
 *
 * The 16 blog articles were authored for Alquilatucarro and `seed-blog-posts.ts`
 * upserted the same `body` for all three brands, changing only `author_name`
 * (issue #362). Alquicarros and Alquilame therefore published six sentences
 * each naming their sister brand — "En Alquilatucarro tenemos sedes…".
 *
 * Display names are derived from `PUBLIC_BRAND_IDENTITIES` so the brand roster
 * keeps a single source of truth rather than a fourth hardcoded map.
 */
const AUTHORING_BRAND: ContentBrand = 'alquilatucarro'

const DISPLAY_NAME_BY_BRAND = Object.fromEntries(
  PUBLIC_BRAND_IDENTITIES.map(({ name }) => [name.toLowerCase(), name]),
) as Record<ContentBrand, string>

/**
 * Matches the authoring brand only as a standalone word outside a URL.
 *
 * What each part actually does — worth stating precisely, because the obvious
 * reading is wrong:
 *
 * - Searching for the single word "Alquilatucarro" is what spares "Alquila tu
 *   carro", ordinary Spanish for "rent your car". That phrase appears four
 *   times across two articles as a heading and a call to action, is legitimate
 *   on every brand, and rewriting it would produce "Alquicarros hoy." The word
 *   boundaries do NOT do this work — a space-free literal could never match a
 *   three-word phrase. They only stop the token matching inside a longer word.
 *   Do not "simplify" this pattern into `Alquila\s*tu\s*carro`.
 * - The lookbehind and lookahead keep URLs intact: contacto@alquilatucarro.com,
 *   https://alquilatucarro.com/blog, and /img/alquilatucarro/logo.png all
 *   survive. No article currently contains one, but a re-seed could add any of
 *   them, and rewriting a path segment turns a working link into a 404.
 *
 * Matching is case-insensitive but always emits the canonical display name, so
 * a stray "ALQUILATUCARRO" normalizes rather than propagating its casing.
 */
const AUTHORING_BRAND_TOKEN = /(?<![/@])\bAlquilatucarro\b(?![./][a-z])/gi

/**
 * Rewrites sister-brand mentions in `text` to `brand`'s own display name.
 *
 * Idempotent, and a no-op for the authoring brand, whose articles name it
 * correctly. Every other character is preserved byte-for-byte.
 */
export function replaceBrandToken(text: string, brand: ContentBrand): string {
  if (brand === AUTHORING_BRAND) return text

  const displayName = DISPLAY_NAME_BY_BRAND[brand]
  if (!displayName) return text

  return text.replace(AUTHORING_BRAND_TOKEN, displayName)
}

/**
 * Number of authoring-brand mentions present in `text`, for any brand.
 *
 * Deliberately brand-agnostic. The six sentences that named Alquilatucarro were
 * rewritten to franchise-neutral copy on all three brands, so the article body
 * should now name no franchise at all — including on Alquilatucarro itself.
 * Used by the migration script's verification pass to assert the count reaches
 * zero without re-implementing the matching rules.
 */
export function countAuthoringBrandMentions(text: string): number {
  return text.match(AUTHORING_BRAND_TOKEN)?.length ?? 0
}
