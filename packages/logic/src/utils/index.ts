/**
 * Barrel export de utils
 *
 * Shared utilities, types, and validation schemas
 */

// ============================================================================
// Date & Time Functions
// ============================================================================
export * from './useDateFunctions';

// ============================================================================
// Validation Functions
// ============================================================================
export * from './useValidateFunctions';

// ============================================================================
// String Functions
// ============================================================================
export { slugify } from './slugify';
export { renderChatMarkdown } from './renderChatMarkdown';
export { splitBubbles } from './splitBubbles';
export { extractChatActions } from './extractChatActions';
export type { ChatActions } from './extractChatActions';
export { buildChatPayloadMessages, CHAT_PAYLOAD_TAIL } from './buildChatPayloadMessages';
export type { ChatPayloadMessage } from './buildChatPayloadMessages';
export { normalizeReservationCode } from './reservationCode';

// ============================================================================
// Pricing
// ============================================================================
export { pickPriceForDate } from './pickPriceForDate';
export { isBeyondPricingHorizon, allRenderableBeyondHorizon } from './pricingHorizon';
export { pickRepresentativeDailyPrice } from './pickRepresentativeDailyPrice';
export { categoryOffersMonthly } from './categoryOffersMonthly';
export { pickEffectiveTotalCoverageUnitCharge } from './pickEffectiveTotalCoverage';
export { IVA_PERCENTAGE } from './ivaRate';
export { pickTotalCoverageChargeForDate } from './pickTotalCoverageCharge';
export { resolvePicoyPlacaExempt } from './isPicoyPlacaExempt';
export { isCategoryVisibleInCity } from './isCategoryVisibleInCity';
export { resolveCityBranchCorrection } from './resolveCityBranchCorrection';
export { openRangesForDate, isDayOpen, bookableSlotsForDate, nearestOpenDay, latestOpenDayOnOrBefore, nearestSlotByTime, returnDateForPickupChange } from './scheduleAvailability';
export { colombianHolidays, isHoliday } from './colombianHolidays';
export { buildCityReservationURL } from './buildCityReservationURL';
export type { CityReservationDates, CityReservationSurface } from './buildCityReservationURL';

// ============================================================================
// Analytics (typed GA4 event contract)
// ============================================================================
export {
  analyticsPageType,
  createContactClickHandler,
  createSpaPageViewTracker,
  normalizeAnalyticsErrorReason,
  trackAnalyticsEvent,
  trackGenerateLead,
  trackReservationOutcome,
} from './analytics';
export type {
  AnalyticsErrorReason,
  AnalyticsEventMap,
  AnalyticsEventName,
  AnalyticsItem,
  AnalyticsPageType,
  ChatOpenSource,
  ContactClickContext,
  ContactPlacement,
  PageViewSnapshot,
  ReservationErrorReason,
} from './analytics';

// ============================================================================
// Attribution (marketing origin capture)
// ============================================================================
export {
  default as buildAttributionTouch,
  ATTRIBUTION_SIGNAL_KEYS,
} from './attribution/buildAttributionTouch';
export type { AttributionCaptureContext, AttributionTouch } from './attribution/buildAttributionTouch';
export {
  persistAttribution,
  readStoredAttribution,
  ATTRIBUTION_STORAGE_KEY,
  ATTRIBUTION_TTL_MS,
} from './attribution/attributionStorage';

// ============================================================================
// Server Helpers
// ============================================================================
export { extractStructuredError } from './helpers/extractStructuredError';
export type { StructuredErrorForward } from './helpers/extractStructuredError';
export { mapAvailabilityFetchError } from './helpers/mapAvailabilityFetchError';
export { isBusinessUnavailabilityRecordError } from './helpers/isBusinessUnavailabilityRecordError';
export { isTimeoutFetchError } from './helpers/isTimeoutFetchError';
export {
  AVAILABILITY_FETCH_TIMEOUT_MS,
  RECORD_FETCH_TIMEOUT_MS,
} from './fetchTimeouts';
export { isBlockingSearchError } from './helpers/isBlockingSearchError';
export { pickupTimingIssue } from './helpers/pickupTimingIssue';
export type { PickupTimingIssue } from './helpers/pickupTimingIssue';
export { resolveReturnBranch } from './helpers/resolveReturnBranch';
export type { ReturnBranchResolution } from './helpers/resolveReturnBranch';

