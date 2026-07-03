// Máquina de pasos del wizard de reserva (alquicarros, marca-local).
//
// El wizard NO posee estado de dominio: la gama, el seguro y los adicionales viven
// en `useStoreSearchData.selectedCategory` (instancia de useCategory) y en
// `useStoreReservationForm`. Este composable solo orquesta EN QUÉ paso está el
// cliente y a cuáles puede navegar.
//
// El núcleo (WIZARD_STEPS, deriveStepFromRoute, createWizardMachine, canAdvance) es
// puro y testeable en aislamiento. `useReservationWizard()` es el envoltorio Nuxt
// que deriva el paso inicial del route y lo cablea a la máquina.

// External
import { ref, computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'

export type WizardStep = 'busqueda' | 'vehiculo' | 'seguro' | 'adicionales' | 'datos'

/** Los cinco pasos, en orden de presentación. */
export const WIZARD_STEPS: WizardStep[] = [
  'busqueda',
  'vehiculo',
  'seguro',
  'adicionales',
  'datos',
]

/** Número 1..5 del paso. */
export function stepNumber(step: WizardStep): number {
  return WIZARD_STEPS.indexOf(step) + 1
}

/**
 * Paso a partir de su número 1..5. Coerciona a entero finito antes de clampear:
 * un `NaN` o un fraccional (p.ej. si un caller pasara `2.5`) caerían fuera del
 * array y devolverían `undefined` pese al tipo `WizardStep`. No se exporta —
 * es un detalle interno de la máquina.
 */
function stepFromNumber(n: number): WizardStep {
  const int = Number.isFinite(n) ? Math.round(n) : 1
  const idx = Math.min(Math.max(int - 1, 0), WIZARD_STEPS.length - 1)
  return WIZARD_STEPS[idx]!
}

/**
 * Primer valor string de un param de ruta. Nuxt puede entregar `string | string[]`
 * (query keys repetidas); espeja el helper `firstQueryValue` de
 * `useSearchByQueryParams` para leer un único slug de forma consistente.
 */
function firstValue(v: unknown): string | undefined {
  const raw = Array.isArray(v) ? v[0] : v
  return raw == null ? undefined : String(raw)
}

/** Forma mínima de un route que la derivación necesita (query + params). */
export interface RouteLike {
  query?: Record<string, unknown>
  params?: Record<string, unknown>
}

/**
 * Deriva el paso inicial desde el URL, con valores SSR-estables:
 *   1. sin parámetros de búsqueda → `busqueda` (Paso 1).
 *   2. con `lugar_recogida` (en query de /reservas o en path params del deep-link)
 *      → al menos `vehiculo` (Paso 2).
 *   3. deep-link con `categoria` en el path → `seguro` (Paso 3), gama preseleccionada.
 *   4. `query.paso` posterior explícito → ese paso (compartir/rehidratar un paso avanzado).
 *
 * No lee stores ni Nuxt: es pura para poder testearla en aislamiento.
 */
export function deriveStepFromRoute(route: RouteLike | undefined | null): WizardStep {
  const query = route?.query ?? {}
  const params = route?.params ?? {}

  // Normaliza a un único string y descarta valores vacíos/whitespace: un
  // `?lugar_recogida=%20` NO cuenta como búsqueda presente.
  const pickup = (firstValue(query.lugar_recogida) ?? firstValue(params.lugar_recogida))?.trim()
  const hasSearch = Boolean(pickup)
  if (!hasSearch) return 'busqueda'

  // Precedencia: el deep-link con gama en el path (`/categoria/[gama]`) manda
  // sobre un `paso` del query — entra en Paso 3 (Seguro) con la gama elegida.
  if (firstValue(params.categoria)?.trim()) return 'seguro'

  // `paso` explícito válido en el query (rehidratar/compartir un paso avanzado).
  const paso = firstValue(query.paso)
  if (paso && (WIZARD_STEPS as string[]).includes(paso)) {
    return paso as WizardStep
  }

  // Búsqueda presente sin paso explícito → Paso 2 (resultados/segmentos).
  return 'vehiculo'
}

/** Estado de dominio (booleans) que gobierna si un paso puede avanzar. */
export interface WizardAdvanceState {
  /** La consulta de disponibilidad ya se ejecutó (aunque devuelva 0 categorías). */
  searchExecuted?: boolean
  /** Hay una gama/vehículo seleccionado. */
  hasSelectedCategory?: boolean
  /** El formulario de datos es válido. */
  formValid?: boolean
}

/**
 * ¿Puede avanzar el paso dado con el estado actual?
 *   - busqueda: requiere que la búsqueda se haya ejecutado.
 *   - vehiculo: requiere una gama seleccionada.
 *   - seguro: siempre (Básico preseleccionado).
 *   - adicionales: siempre (paso opcional).
 *   - datos: requiere formulario válido.
 */
export function canAdvance(step: WizardStep, state: WizardAdvanceState): boolean {
  switch (step) {
    case 'busqueda':
      return Boolean(state.searchExecuted)
    case 'vehiculo':
      return Boolean(state.hasSelectedCategory)
    case 'seguro':
      return true
    case 'adicionales':
      return true
    case 'datos':
      return Boolean(state.formValid)
  }
}

export interface WizardMachine {
  currentStep: Ref<WizardStep>
  currentStepNumber: ComputedRef<number>
  /** El paso más avanzado alcanzado (1..5). Retroceder NO lo baja. */
  maxReachedStep: Ref<number>
  /** ¿El paso (por nombre o número) ya fue alcanzado y es navegable? */
  canGoTo: (step: WizardStep | number) => boolean
  /** Navega a un paso ya alcanzado. Devuelve false si no es alcanzable aún. */
  goTo: (step: WizardStep | number) => boolean
  /** Avanza un paso (y sube maxReached). No pasa del último. */
  next: () => void
  /** Retrocede un paso. No baja del primero. */
  back: () => void
}

/**
 * Máquina de pasos con refs Vue. No conoce el dominio: solo posición y avance
 * máximo. Retroceder (goTo/back) conserva `maxReachedStep`, de modo que las
 * selecciones posteriores (que viven en los stores) no se pierden (SCEN-W-10).
 */
export function createWizardMachine(initial: WizardStep = 'busqueda'): WizardMachine {
  const currentStep = ref<WizardStep>(initial)
  const maxReachedStep = ref<number>(stepNumber(initial))

  const currentStepNumber = computed(() => stepNumber(currentStep.value))

  function toNumber(step: WizardStep | number): number {
    return typeof step === 'number' ? step : stepNumber(step)
  }

  function canGoTo(step: WizardStep | number): boolean {
    const n = toNumber(step)
    return Number.isInteger(n) && n >= 1 && n <= maxReachedStep.value
  }

  function goTo(step: WizardStep | number): boolean {
    const n = toNumber(step)
    if (!canGoTo(n)) return false
    currentStep.value = stepFromNumber(n)
    return true
  }

  function next(): void {
    const n = Math.min(currentStepNumber.value + 1, WIZARD_STEPS.length)
    currentStep.value = stepFromNumber(n)
    if (n > maxReachedStep.value) maxReachedStep.value = n
  }

  function back(): void {
    const n = Math.max(currentStepNumber.value - 1, 1)
    currentStep.value = stepFromNumber(n)
  }

  return {
    currentStep,
    currentStepNumber,
    maxReachedStep,
    canGoTo,
    goTo,
    next,
    back,
  }
}

/**
 * Envoltorio Nuxt: deriva el paso inicial del route actual y expone la máquina.
 * El cableado a los stores (canAdvance con estado de dominio, avance tras la
 * búsqueda) se conecta en los componentes del wizard (Fase 2+). Se mantiene
 * mínimo aquí para que el núcleo puro quede testeable sin Nuxt.
 */
export default function useReservationWizard(): WizardMachine {
  // `useRoute` es auto-import de Nuxt en el contexto de la app.
  const route = useRoute()
  const initial = deriveStepFromRoute({
    query: route.query as Record<string, unknown>,
    params: route.params as Record<string, unknown>,
  })
  return createWizardMachine(initial)
}
