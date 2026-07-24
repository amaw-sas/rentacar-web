// Arnés de montaje del shell del wizard en jsdom (issue #368 B1, paso 4).
//
// Los escenarios del holdout piden evidencia de DOM sobre el SHELL, no sobre un
// componente hoja: el watcher de derivación `flush: 'sync'`, el reset por `pending`,
// la red de seguridad de deep-links y `canAdvanceCurrent` viven todos en
// `ReservationWizard.vue`. Montarlo en tres archivos distintos es cómo la fixture
// diverge en silencio entre ellos, así que la factoría vive aquí.
//
// El precedente de montaje en esta marca es `WizardSummary.mount.test.ts` (docblock
// `// @vitest-environment jsdom` en la línea 1), no `wizard-summary-price.test.ts`,
// que es regex sobre fuente. Cada archivo que consuma este arnés necesita el docblock:
// `vitest.config.ts:12` fija `environment: 'node'` para toda la marca.
//
// A diferencia del precedente, aquí Pinia es REAL. El shell y las instancias de
// `useCategory` que emiten las cards tienen que compartir store, y `storeToRefs`
// nativo tiene que funcionar; mockear pinia a identidad rompe las dos cosas.

// External
import { vi, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Ref } from 'vue'
import type { VueWrapper } from '@vue/test-utils'

// logic (los módulos REALES, no dobles)
import useStoreSearchData from '@rentacar-main/logic/stores/useStoreSearchData'
import useStoreReservationForm from '@rentacar-main/logic/stores/useStoreReservationForm'
import useCategory from '@rentacar-main/logic/composables/useCategory'
import useMoneyFormat from '@rentacar-main/logic/composables/useMoneyFormat'

// Types
import type {
  CategoryAvailabilityData,
  CategoryData,
  CategoryMonthPriceData,
  CategoryType,
} from '@rentacar-main/logic/utils'

// ── Fixtures ──────────────────────────────────────────────────────────────────

/**
 * Fila de precios mensuales. Los defaults venden 1k y 2k; poner un plan a 0 es lo
 * que el dashboard hace para retirarlo (limpia a NULL y el transformer mapea a 0).
 */
export function monthPriceRow(
  overrides: Partial<CategoryMonthPriceData> = {},
): CategoryMonthPriceData {
  return {
    '1k_kms': 3_000_000,
    '2k_kms': 3_600_000,
    '3k_kms': 0,
    init_date: '2026-01-01',
    end_date: '2026-12-31',
    total_insurance_price: 400_000,
    total_coverage_unit_charge: 30_000,
    one_day_price: 0,
    status: 'active',
    ...overrides,
  } as CategoryMonthPriceData
}

/**
 * Fila ADMIN de una gama (lo que sirve `rentacar-data`).
 *
 * `id` es load-bearing: `useStoreSearchData.ts:232` cruza por
 * `availabilityByCode.get(categoryAdmin.id)` contra un índice construido sobre
 * `row.categoryCode`. Si no coinciden, el join falla, el store sintetiza la fila con
 * el centinela 999999999, `renderable` (`StepVehicle.vue:205-210`) la descarta y sale
 * `groups.length === 0`: se pinta el estado vacío mientras `filteredCategories.length`
 * sigue valiendo 1. Todo escenario de arrastre correría entonces contra la rama vacía
 * con aspecto saludable. Por eso `mountWizard` afirma la rama de tiles.
 */
export function adminCategory(
  code: CategoryType,
  overrides: Partial<CategoryData> = {},
): CategoryData {
  return {
    id: code,
    identification: code,
    name: `Gama ${code}`,
    category: `Gama ${code} Automático`,
    description: '',
    image: '',
    ad: '',
    models: [{ model: `Modelo ${code}`, image: '' }],
    month_prices: [monthPriceRow()],
    extra_km_charge: 1_000,
    picoyplaca_exempt: false,
    // `isCategoryVisibleInCity` solo restringe con 'restricted'; cualquier otro
    // valor deja pasar la gama sea cual sea la ciudad de recogida.
    visibility_mode: 'all',
    allowed_cities: [],
    ...overrides,
  } as CategoryData
}

