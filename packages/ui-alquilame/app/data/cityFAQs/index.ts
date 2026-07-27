import type { BranchData, ReservasApiData } from '@rentacar-main/logic/utils'

import * as armenia from './armenia'
import * as barranquilla from './barranquilla'
import * as bogota from './bogota'
import * as bucaramanga from './bucaramanga'
import * as cali from './cali'
import * as cartagena from './cartagena'
import * as cucuta from './cucuta'
import * as floridablanca from './floridablanca'
import * as ibague from './ibague'
import * as manizales from './manizales'
import * as medellin from './medellin'
import * as monteria from './monteria'
import * as neiva from './neiva'
import * as palmira from './palmira'
import * as pereira from './pereira'
import * as santaMarta from './santa-marta'
import * as soledad from './soledad'
import * as valledupar from './valledupar'
import * as villavicencio from './villavicencio'
import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export type { FAQ } from './shared'
export { getCityPickupAnswer, getCityPriceAnswer } from './shared'

interface CityFAQEntry {
  cityName: string
  citySlug: string
  faqs: FAQ[]
}

export const cityFAQEntries = [
  armenia,
  barranquilla,
  bogota,
  bucaramanga,
  cali,
  cartagena,
  cucuta,
  floridablanca,
  ibague,
  manizales,
  medellin,
  monteria,
  neiva,
  palmira,
  pereira,
  santaMarta,
  soledad,
  valledupar,
  villavicencio,
] satisfies readonly CityFAQEntry[]

const byCityName = new Map(cityFAQEntries.map((entry) => [entry.cityName, entry]))
const byCitySlug = new Map(cityFAQEntries.map((entry) => [entry.citySlug, entry]))

const getCityFAQEntry = (cityNameOrSlug: string): CityFAQEntry | null =>
  byCityName.get(cityNameOrSlug) ?? byCitySlug.get(cityNameOrSlug) ?? null

const generateTemplateFAQs = (cityName: string): FAQ[] => [
  {
    label: `¿Cuáles son los requisitos para alquilar un carro en ${cityName}?`,
    content: `Para alquilar un carro en ${cityName} necesitas: ser mayor de 21 años, presentar licencia de conducción vigente (nacional o extranjera), documento de identidad (cédula o pasaporte) y una tarjeta de crédito con cupo disponible a nombre del conductor principal.`,
  },
  {
    label: `¿Dónde puedo recoger mi carro en ${cityName}?`,
    content: getCityPickupAnswer(cityName),
  },
  {
    label: `¿Qué tipos de vehículos están disponibles en ${cityName}?`,
    content: `En ${cityName} ofrecemos tres categorías: carros compactos ideales para la ciudad, sedanes cómodos para viajes largos, y camionetas para familias o rutas de aventura. La disponibilidad depende de la fecha de tu reserva.`,
  },
  {
    label: `¿Cuánto cuesta alquilar un carro en ${cityName}?`,
    content: getCityPriceAnswer(cityName),
  },
  {
    label: `¿Puedo devolver el carro en otra ciudad diferente a ${cityName}?`,
    content: `Sí, ofrecemos servicio de devolución en ciudad diferente. Si recoges en ${cityName} puedes devolver en cualquiera de nuestras 19 ciudades. Este servicio tiene un cargo adicional por traslado.`,
  },
  {
    label: `¿El seguro está incluido en el alquiler en ${cityName}?`,
    content: `Todos nuestros vehículos en ${cityName} incluyen seguro básico obligatorio (SOAT) y responsabilidad civil. Ofrecemos protecciones adicionales opcionales para mayor tranquilidad durante tu viaje.`,
  },
]

export const getCityFAQs = (cityName: string, branches: BranchData[] = []): FAQ[] => {
  const faqs = getCityFAQEntry(cityName)?.faqs ?? generateTemplateFAQs(cityName)
  return faqs.map((faq) =>
    faq.label.startsWith('¿Dónde puedo recoger')
      ? { ...faq, content: getCityPickupAnswer(cityName, branches) }
      : faq,
  )
}

export interface CityFAQSchema {
  '@type': 'FAQPage'
  mainEntity: Array<{
    '@type': 'Question'
    name: string
    acceptedAnswer: {
      '@type': 'Answer'
      text: string
    }
  }>
}

/** Pure builder used by both the schema composable and the S3 parity test. */
export const buildCityFAQSchema = (faqs: FAQ[]): CityFAQSchema => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.label,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.content,
    },
  })),
})

export const useCityFAQs = (cityName: string): FAQ[] => {
  const data = useState<ReservasApiData | null>('rentacar-data')
  return getCityFAQs(cityName, data.value?.branches ?? [])
}

export const useCityFAQSchema = (cityName: string) => {
  const faqs = useCityFAQs(cityName)
  useSchemaOrg([buildCityFAQSchema(faqs)])
  return { faqs }
}
