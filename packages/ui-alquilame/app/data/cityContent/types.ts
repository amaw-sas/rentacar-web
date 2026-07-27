export interface CityDestination {
  name: string
  time: string
  description: string
}

export interface CityDrivingTips {
  picoPlaca: string
  tolls: string
  parking: string
}

export interface CityExpandedContent {
  intro: string
  destinations: CityDestination[]
  drivingTips: CityDrivingTips
  bestSeason: string
}

export interface CityContentEntry {
  cityName: string
  citySlug: string
  metaDescription: string
  content: CityExpandedContent
}
