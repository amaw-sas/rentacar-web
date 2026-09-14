import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = 'Cúcuta'
export const citySlug = 'cucuta'

export const faqs: FAQ[] = [
  {
    label: '¿Dónde puedo recoger el vehículo que reserve en Cúcuta?',
    content: getCityPickupAnswer('Cúcuta'),
  },
  {
    label: '¿Qué carro es más cómodo para el clima de Cúcuta?',
    content: 'Para la temperatura promedio de 28 °C, busca un compacto con aire acondicionado de buen desempeño. Si vas a continuar hacia Pamplona o la zona montañosa, un sedán puede darte mayor comodidad.',
  },
  {
    label: '¿De qué depende el valor del alquiler de carros en Cúcuta?',
    content: getCityPriceAnswer('Cúcuta'),
  },
  {
    label: '¿Cuándo se aplica la restricción de pico y placa en Cúcuta?',
    content: 'Sí aplica, en tres franjas de lunes a viernes: 7:00 a 8:30 AM, 11:30 AM a 2:30 PM y 5:30 a 7:30 PM. Con placa de otra ciudad, dentro de los anillos viales la restricción es continua de 7:00 AM a 8:00 PM.',
  },
  {
    label: '¿Está permitido llevar el carro alquilado hasta Venezuela?',
    content: 'No. Un vehículo de alquiler no está autorizado para cruzar una frontera internacional. Si tu viaje continúa hacia Venezuela, deja el carro en nuestra sede y realiza el cruce por el puente internacional.',
  },
  {
    label: '¿Qué lugares de Norte de Santander puedo conocer desde Cúcuta?',
    content: 'Villa del Rosario y su historia quedan a 15 minutos; Chinácota y su clima templado, a 1 hora; Pamplona, ciudad estudiantil, a 1.5 horas; y Ocaña, a 3 horas. Es una ruta entre patrimonio y dinámica fronteriza.',
  },
]
