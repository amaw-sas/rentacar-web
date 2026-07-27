export interface GoogleReview {
  name: string
  quote: string
  rating: 5
  relativeDate?: string
}

export const GOOGLE_REVIEWS_URL =
  'https://www.google.com/maps?cid=11824841242913553901'

/**
 * Curated from the audited Google Maps export captured on 2026-07-27.
 * Quotes intentionally preserve the customers' spelling, punctuation and spacing.
 */
export const googleReviews = [
  {
    name: 'Nicolas Conde Moreno',
    quote: 'Muy buena experiencia, carros en perfecto estado y todo es muy facil para arrendar',
    rating: 5,
    relativeDate: 'Hace un mes',
  },
  {
    name: 'Sergio Arenas Guzman',
    quote: 'Excelente servicio\nDiligencia sencilla y rápida\nMuchas gracias',
    rating: 5,
    relativeDate: 'Hace 3 meses',
  },
  {
    name: 'Natalia Carreño',
    quote: 'Recomendado 100% buenos precisos, carros en muy buen estado perfecto todo sin problema alguno, el personal siempre está atento a cualquier solicitud lo que también me gustó',
    rating: 5,
    relativeDate: 'Hace 2 meses',
  },
  {
    name: 'Gael Joaquín Vargas Moreno',
    quote: 'Excelente servicio, ágil y buenos descuentos, lo recomiendo, nosotros alquilamos en santa Marta.',
    rating: 5,
    relativeDate: 'Hace 5 meses',
  },
  {
    name: 'Daniela Madrid',
    quote: 'Muy buena, los carros son modernos y muy limpios, el personal en el aeropuerto montería muy amable',
    rating: 5,
    relativeDate: 'Hace 3 meses',
  },
  {
    name: 'James Mina Mina A',
    quote: 'Una buena atención y prestación del servicio',
    rating: 5,
    relativeDate: 'Hace 6 meses',
  },
  {
    name: 'Juan Fernando Castellanos villa',
    quote: 'Entregaron un carro nuevo e impecable, los servicios los mejores',
    rating: 5,
    relativeDate: 'Hace 2 meses',
  },
  {
    name: 'israel mayorquin camacho',
    quote: 'Excelente servicio muy buena atención demasiado fácil',
    rating: 5,
    relativeDate: 'Hace 6 meses',
  },
  {
    name: 'Itz zaikendo',
    quote: 'Muy buenos carros, muy nuevos e impecables, en mi caso me entregaron un Kia soluto y con 8-9 mil km, y puedes viajar por todo colombia con km ilimitados, sin sobrecargos o abonos',
    rating: 5,
    relativeDate: 'Hace 2 meses',
  },
  {
    name: 'Gustavo berrio loaiza',
    quote: 'Muy buen servicio, rapido, sin complicaciones, muy buenos vehiculos, todo me gusto,  yo volveria a utilizar este servicio sin dudarlo',
    rating: 5,
    relativeDate: 'Hace 2 meses',
  },
  {
    name: 'L i n A r c o s',
    quote: 'me encanto la experiencia, buen servicio pre y post venta',
    rating: 5,
    relativeDate: 'Hace un mes',
  },
  {
    name: 'Ayellen González',
    quote: 'Excelente experiencia! Muy buena atención',
    rating: 5,
    relativeDate: 'Hace 2 meses',
  },
  {
    name: 'JHON FABIO GARCIA P.',
    quote: 'Muy bonita experiencia  un vehículo de alta calidad cumplieron las expectativas gracias.. permitiéndome disfrutar las maravillas de nuestro país.',
    rating: 5,
    relativeDate: 'Hace 6 meses',
  },
  {
    name: 'Julio Palomino',
    quote: 'Buenos carros, buen servicio',
    rating: 5,
    relativeDate: 'Hace 6 meses',
  },
  {
    name: 'BRAYAN SANCHEZ',
    quote: 'Excelente servicio, excelentes vehículos y muy rápidos los tramites',
    rating: 5,
    relativeDate: 'Hace 4 meses',
  },
  {
    name: 'john correa',
    quote: 'Excelentes precios y vehículos nuevos',
    rating: 5,
    relativeDate: 'Hace 6 meses',
  },
  {
    name: 'Julio Parra',
    quote: 'Excelente servicio, los recomiendo mucho !!!',
    rating: 5,
    relativeDate: 'Hace 3 meses',
  },
  {
    name: 'Laura Pulido',
    quote: 'Excelente servicio, muy fácil de realizar el alquiler y con transparencia sin cobros raros adicionales',
    rating: 5,
    relativeDate: 'Hace 7 meses',
  },
  {
    name: 'Alexander Quinter',
    quote: 'Super excelentes en todo en entrega en recibir en todo sentido mun buena empresa',
    rating: 5,
    relativeDate: 'Editado Hace 5 meses',
  },
  {
    name: 'Monik Beltran',
    quote: 'Vehículos en muy buen estado, modelos recientes y cómodos',
    rating: 5,
    relativeDate: 'Hace 6 meses',
  },
  {
    name: 'JUAN CAMILO BERMUDEZ GIRALDO',
    quote: 'Me gusto mucho usar el Kia, encantado de usar ese tipo de carro volveria, ademas muy economico en el consumo de gasolina.',
    rating: 5,
    relativeDate: 'Hace 6 meses',
  },
  {
    name: 'Jhon Altahona',
    quote: 'Fácil, rápido y excelente atención los vehículos de primera calidad',
    rating: 5,
    relativeDate: 'Hace 6 meses',
  },
  {
    name: 'Diego Forero',
    quote: 'Una buena experiencia con ustedes en el alquiler del auto.',
    rating: 5,
    relativeDate: 'Hace 3 meses',
  },
  {
    name: 'Yuri Cadena',
    quote: 'Excelente, poder tener independencia cuando se realiza turismo en Colombia, ya que la mayoría de transporte oficial se aprovecha del turista.',
    rating: 5,
    relativeDate: 'Hace 7 meses',
  },
  {
    name: 'Raul Ramirez',
    quote: 'Un extraordinario servicio, muchas gracias. La gente muy atenta.',
    rating: 5,
    relativeDate: 'Hace 8 meses',
  },
] as const satisfies readonly GoogleReview[]