// ============================================================================
// Type Definitions - Data
// ============================================================================
export type { default as BranchData } from './types/data/BranchData';
export type { default as LocationSchedule, ScheduleDayKey } from './types/data/LocationSchedule';
export type { default as CategoryAvailabilityData } from './types/data/CategoryAvailabilityData';
export type { default as CategoryData } from './types/data/CategoryData';
export type { default as CategoryModelData } from './types/data/CategoryModelData';
export type { default as CategoryMonthPriceData } from './types/data/CategoryMonthPriceData';
export type { default as InsuranceTypeData } from './types/data/InsuranceTypeData';
export type { default as LocalizaErrorResponse } from './types/data/LocalizaErrorResponse';
export type { default as PageConfigData } from './types/data/PageConfigData';
export type { default as RecordReservationApiData } from './types/data/RecordReservationApiData';
export type { default as ReservasApiData, ExtrasData } from './types/data/ReservasApiData';
export type { ReservationApiStatus } from './types/data/ReservationApiStatus';
export type { default as VehicleCategoryData, VehicleCategory, VehicleCategoryModel } from './types/data/VehicleCategoryData';

// ============================================================================
// Type Definitions - Form Fields
// ============================================================================
export type { default as FormFields } from './types/fields/FormFields';
export type { default as FormRecordFields } from './types/fields/FormRecordFields';
export type { default as FormSubmitFields } from './types/fields/FormSubmitFields';

// ============================================================================
// Type Definitions - Props
// ============================================================================
export type { default as CategoryProps } from './types/props/CategoryProps';
// ReservationResumeProps NO se re-exporta desde el barrel a propósito: deriva su
// tipo de `ReturnType<typeof useCategory>`, así que re-exportarlo aquí arrastra el
// composable useCategory (y su subgrafo) a cualquier proyecto que importe el barrel
// de utils — incluido el proyecto server/node en `vue-tsc -b`, donde los globals de
// auto-import app no existen (TS2304). Se importa por ruta estrecha desde su .vue.

// ============================================================================
// Type Definitions - General Types
// ============================================================================
export type { default as AttributionInput } from './types/type/AttributionInput';
export type { default as City } from './types/type/City';
export type { default as FAQ } from './types/type/FAQ';
export type { default as Testimonial } from './types/type/Testimonial';
export type * from './types/type/BlogPost';
export type { CategoryType } from './types/type/CategoryType';
export type { default as ErrorMessage } from './types/type/ErrorMessage';
export type { IdentificationType } from './types/type/IdentificationType';
export type { default as Message } from './types/type/Message';
export type { MonthlyMileage } from './types/type/MonthlyMileage';
export type { default as PhoneInputOptionsType } from './types/type/PhoneInputOptionsType';

// ============================================================================
// Type Definitions - Vue Tel Input
// ============================================================================
export type { default as VueTelInputPhoneObject } from './types/vue-tel-input/VueTelInputPhoneObject';

// ============================================================================
// Validation Schemas
// ============================================================================
// Flight schemas removed (issue #322 SCEN-322-X07): no template ever collected
// aerolinea/numeroVueloIda, so the *WithFlight* branch was a dead validation trap.
export * from './validation/categoryForm';
export * from './validation/reservationForm';
export * from './validation/searcherForm';
export * from './validation/normalizePhoneNumber';
export * from './validation/userInformationForm';
export * from './categoryReadingOrder';
