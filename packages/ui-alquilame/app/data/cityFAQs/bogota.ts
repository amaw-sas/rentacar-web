import { getCityPickupAnswer, getCityPriceAnswer, type FAQ } from './shared'

export const cityName = "Bogotá"
export const citySlug = "bogota"

export const faqs: FAQ[] = [
        {
            label: '¿Dónde puedo recoger un carro alquilado en Bogotá?',
            content: getCityPickupAnswer('Bogotá')
        },
        {
            label: '¿Qué clase de carro conviene para conducir en Bogotá?',
            content: 'Un compacto facilita los movimientos entre el tráfico y ocupa menos espacio al parquear. Si en tus planes están Villa de Leyva o el Eje Cafetero, considera un sedán para viajar con más comodidad durante los trayectos largos.'
        },
        {
            label: '¿Los carros de alquiler tienen pico y placa en Bogotá?',
            content: 'Sí. La medida también cobija a los vehículos alquilados y depende del último dígito de su placa. Cuando recibas el carro te diremos cuál es la restricción correspondiente para que organices tus recorridos.'
        },
        {
            label: '¿Cómo consulto el precio de alquiler de un carro en Bogotá?',
            content: getCityPriceAnswer('Bogotá')
        },
        {
            label: '¿Está permitido salir de Bogotá con el vehículo?',
            content: 'Sí, puedes conducirlo hacia cualquier ciudad del país. Entre los recorridos habituales están Villa de Leyva, a 3 horas; Girardot, a 2.5 horas; y el Eje Cafetero, a 7 horas. También puedes solicitar la devolución en otra ciudad pagando el cargo adicional.'
        },
        {
            label: '¿Qué debo presentar para rentar un carro en Bogotá?',
            content: 'Debes tener más de 21 años y presentar una licencia de conducción vigente, cédula o pasaporte y una tarjeta de crédito con cupo disponible. Si vienes del exterior, puedes usar la licencia de tu país mientras permanezcas en Colombia como turista.'
        }
    ]
