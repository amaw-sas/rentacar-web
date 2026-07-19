import type { Brand } from 'schema-dts'

/**
 * Stable entity identifiers shared by every public brand graph.
 *
 * AMAW does not have a separate public corporate site in this repository, so
 * its primary live brand site is the canonical home for the parent entity ID.
 * Keeping this value independent from the current request host prevents the
 * same company from becoming three unrelated Organizations in JSON-LD.
 */
export const AMAW_ORGANIZATION_URL = 'https://alquilatucarro.com'
export const AMAW_ORGANIZATION_ID = `${AMAW_ORGANIZATION_URL}/#amaw-sas`

export const PUBLIC_BRAND_IDENTITIES = [
  { name: 'Alquilatucarro', url: 'https://alquilatucarro.com' },
  { name: 'Alquilame', url: 'https://alquilame.co' },
  { name: 'Alquicarros', url: 'https://alquicarros.com' },
] as const

const withoutTrailingSlash = (url: string) => url.replace(/\/+$/, '')

const toBrand = (name: string, url: string): Brand => {
  const canonicalUrl = withoutTrailingSlash(url)

  return {
    '@type': 'Brand',
    '@id': `${canonicalUrl}/#brand`,
    name,
    url: canonicalUrl,
  }
}

export const getCurrentBrandIdentity = (
  currentBrand: string,
  currentWebsite: string,
): Brand => {
  const knownBrand = PUBLIC_BRAND_IDENTITIES.find(({ name }) => name === currentBrand)
  return toBrand(currentBrand, knownBrand?.url ?? currentWebsite)
}

export const getOrganizationBrandIdentities = (
  currentBrand: string,
  otherBrands: readonly string[],
  currentWebsite: string,
): Brand[] => {
  const configuredNames = new Set([currentBrand, ...otherBrands])
  const knownBrands = PUBLIC_BRAND_IDENTITIES
    .filter(({ name }) => configuredNames.has(name))
    .map(({ name, url }) => toBrand(name, url))

  // Tests, local experiments, or a future brand may not yet exist in the
  // canonical map. The active brand still receives a complete runtime Brand
  // entity; unknown related names are omitted until they have a real URL.
  if (!PUBLIC_BRAND_IDENTITIES.some(({ name }) => name === currentBrand)) {
    knownBrands.push(toBrand(currentBrand, currentWebsite))
  }

  return knownBrands
}
