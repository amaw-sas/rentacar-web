/**
 * Identidad de la política de tratamiento de datos.
 *
 * POR QUÉ UNA CONSTANTE Y NO UNA FRASE EN LA PÁGINA: un PQRS guarda contra qué versión
 * aceptó el titular, y eso solo prueba algo si la cadena guardada se puede resolver a un
 * texto años después. La página decía "Última actualización: Enero 2025" y se reservaba
 * reescribirse sin archivar nada: un puntero a un documento así no demuestra nada.
 *
 * REGLA DE USO: una versión publicada NO se reescribe. Si cambia el contenido, se sube
 * `POLICY_VERSION` y el texto anterior queda en el historial de git, que es el archivo.
 * Cambiar la política sin tocar esta constante deja a los consentimientos ya guardados
 * apuntando a algo que ya no existe.
 */
export const POLICY_VERSION = '2026-09'

/**
 * La frase EXACTA que la persona lee al marcar la casilla, y que se guarda con su
 * radicación. Ante un requerimiento se enseña esto, no las doce secciones de la
 * política: es lo que tuvo delante en el momento de aceptar.
 *
 * Si se edita, hay que subir POLICY_VERSION: el par (versión, texto) es la prueba.
 */
export const CONSENT_TEXT =
  'Autorizo el tratamiento de mis datos personales conforme a la Política de ' +
  'Privacidad de AMAW S.A.S para atender y responder mi solicitud.'