type CuratedGoogleReviewName = (typeof googleReviews)[number]['name']

const PINNED_REVIEW_BY_CITY = {
  'santa-marta': 'Gael Joaquín Vargas Moreno',
  monteria: 'Daniela Madrid',
} as const satisfies Readonly<Record<string, CuratedGoogleReviewName>>

const citySpecificReviewNames = new Set<CuratedGoogleReviewName>(
  Object.values(PINNED_REVIEW_BY_CITY),
)

const CITY_SELECTION_INDEX = {
  armenia: 0,
  barranquilla: 1,
  bogota: 2,
  bucaramanga: 3,
  cali: 4,
  cartagena: 5,
  cucuta: 6,
  floridablanca: 7,
  ibague: 8,
  manizales: 9,
  medellin: 10,
  monteria: 11,
  neiva: 12,
  palmira: 13,
  pereira: 14,
  'santa-marta': 15,
  soledad: 16,
  valledupar: 17,
  villavicencio: 18,
} as const

function stableHash(value: string): number {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

/** Return a stable city-specific selection without claiming non-local reviews are local. */
export const pickCityReviews = (
  slug: string,
  count = 3,
): readonly GoogleReview[] => {
  const limit = Math.max(0, Math.min(Math.trunc(count), googleReviews.length))

  if (limit === 0) return []

  const normalizedSlug = slug.trim().toLowerCase()
  const pinnedName = PINNED_REVIEW_BY_CITY[normalizedSlug]
  const pinnedReview = pinnedName
    ? googleReviews.find((review) => review.name === pinnedName)
    : undefined

  const reviewPool = googleReviews.filter(
    (review) => !citySpecificReviewNames.has(review.name),
  )
  const knownCityIndex = CITY_SELECTION_INDEX[
    normalizedSlug as keyof typeof CITY_SELECTION_INDEX
  ]
  const startIndex = knownCityIndex
    ?? stableHash(normalizedSlug) % reviewPool.length
  // The first three offsets form a cyclic difference set: known city trios
  // share at most one reviewer. Remaining offsets only serve custom counts.
  const selectionOffsets = [
    0,
    1,
    3,
    ...reviewPool.map((_, index) => index).filter(
      (index) => index !== 0 && index !== 1 && index !== 3,
    ),
  ]
  const rankedReviews = selectionOffsets.map(
    (offset) => reviewPool[(startIndex + offset) % reviewPool.length]!,
  )

  return [...(pinnedReview ? [pinnedReview] : []), ...rankedReviews].slice(0, limit)
}
