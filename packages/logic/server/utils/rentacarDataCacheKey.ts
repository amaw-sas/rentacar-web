/**
 * Cache key for the `/api/rentacar-data` cached handler, scoped to a single
 * deployment via Nuxt's per-build `app.buildId`.
 *
 * Why: Vercel restores Nitro's persisted handler cache across builds. Keyed by
 * the request alone, a new build inherits the previous deploy's cached response
 * — whose schema may predate the current code (e.g. a body without `faqs`),
 * which crashes the `/` prerender. Scoping the key to `buildId` puts a restored
 * entry under the previous build's key, so it is never served to a new build;
 * within a single deploy the key is stable, so prerender + runtime still share
 * one cache entry.
 *
 * An empty or missing `buildId` would collapse every build onto one shared key
 * and re-create the leak, so we fail loud rather than degrade silently. A throw
 * here rejects the handler's `$fetch`, surfacing through the plugin as the
 * `[rentacar-data] fetch failed:` fail-loud path (SCEN-003) — never a silent
 * fallback to Nitro's request-derived key.
 */
export function rentacarDataCacheKey(buildId: string): string {
  if (typeof buildId !== 'string' || buildId.length === 0) {
    throw new Error(
      'rentacar-data cache: app.buildId is empty (check runtimeConfig.app / a NITRO_APP_BUILD_ID override); refusing a deploy-shared cache key that would leak stale responses across deploys',
    )
  }
  return buildId
}
