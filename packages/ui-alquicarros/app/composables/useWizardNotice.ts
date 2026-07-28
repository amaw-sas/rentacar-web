// Ranura única del aviso del wizard (alquicarros, marca-local — issue #368 B1).
//
// Dos escritores y un renderizador. Escriben el shell, al arrancar una búsqueda, y
// `StepVehicle`, al elegir vehículo. Lo renderiza el Paso 2 como banner `role="status"`.
//
// NO HAY LÓGICA DE BORRADO, y es deliberado. Las dos escrituras son incondicionales:
// quien escribe siempre deja la ranura en su estado correcto, con aviso o con `null`.
// Escribir solo cuando hay algo que anunciar deja el aviso ARMADO — y como `useState`
// es de ámbito de aplicación, un aviso armado y nunca visto viaja por navegación de
// cliente a otra ciudad o a `/reservas`.
//
// Las dos reglas de borrado que parecen naturales están envenenadas:
//
//   - Un watcher sobre `currentStep` borra el aviso antes de que se vea: el reset lo
//     escribe y acto seguido la red de seguridad (`ReservationWizard.vue:339-349`)
//     llama a `wizard.goTo('vehiculo')`.
//   - Colgarlo de `wizard.next()` es peor, porque DOS de sus cuatro invocadores son el
//     handshake de búsqueda (`:254` y `:266`), no el usuario. El fallo es determinista:
//     re-buscar con los mismos parámetros desde el Paso 2 hace que `:266` llame `next()`
//     al asentar y borre el aviso que el reset acababa de escribir.
//
// `useState` no está por SSR: está porque SOBREVIVE A UN REMONTAJE. En la superficie
// de path un re-buscar cambia los route params y puede remontar la página, llevándose
// por delante cualquier `ref` local. No sustituir por un ref de módulo.

// Types
import type { Ref } from 'vue'
import type { CarryDropped } from './useSelectionCarryOver'

export type WizardNotice =
  | { kind: 'search-reset' }
  | { kind: 'carry'; dropped: CarryDropped[] }
  | null

/** Clave única de la ranura. Una nota a la vez, a propósito. */
const NOTICE_KEY = 'wizard-notice'

export function useWizardNotice(): {
  notice: Ref<WizardNotice>
  setNotice: (next: WizardNotice) => void
} {
  const notice = useState<WizardNotice>(NOTICE_KEY, () => null)

  /** Escribe la ranura. Siempre se llama, con aviso o con `null`. */
  const setNotice = (next: WizardNotice): void => {
    notice.value = next
  }

  return { notice, setNotice }
}

/**
 * Texto del aviso. Vive junto a la ranura para que las dos formas se lean de una vez;
 * el componente solo lo pinta.
 *
 * Cada combinación tiene su frase entera en vez de componerse por trozos: pegar
 * etiquetas dentro de una plantilla obliga a un verbo que sirva para las dos pérdidas
 * ("no ofrece el plan de kilometraje" chirría) y a repetir el sujeto cuando caen las
 * dos. Son tres cadenas; escribirlas es más barato que leerlas mal.
 *
 * El aviso dice qué pasó y con qué se quedó el cliente, no le manda a revisar un paso:
 * en ese momento lo que necesita es saber por qué cambió lo que ya había elegido.
 */
export function noticeMessage(notice: WizardNotice): string {
  if (!notice) return ''

  if (notice.kind === 'search-reset') {
    return 'Volviste a buscar y los precios se calcularon otra vez. Elige el vehículo de nuevo.'
  }

  const cayoSeguro = notice.dropped.includes('seguroTotal')
  const cayoKilometraje = notice.dropped.includes('kilometraje')

  if (cayoSeguro && cayoKilometraje) {
    return 'Este vehículo no ofrece Seguro Total para tus fechas ni el plan de kilometraje que tenías. Te dejamos lo que sí tiene.'
  }
  if (cayoSeguro) {
    return 'Este vehículo no ofrece Seguro Total para tus fechas. Te dejamos el Seguro Básico.'
  }
  if (cayoKilometraje) {
    return 'Este vehículo no vende el plan de kilometraje que tenías. Te pusimos el que sí ofrece.'
  }
  return ''
}
