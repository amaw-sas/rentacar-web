/**
 * Identidad de la política de tratamiento de datos de alquilatucarro.
 *
 * POR QUÉ UNA CONSTANTE Y NO UNA FRASE EN LA PÁGINA: cada calificación baja de /opinion
 * guarda en el tablero contra qué versión se dio el consentimiento, y eso solo prueba
 * algo si la cadena guardada se puede resolver a un texto años después. La página decía
 * "Última actualización: Enero 2025" y se reservaba reescribirse sin archivar nada: un
 * puntero a un documento así no demuestra nada. Es la misma regla de
 * ui-alquilame/app/utils/policy.ts.
 *
 * POR QUÉ 2025-01 Y NO LA 2026-09 DE ALQUILAME: el texto publicado hoy en esta marca es
 * el fechado «Enero 2025», y nunca se archivó otra versión. Nombrar la 2026-09 sería
 * apuntar a una versión que alquilatucarro jamás publicó.
 *
 * REGLA DE USO: una versión publicada NO se reescribe. Si cambia el contenido, se sube
 * `POLICY_VERSION` y el texto anterior queda en el historial de git, que es el archivo.
 * Cambiar la política sin tocar esta constante deja a los consentimientos ya guardados
 * apuntando a algo que ya no existe.
 */
export const POLICY_VERSION = '2025-01'

/**
 * La frase bajo el formulario de /opinion (calificaciones de 1 a 3 estrellas), en dos
 * piezas porque la página la parte en dos: `OPINION_CONSENT_LEAD` va como texto y le
 * sigue, en línea, el enlace «política de privacidad» y el punto.
 *
 * `OPINION_CONSENT_TEXT` es la frase completa que se guarda en el tablero con cada
 * calificación baja. La prueba de la página (opinion.test.ts) exige que el texto
 * renderizado sea exactamente esta cadena, así que la frase mostrada y la guardada no
 * pueden separarse.
 *
 * Si se edita, hay que subir POLICY_VERSION: el par (versión, texto) es la prueba.
 */
export const OPINION_CONSENT_LEAD =
  'Al enviarlo autorizas el tratamiento de tus datos para atender tu caso, según la'

export const OPINION_CONSENT_TEXT = `${OPINION_CONSENT_LEAD} política de privacidad.`
