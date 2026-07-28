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
 *   - seguro / adicionales: no imponen requisitos PROPIOS (Básico preseleccionado,
 *     adicionales opcionales), pero ninguno avanza con la gama anulada — esa es una
 *     precondición del flujo entero, no un requisito del paso. Sin ella, anular la
 *     cotización bajo los pies del usuario (issue #401) dejaba llegar a un «Confirmar
 *     reserva» que valibot rechaza en silencio (SCEN-W-07 enmendado).
 *   - datos: requiere formulario válido Y gama viva (misma razón).
 */
export function canAdvance(step: WizardStep, state: WizardAdvanceState): boolean {
  switch (step) {
    case 'busqueda':
      return Boolean(state.searchExecuted)
    case 'vehiculo':
      return Boolean(state.hasSelectedCategory)
    case 'seguro':
    case 'adicionales':
      return Boolean(state.hasSelectedCategory)
    case 'datos':
      return Boolean(state.formValid && state.hasSelectedCategory)
  }
}

// ── Invalidación de cotización por deriva del tramo (issue #401) ───────────────

/** Estado + evento que la máquina de invalidación consume en cada disparo. */
export interface StaleTransitionInput {
  /** `pending` actual (arg nuevo del watcher). */
  isPending: boolean
  /** `pending` anterior (arg viejo del watcher). */
  wasPending: boolean
  /** Firma del tramo VIVO en este instante (los seis campos de búsqueda). */
  liveSignature: string
  /** Firma del tramo con el que se pidió la disponibilidad en pantalla, o null. */
  quotedSignature: string | null
  /** Pestillo actual: la disponibilidad ya no corresponde al tramo vivo. */
  stale: boolean
}

/** Acciones a aplicar tras un disparo de la máquina de invalidación. */
export interface StaleTransitionResult {
  /** Nuevo valor de `quotedSearchSignature`. */
  quotedSignature: string | null
  /** Nuevo valor del pestillo `searchStale`. */
  stale: boolean
  /** Anular `selectedCategory` + `vehiculo` como CONSECUENCIA (no condición). */
  clearSelection: boolean
}

/**
 * Núcleo puro de la invalidación de #401. Decide, a partir del flanco de `pending`
 * y de la firma del tramo, si la cotización en pantalla quedó rancia. Se extrae del
 * watcher para poder aseverar los seis guards en aislamiento (SCEN-401-11/-13/-08b);
 * el watcher solo cablea refs y `flush: 'sync'` alrededor de esta función.
 *
 * El pestillo es asimétrico: lo baja una BÚSQUEDA (su arranque en guard 1 o su
 * resolución en guard 2), nunca una edición. Deshacer una edición NO lo baja: la
 * disponibilidad ya se tiró y no hay nada que recuperar sin volver a buscar
 * (SCEN-401-11).
 *
 * El flanco de `pending` NO es un discriminador perfecto de "búsqueda nueva": dos
 * search() con la primera en vuelo escriben `true` sobre `true` (sin flanco), vía
 * back/forward del navegador (useSearchByQueryParams) o un montaje de
 * useSearchByRouteParams a mitad de vuelo. Por eso guard 6 exige `!isPending`: con
 * una búsqueda en vuelo NO se latchea (sus resultados vienen en camino), y guard 2
 * los adopta al resolver. Sin esto, una reescritura de refs en vuelo latcheaba el
 * pestillo sobre resultados frescos y correctos, o anulaba la gama del usuario en
 * silencio (hallazgo del gate de edge-cases). El único residuo restante —editar el
 * tramo DESPUÉS de que doSearch leyó los refs pero ANTES de que resuelva— es el
 * best-effort que guard 2 asume, mucho más raro que la ventana que cierra.
 */
export function computeStaleTransition(input: StaleTransitionInput): StaleTransitionResult {
  const { isPending, wasPending, liveSignature, quotedSignature, stale } = input

  // 1. Búsqueda ARRANCA (pending false→true): captura el tramo consultado, baja el
  //    pestillo y descarta la gama vieja (su precio está congelado al tramo anterior).
  if (isPending && !wasPending) {
    return { quotedSignature: liveSignature, stale: false, clearSelection: true }
  }
  // 2. Búsqueda RESUELVE (pending true→false): los resultados en pantalla son del
  //    tramo que doSearch consultó ≈ el tramo vivo → adóptalo como cotizado y baja el
  //    pestillo. Cubre el montaje sin captura previa (quoted===null, SCEN-401-13) y la
  //    resolución de una segunda búsqueda arrancada sin flanco (true sobre true), que
  //    de otro modo dejaría el pestillo pegado sobre resultados frescos.
  if (!isPending && wasPending) {
    return { quotedSignature: liveSignature, stale: false, clearSelection: false }
  }
  // Guards 3-5: "sin cambios, pasa el estado actual". Se conservan como tres guards
  // separados porque cada uno documenta un invariante distinto y su precedencia.
  const noChange: StaleTransitionResult = { quotedSignature, stale, clearSelection: false }
  // 3. Nada consultado aún (quoted===null) sin flanco de búsqueda → nada rancio.
  if (quotedSignature === null) return noChange
  // 4. Ya latcheado: la anulación es idempotente, no se repite.
  if (stale) return noChange
  // 5. El tramo vivo sigue siendo el consultado.
  if (liveSignature === quotedSignature) return noChange
  // 6. Rancio: el tramo derivó y NO hay búsqueda en vuelo (una en vuelo trae
  //    resultados nuevos que guard 2 adoptará al resolver; latchear sobre ellos los
  //    ocultaría). `!isPending` ⇒ clamp de horario o edición del usuario.
  if (!isPending) {
    return { quotedSignature, stale: true, clearSelection: true }
  }
  // Reescritura de refs con una búsqueda en vuelo (true sobre true): no latchees; la
  // resolución (guard 2) adoptará el tramo consultado.
  return noChange
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