/**
 * Fila de DISPONIBILIDAD de una gama. Los importes son los de una reserva regular;
 * en mensual `createCategoryAvailability` los sintetiza en 0 y el precio vive en
 * `month_prices`, así que los escenarios mensuales los dejan como vengan.
 *
 * `totalCoverageUnitCharge` es lo que decide `canQuoteTotalCoverage`: un `null` apaga
 * la card de Seguro Total en reserva regular, que es la entrada de SCEN-368B1-02.
 */
export function availabilityRow(
  code: CategoryType,
  overrides: Partial<CategoryAvailabilityData> = {},
): CategoryAvailabilityData {
  return {
    categoryCode: code,
    categoryDescription: ' Automático',
    totalAmount: 700_000,
    estimatedTotalAmount: 900_000,
    vehicleDayCharge: 100_000,
    numberDays: 7,
    returnFeeAmount: 0,
    taxFeeAmount: 20_000,
    taxFeePercentage: 2,
    IVAFeeAmount: 133_000,
    IVAFeePercentage: 19,
    coverageUnitCharge: 20_000,
    coverageQuantity: 7,
    coverageTotalAmount: 140_000,
    totalCoverageUnitCharge: 45_000,
    referenceToken: `token-${code}`,
    rateQualifier: 'RQ',
    ...overrides,
  } as CategoryAvailabilityData
}

/** Entrada del mapa `vehicleCategories`: sin ella `renderable` descarta la gama. */
function vehicleCategoryEntry(code: CategoryType) {
  return {
    grupo: `Grupo ${code}`,
    descripcion_corta: `Gama ${code}`,
    modelos: [{ nombre: `Modelo ${code}`, imagen: '' }],
  }
}

// ── Stub de useState, de ámbito de módulo e indexado por clave ────────────────
//
// Dos consumidores, no uno: la ranura del aviso del wizard y `'rentacar-data'`
// (`useStoreAdminData.ts:6` importa `useFetchRentacarData` DIRECTO, así que esquiva
// el stub global de ese composable; sembrar la clave cubre las dos rutas).
//
// La clave tiene que devolver el MISMO ref entre montajes. Uno que entregue un ref
// nuevo por llamada haría que SCEN-368B1-09 pase por la razón equivocada y que
// SCEN-368B1-08 pase vacíamente — y son contrapuntos deliberados el uno del otro,
// así que ambos se pondrían verdes hiciera lo que hiciera la implementación.
const stateSlots = new Map<string, Ref<unknown>>()

function useStateStub<T>(key: string, init?: () => T): Ref<T> {
  let slot = stateSlots.get(key)
  if (!slot) {
    slot = ref(init ? init() : null) as Ref<unknown>
    stateSlots.set(key, slot)
  }
  return slot as Ref<T>
}

/** Limpia las ranuras entre tests. Sin esto el aviso viaja de un test al siguiente. */
export function resetWizardState(): void {
  stateSlots.clear()
}

// ── Montaje ───────────────────────────────────────────────────────────────────

export interface MountWizardOptions {
  /** Gamas disponibles, en orden. La primera es la del segmento que se abre solo. */
  codes?: CategoryType[]
  /** Sobrecargas por código para la fila admin (p. ej. `month_prices` distintos). */
  admin?: Partial<Record<string, Partial<CategoryData>>>
  /** Sobrecargas por código para la fila de disponibilidad. */
  availability?: Partial<Record<string, Partial<CategoryAvailabilityData>>>
  monthly?: boolean
  /** Fecha de recogida (ISO). Decide qué fila de precios aplica. */
  pickupDate?: string
  /** `?paso=` del route. Por defecto entra en el Paso 2. */
  paso?: string
}

export interface WizardHarness {
  wrapper: VueWrapper
  search: ReturnType<typeof useStoreSearchData>
  form: ReturnType<typeof useStoreReservationForm>
  /** Texto de una fila del resumen por su etiqueta ("Vehículo", "Seguro", …). */
  summaryRow: (label: string) => string | null
  /** Toggle de `pending` false→true→false, que es lo que dispara el reset. */
  runSearch: () => Promise<void>
  /** Clic en el CTA "Elegir" de una gama. Es el único disparador de `onSelect`. */
  selectGama: (code: CategoryType) => Promise<void>
}

