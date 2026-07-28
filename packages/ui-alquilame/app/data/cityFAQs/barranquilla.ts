import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Barranquilla"
export const citySlug = "barranquilla"

export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger un vehículo de alquiler en Barranquilla?',
            content: getCityPickupAnswer('Barranquilla')
        },
        {
            label: '¿Cuál carro conviene para manejar en Barranquilla?',
            content: 'Dentro de la ciudad funciona bien un compacto con buen aire acondicionado, especialmente por el clima. Para continuar por la costa hasta Cartagena o Santa Marta, un sedán ofrece más comodidad durante el trayecto.'
        },
        {
            label: '¿Cómo puedo consultar la tarifa de alquiler en Barranquilla?',
            content: getCityPriceAnswer('Barranquilla')
        },
        {
            label: '¿Puedo llevar el carro de Barranquilla a Cartagena o Santa Marta?',
            content: 'Sí. Desde Barranquilla, Cartagena queda a 2 horas y Santa Marta a 1.5 horas. Las dos carreteras son seguras y están bien pavimentadas; además, tienes la opción de entregar el vehículo en cualquiera de esas ciudades.'
        },
        {
            label: '¿Los carros particulares tienen pico y placa en Barranquilla?',
            content: 'En la actualidad no existe esa restricción para los vehículos particulares en Barranquilla. Puedes conducir cualquier día de la semana sin depender del número de la placa.'
        },
        {
            label: '¿Qué destinos cercanos puedo recorrer desde Barranquilla?',
            content: 'Puedes ir a Cartagena en 2 horas, a Santa Marta y el Parque Tayrona en 2 horas, a las playas de Puerto Colombia en 30 minutos o al pueblo artesanal de Usiacurí en 1 hora.'
        }
    ]
