import { slugify, type BranchData } from '@rentacar-main/logic/utils'

export interface FAQ {
  label: string
  content: string
}

export const getCityPriceAnswer = (cityName: string): string =>
  `El valor cambia según las fechas del viaje, el número de días, la categoría elegida y los carros disponibles en ${cityName}. Ingresa el periodo de tu reserva en el buscador para ver y comparar las tarifas vigentes.`

export const getCityPickupAnswer = (
  cityName: string,
  branches: BranchData[] = [],
): string => {
  const citySlug = slugify(cityName)
  const names = [...new Set(
    branches
      .filter((branch) => slugify(branch.city) === citySlug)
      .map((branch) => branch.name.trim())
      .filter(Boolean),
  )]

  if (names.length === 0) {
    return `Selecciona ${cityName} en el buscador y allí verás los lugares de recogida habilitados para tu reserva.`
  }

  if (names.length === 1) {
    return `Puedes recoger el carro en ${names[0]}, el punto habilitado en ${cityName}. Revisa en el buscador que esté disponible durante las fechas de tu viaje.`
  }

  const formattedNames = `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`
  return `En ${cityName} puedes elegir entre estos lugares de recogida: ${formattedNames}. El buscador te indicará cuáles tienen disponibilidad para las fechas seleccionadas.`
}