const money = useMoneyFormat().moneyFormat

/**
 * Monta el shell con disponibilidad real y afirma sus propias precondiciones.
 *
 * Las afirma la factoría, no cada escenario, porque las dos formas conocidas de que
 * este arnés mienta producen verde con el DOM equivocado y ninguna se descubre
 * leyendo el componente:
 *
 *   1. Un `useRoute` sin `lugar_recogida` deja `deriveStepFromRoute` en `'busqueda'`:
 *      el shell renderiza el StepSearch stubeado y el DOM queda VACÍO, y aun así una
 *      aserción sobre el watcher de derivación pasa.
 *   2. Una fixture que no satisface el join del store pinta el estado vacío mientras
 *      `filteredCategories.length` vale 1.
 */
export async function mountWizard(options: MountWizardOptions = {}): Promise<WizardHarness> {
  const codes = options.codes ?? (['C', 'F'] as CategoryType[])
  const pickupDate = options.pickupDate ?? '2026-07-10'

  setActivePinia(createPinia())
  resetWizardState()

  const returnDate = options.monthly ? '2026-08-09' : '2026-07-17'

  const rentacarData = {
    categories: codes.map((code) => adminCategory(code, options.admin?.[code] ?? {})),
    // La sede tiene que existir aquí: `selectedPickupLocation` es un COMPUTED sobre
    // `searchBranchByCode(lugarRecogida)`, y su `.city` es lo que filtra
    // `filteredCategories` por visibilidad geográfica. Asignarlo a mano falla en
    // silencio ("target is readonly") y deja el filtro leyendo undefined.
    branches: [{ id: 1, code: 'BOGAER', name: 'Bogotá Aeropuerto', city: 'bogota' }],
    extras: undefined,
    vehicleCategories: Object.fromEntries(codes.map((code) => [code, vehicleCategoryEntry(code)])),
    cities: [],
    franchiseTestimonials: {},
    faqs: [],
  }

  vi.stubGlobal('useState', useStateStub)
  // Sembrada ANTES de que ningún store se instancie: `useStoreAdminData` lee
  // `useFetchRentacarData()` dentro de un computed, pero el grafo de stores se
  // construye en el primer `useStoreSearchData()` de abajo.
  useStateStub('rentacar-data', () => rentacarData)

  vi.stubGlobal('useFetchRentacarData', () => rentacarData)
  vi.stubGlobal('useMoneyFormat', useMoneyFormat)
  vi.stubGlobal('useCategory', useCategory)
  vi.stubGlobal('useStoreSearchData', useStoreSearchData)
  vi.stubGlobal('useStoreReservationForm', useStoreReservationForm)
  vi.stubGlobal('useSearchByQueryParams', () => undefined)
  // `useStoreSearchData.ts:43` llama `useMessages()`, y `useMessages.ts:7` llama
  // `useToast()` sin guard: sin este stub el store revienta antes de montar nada.
  vi.stubGlobal('useToast', () => ({ add: vi.fn(), remove: vi.fn() }))
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { rentacarFranchise: 'alquicarros' } }))
  vi.stubGlobal('useRoute', () => ({
    // Los seis parámetros de búsqueda. Sin `lugar_recogida` el shell entra en el
    // Paso 1 y no hay DOM que assertar.
    query: {
      lugar_recogida: 'bogota-aeropuerto',
      lugar_entrega: 'bogota-aeropuerto',
      fecha_recogida: pickupDate,
      fecha_entrega: '2026-07-17',
      hora_recogida: '10:00',
      hora_entrega: '10:00',
      ...(options.paso ? { paso: options.paso } : {}),
    },
    params: {},
  }))

  const search = useStoreSearchData()
  const form = useStoreReservationForm()

  // Solo las refs de verdad. `selectedPickupLocation` y `selectedDays` son computed
  // y escribirlos no hace nada más que un warn de Vue en stderr.
  form.haveMonthlyReservation = options.monthly ?? false
  form.lugarRecogida = 'BOGAER'
  form.lugarDevolucion = 'BOGAER'
  form.fechaRecogida = pickupDate
  form.fechaDevolucion = returnDate
  form.horaRecogida = '10:00'
  form.horaDevolucion = '10:00'

  search.categoriesAvailabilityData = codes.map((code) =>
    availabilityRow(code, options.availability?.[code] ?? {}),
  )

  const { default: ReservationWizard } = await import('../ReservationWizard.vue')
  const { default: StepVehicle } = await import('../steps/StepVehicle.vue')
  const { default: WizardSummary } = await import('../WizardSummary.vue')
  const { default: WizardVehicleCard } = await import('../WizardVehicleCard.vue')

  const wrapper = mount(ReservationWizard, {
    global: {
      // Los nombres son los de AUTO-IMPORT, no los de archivo: el shell escribe
      // `WizardStepsStepVehicle` y `StepVehicle` escribe `WizardVehicleCard`.
      // Registrar `{ StepVehicle }` no resuelve nada y el shell renderiza un hueco
      // en silencio — ni estado vacío ni tiles, que es exactamente cómo se ve.
      components: {
        WizardStepsStepVehicle: StepVehicle,
        WizardSummary,
        WizardVehicleCard,
      },
      stubs: {
        // Reales: el Paso 2, el resumen y la card — esta última es la que emite
        // `select` con la instancia de useCategory, o sea el único disparador de
        // `onSelect`. Sin ella no arranca ningún escenario de la fase 3.
        WizardStepper: true,
        WizardStepsStepSearch: true,
        WizardStepsStepCoverage: true,
        WizardStepsStepExtras: true,
        WizardStepsStepData: true,
        PlaceholdersCategoryCard: true,
        WizardVehicleSegmentTile: {
          props: ['segment', 'count', 'fromPrice', 'unavailable', 'active'],
          emits: ['select'],
          template:
            '<button data-testid="segment-tile" @click="$emit(\'select\')">{{ segment.label }}</button>',
        },
        Carrusel: true,
        UIcon: true,
        // El evento nativo se REENVÍA. `WizardVehicleCard.vue:71` escucha con
        // `@click.stop`, y el modificador de Vue llama `stopPropagation()` sobre lo
        // que reciba: un stub que emita `click` pelado lanza sobre `undefined`.
        // El test pasa igual y el fallo sale como excepción no capturada.
        UButton: {
          emits: ['click'],
          template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
        },
        IconsChevronDownIcon: true,
      },
    },
  })

  await nextTick()

  // ── Precondiciones del arnés ────────────────────────────────────────────────
  expect(wrapper.find('[data-testid="wizard-vehicle-empty-test"]').exists(),
    'el Paso 2 pintó el estado vacío: la fixture no satisface el join de useStoreSearchData:232').toBe(false)
  expect(wrapper.find('[data-testid="wizard-vehicle-error-test"]').exists(),
    'el Paso 2 pintó el estado de error').toBe(false)
  expect(wrapper.findAll('[data-testid="segment-tile"]').length,
    'se esperaba al menos un tile de segmento (rama de tiles alcanzada)').toBeGreaterThan(0)
  expect(wrapper.find('[data-testid="wizard-total-a-pagar"]').exists(),
    'el resumen no se montó').toBe(true)

  const summaryRow = (label: string): string | null => {
    const dts = wrapper.findAll('dt')
    const dt = dts.find((node) => node.text().trim() === label)
    if (!dt) return null
    const dd = dt.element.nextElementSibling
    return dd ? (dd.textContent ?? '').trim() : null
  }

  const runSearch = async (): Promise<void> => {
    search.pending = true
    await nextTick()
    search.pending = false
    await nextTick()
  }

  const selectGama = async (code: CategoryType): Promise<void> => {
    const cta = wrapper.find(`[data-testid="wizard-select-${code}-test"]`)
    expect(cta.exists(), `no se encontró el CTA "Elegir" de la gama ${code}`).toBe(true)
    await cta.trigger('click')
    await nextTick()
  }

  return { wrapper, search, form, summaryRow, runSearch, selectGama }
}

export { money }
