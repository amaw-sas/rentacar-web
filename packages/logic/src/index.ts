/**
 * Barrel export principal del paquete @rentacar-main/logic
 *
 * Este archivo exporta todo lo necesario para usar el paquete via
 * import { ... } from '@rentacar-main/logic/src'
 *
 * Los composables y stores se auto-importan via Nuxt Layer,
 * por lo que no necesitas importarlos manualmente en componentes Vue.
 */

// Config (para app.config.ts)
export * from './config'

// Utils (tipos, validaciones, funciones de utilidad)
export * from './utils'

// Composables (se auto-importan via Nuxt Layer, pero también exportados aquí)
export * from './composables/useAggregateRating'
export * from './composables/useBaseSEO'
export * from './composables/useBreadcrumbs'
export * from './composables/useLocalBusiness'
export * from './composables/useProductSchema'
export * from './composables/usePromotionSchema'
export * from './composables/useVideoSchema'
export * from './composables/useCityContent'
export { useCityFAQSchema, useCityFAQs } from './composables/useCityFAQs'
export * from './composables/useCityPageSEO'
export * from './composables/useCityProductSchema'
export * from './composables/useCityRelations'
export * from './composables/useCategory'
export * from './composables/useSearch'
export * from './composables/useSearchByRouteParams'
export * from './composables/useSearchPageSEO'
export * from './composables/useVehicleCategories'
export * from './composables/useData'
export * from './composables/useFetchCategoriesAvailabilityData'
export * from './composables/useFetchRentacarData'
export * from './composables/useDefaultRouteParams'
export * from './composables/useMessages'
export * from './composables/useMoneyFormat'
export * from './composables/usePhoneField'
export * from './composables/useRecordReservationForm'

// Stores (se auto-importan via Nuxt Layer, pero también exportados aquí)
export { default as useStoreAdminData } from './stores/useStoreAdminData'
export { default as useStoreReservationForm } from './stores/useStoreReservationForm'
export { default as useStoreSearchData } from './stores/useStoreSearchData'
