/**
 * Relaciones entre ciudades para internal linking SEO
 * Basado en proximidad geográfica y rutas turísticas comunes
 */

export interface RelatedCity {
    id: string
    name: string
    distance: string // Tiempo aproximado en carro
}

/**
 * Mapeo de ciudades relacionadas por proximidad geográfica
 * Cada ciudad tiene 3-4 ciudades cercanas para internal linking
 */
const cityRelations: Record<string, RelatedCity[]> = {
    'bogota': [
        { id: 'villavicencio', name: 'Villavicencio', distance: '2.5 horas' },
        { id: 'ibague', name: 'Ibagué', distance: '3 horas' },
        { id: 'medellin', name: 'Medellín', distance: '8 horas' },
        { id: 'neiva', name: 'Neiva', distance: '4 horas' },
    ],
    'medellin': [
        { id: 'pereira', name: 'Pereira', distance: '3 horas' },
        { id: 'manizales', name: 'Manizales', distance: '3 horas' },
        { id: 'armenia', name: 'Armenia', distance: '4 horas' },
        { id: 'bogota', name: 'Bogotá', distance: '8 horas' },
    ],
    'cali': [
        { id: 'palmira', name: 'Palmira', distance: '30 minutos' },
        { id: 'armenia', name: 'Armenia', distance: '2 horas' },
        { id: 'pereira', name: 'Pereira', distance: '3 horas' },
        { id: 'bogota', name: 'Bogotá', distance: '8 horas' },
    ],
    'barranquilla': [
        { id: 'soledad', name: 'Soledad', distance: '20 minutos' },
        { id: 'cartagena', name: 'Cartagena', distance: '2 horas' },
        { id: 'santa-marta', name: 'Santa Marta', distance: '2 horas' },
        { id: 'valledupar', name: 'Valledupar', distance: '4 horas' },
    ],
    'cartagena': [
        { id: 'barranquilla', name: 'Barranquilla', distance: '2 horas' },
        { id: 'santa-marta', name: 'Santa Marta', distance: '4 horas' },
        { id: 'monteria', name: 'Montería', distance: '4 horas' },
        { id: 'soledad', name: 'Soledad', distance: '2.5 horas' },
    ],
    'santa-marta': [
        { id: 'barranquilla', name: 'Barranquilla', distance: '2 horas' },
        { id: 'cartagena', name: 'Cartagena', distance: '4 horas' },
        { id: 'valledupar', name: 'Valledupar', distance: '3 horas' },
        { id: 'soledad', name: 'Soledad', distance: '2.5 horas' },
    ],
    'bucaramanga': [
        { id: 'floridablanca', name: 'Floridablanca', distance: '15 minutos' },
        { id: 'cucuta', name: 'Cúcuta', distance: '3 horas' },
        { id: 'bogota', name: 'Bogotá', distance: '7 horas' },
        { id: 'medellin', name: 'Medellín', distance: '7 horas' },
    ],
    'pereira': [
        { id: 'armenia', name: 'Armenia', distance: '30 minutos' },
        { id: 'manizales', name: 'Manizales', distance: '45 minutos' },
        { id: 'cali', name: 'Cali', distance: '3 horas' },
        { id: 'medellin', name: 'Medellín', distance: '3 horas' },
    ],
    'armenia': [
        { id: 'pereira', name: 'Pereira', distance: '30 minutos' },
        { id: 'manizales', name: 'Manizales', distance: '1 hora' },
        { id: 'cali', name: 'Cali', distance: '2 horas' },
        { id: 'ibague', name: 'Ibagué', distance: '2 horas' },
    ],
    'manizales': [
        { id: 'pereira', name: 'Pereira', distance: '45 minutos' },
        { id: 'armenia', name: 'Armenia', distance: '1 hora' },
        { id: 'medellin', name: 'Medellín', distance: '3 horas' },
        { id: 'bogota', name: 'Bogotá', distance: '6 horas' },
    ],
    'ibague': [
        { id: 'bogota', name: 'Bogotá', distance: '3 horas' },
        { id: 'armenia', name: 'Armenia', distance: '2 horas' },
        { id: 'neiva', name: 'Neiva', distance: '3 horas' },
        { id: 'pereira', name: 'Pereira', distance: '2.5 horas' },
    ],
    'neiva': [
        { id: 'ibague', name: 'Ibagué', distance: '3 horas' },
        { id: 'bogota', name: 'Bogotá', distance: '4 horas' },
        { id: 'cali', name: 'Cali', distance: '6 horas' },
        { id: 'villavicencio', name: 'Villavicencio', distance: '6 horas' },
    ],
    'villavicencio': [
        { id: 'bogota', name: 'Bogotá', distance: '2.5 horas' },
        { id: 'neiva', name: 'Neiva', distance: '6 horas' },
        { id: 'ibague', name: 'Ibagué', distance: '5 horas' },
    ],
    'cucuta': [
        { id: 'bucaramanga', name: 'Bucaramanga', distance: '3 horas' },
        { id: 'floridablanca', name: 'Floridablanca', distance: '3 horas' },
        { id: 'bogota', name: 'Bogotá', distance: '10 horas' },
    ],
    'monteria': [
        { id: 'cartagena', name: 'Cartagena', distance: '4 horas' },
        { id: 'medellin', name: 'Medellín', distance: '6 horas' },
        { id: 'barranquilla', name: 'Barranquilla', distance: '5 horas' },
    ],
    'valledupar': [
        { id: 'santa-marta', name: 'Santa Marta', distance: '3 horas' },
        { id: 'barranquilla', name: 'Barranquilla', distance: '4 horas' },
        { id: 'cartagena', name: 'Cartagena', distance: '6 horas' },
    ],
    'floridablanca': [
        { id: 'bucaramanga', name: 'Bucaramanga', distance: '15 minutos' },
        { id: 'cucuta', name: 'Cúcuta', distance: '3 horas' },
        { id: 'bogota', name: 'Bogotá', distance: '7 horas' },
    ],
    'palmira': [
        { id: 'cali', name: 'Cali', distance: '30 minutos' },
        { id: 'armenia', name: 'Armenia', distance: '2 horas' },
        { id: 'pereira', name: 'Pereira', distance: '3 horas' },
        { id: 'bogota', name: 'Bogotá', distance: '8 horas' },
    ],
    'soledad': [
        { id: 'barranquilla', name: 'Barranquilla', distance: '20 minutos' },
        { id: 'cartagena', name: 'Cartagena', distance: '2.5 horas' },
        { id: 'santa-marta', name: 'Santa Marta', distance: '2.5 horas' },
        { id: 'valledupar', name: 'Valledupar', distance: '4 horas' },
    ],
}

/**
 * Returns related cities for internal linking
 * @param cityId - The city ID (lowercase, no accents)
 * @returns Array of related cities with links
 */
export const useRelatedCities = (cityId: string): RelatedCity[] => {
    return cityRelations[cityId.toLowerCase()] || []
}

/**
 * Check if a city has related cities defined
 */
export const hasRelatedCities = (cityId: string): boolean => {
    return cityId.toLowerCase() in cityRelations
}
