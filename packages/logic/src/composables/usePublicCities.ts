export interface PublicCityLink {
  id: string
  name: string
}

/**
 * Compact, build-time navigation data for the public footer.
 *
 * The reservation catalog is intentionally route-scoped. Keeping these links
 * static means content, legal, and referral routes do not need to hydrate the
 * categories/branches/prices payload just to render site navigation.
 */
export const PUBLIC_CITIES: readonly PublicCityLink[] = Object.freeze([
  { id: 'armenia', name: 'Armenia' },
  { id: 'barranquilla', name: 'Barranquilla' },
  { id: 'bogota', name: 'Bogotá' },
  { id: 'bucaramanga', name: 'Bucaramanga' },
  { id: 'cali', name: 'Cali' },
  { id: 'cartagena', name: 'Cartagena' },
  { id: 'cucuta', name: 'Cúcuta' },
  { id: 'ibague', name: 'Ibagué' },
  { id: 'manizales', name: 'Manizales' },
  { id: 'medellin', name: 'Medellín' },
  { id: 'monteria', name: 'Montería' },
  { id: 'neiva', name: 'Neiva' },
  { id: 'pereira', name: 'Pereira' },
  { id: 'santa-marta', name: 'Santa Marta' },
  { id: 'valledupar', name: 'Valledupar' },
  { id: 'villavicencio', name: 'Villavicencio' },
  { id: 'floridablanca', name: 'Floridablanca' },
  { id: 'palmira', name: 'Palmira' },
  { id: 'soledad', name: 'Soledad' },
])

export function usePublicCities() {
  return {
    cities: PUBLIC_CITIES,
    cityCount: PUBLIC_CITIES.length,
  }
}
