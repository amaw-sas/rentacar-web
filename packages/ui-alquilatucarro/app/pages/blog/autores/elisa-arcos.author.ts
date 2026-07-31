/**
 * Datos de la firma de alquilatucarro (issue #440).
 *
 * Persona real de la operación. Los hechos vienen del dueño, no están inventados:
 * administradora turística, fotógrafa, más de quince años en servicio al cliente
 * y administración.
 *
 * `blog-author-alquilatucarro.test.ts` (SCEN-A1) vigila que ningún campo vuelva
 * a quedar como marcador. Inventarle credenciales a una persona con nombre y cara
 * es peor que firmar como empresa: Google trata al autor falso como señal de
 * desconfianza, y quien busque a Elisa Arcos y no encuentre a nadie hace un daño
 * que no se arregla con SEO.
 *
 * Falta la foto, en `./images/elisa-arcos.{avif,webp,jpg,jpeg,png}`. La página se
 * ve bien sin ella; agregarla es soltar el archivo ahí.
 */
export const AUTHOR = {
  name: 'Elisa Arcos',
  jobTitle: 'Administradora Turística',
  path: '/blog/autores/elisa-arcos',
  bio: [
    'Elisa Arcos es administradora turística y fotógrafa, con más de quince años en servicio al cliente y administración.',
    'Esa mezcla es la que trae al blog: la formación en turismo para entender cómo se arma un viaje, y quince años atendiendo gente para saber qué pregunta de verdad quien está a punto de alquilar un carro.',
  ],
  metaDescription:
    'Elisa Arcos, administradora turística y fotógrafa con más de 15 años en servicio al cliente, firma las guías de viaje de Alquila tu Carro.',
} as const
