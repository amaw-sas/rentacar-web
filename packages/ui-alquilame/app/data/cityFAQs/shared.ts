import { slugify, type BranchData } from '@rentacar-main/logic/utils'

export interface FAQ {
  label: string
  content: string
}

export const getCityPriceAnswer = (cityName: string): string =>
  `Las tarifas de alquiler en ${cityName} dependen de las fechas, la duración, la categoría y la disponibilidad. Busca tus fechas para comparar las opciones disponibles.`

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
    return `Consulta en el buscador los puntos de recogida activos para ${cityName}. Las opciones disponibles se muestran al seleccionar la ciudad.`
  }

  if (names.length === 1) {
    return `El punto de recogida activo en ${cityName} es ${names[0]}. Confirma la disponibilidad para tus fechas en el buscador.`
  }

  const formattedNames = `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`
  return `Los puntos de recogida activos en ${cityName} son ${formattedNames}. Confirma la disponibilidad para tus fechas en el buscador.`
}
