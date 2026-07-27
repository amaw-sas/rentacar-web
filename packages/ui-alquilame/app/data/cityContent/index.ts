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
import type { CityContentEntry, CityExpandedContent } from './types'

export type {
  CityContentEntry,
  CityDestination,
  CityDrivingTips,
  CityExpandedContent,
} from './types'

export const cityContentEntries = [
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
] satisfies readonly CityContentEntry[]

const byCityName = new Map(cityContentEntries.map((entry) => [entry.cityName, entry]))
const byCitySlug = new Map(cityContentEntries.map((entry) => [entry.citySlug, entry]))

export const getCityContentEntry = (cityNameOrSlug: string): CityContentEntry | null =>
  byCityName.get(cityNameOrSlug) ?? byCitySlug.get(cityNameOrSlug) ?? null

/** Same public contract as the shared composable, backed only by Alquilame data. */
export const useCityExpandedContent = (cityName: string): CityExpandedContent | null =>
  getCityContentEntry(cityName)?.content ?? null

export const hasCityExpandedContent = (cityName: string): boolean =>
  getCityContentEntry(cityName) !== null

export const getCityMetaDescription = (cityNameOrSlug: string): string | null =>
  getCityContentEntry(cityNameOrSlug)?.metaDescription ?? null
