import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Montería"
export const citySlug = "monteria"

// W1 placeholder: copied verbatim from the shared logic layer.
export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger mi carro en Montería?',
            content: getCityPickupAnswer('Montería')
        },
        {
            label: '¿Qué vehículo recomiendan para Montería y Córdoba?',
            content: 'Un compacto con buen aire acondicionado es ideal para el clima cálido de Montería. Para visitar fincas ganaderas o la zona costera, recomendamos camioneta para caminos rurales.'
        },
        {
            label: '¿Cuánto cuesta alquilar un carro en Montería?',
            content: getCityPriceAnswer('Montería')
        },
        {
            label: '¿Hay pico y placa en Montería?',
            content: 'Montería no tiene restricción de pico y placa para vehículos particulares actualmente. Puedes circular libremente cualquier día de la semana por toda la ciudad y el departamento.'
        },
        {
            label: '¿Puedo viajar a las playas desde Montería?',
            content: 'Sí, las playas de Coveñas y Tolú están a 1.5 horas de Montería por carretera pavimentada. También puedes ir a San Antero (1h) o tomar lanchas a las Islas de San Bernardo.'
        },
        {
            label: '¿Qué lugares puedo visitar con carro desde Montería?',
            content: 'Destinos de Córdoba: Coveñas y Tolú playas (1.5h), Lorica pueblo patrimonio (1h), Ciénaga de Ayapel (2h), Tierralta y Nudo de Paramillo (2h). Ganadería, playas y naturaleza.'
        }
    ]
