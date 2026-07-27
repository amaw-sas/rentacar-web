import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Cali"
export const citySlug = "cali"

export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger el vehículo alquilado en Cali?',
            content: getCityPickupAnswer('Cali')
        },
        {
            label: '¿Qué tipo de carro debería elegir para mi viaje desde Cali?',
            content: 'Un compacto responde bien para trayectos dentro de Cali. Si vas hacia Buenaventura, en el Pacífico, o a San Cipriano, una camioneta ofrece mejor desempeño en esas rutas. Para viajar al Eje Cafetero, la opción indicada es un sedán.'
        },
        {
            label: '¿Cómo funciona el pico y placa para un carro rentado en Cali?',
            content: 'La medida sí aplica y se determina con el último número de la placa. Al entregarte el carro te indicaremos el día que le corresponde. Los fines de semana y los festivos no tienen esta restricción.'
        },
        {
            label: '¿Cómo sé cuánto vale alquilar un carro en Cali?',
            content: getCityPriceAnswer('Cali')
        },
        {
            label: '¿A dónde puedo ir por carretera desde Cali?',
            content: 'Entre las opciones están Buga y el Señor de los Milagros, a 1.5 horas; el Lago Calima, a 2 horas; Popayán, a 3 horas; y el Parque Natural Farallones. Con carro puedes acomodar estas salidas por el Valle del Cauca a tu horario.'
        },
        {
            label: '¿El carro de alquiler puede ir hasta la costa Pacífica?',
            content: 'Sí, está permitido conducir hasta Buenaventura y otros puntos de la costa Pacífica. Una camioneta ofrece mayor comodidad para este recorrido. Al reservar te explicaremos las precauciones especiales que requieren algunas zonas.'
        }
    ]
