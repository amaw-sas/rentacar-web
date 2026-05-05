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

// ============================================================================
// Pricing
// ============================================================================
export { pickPriceForDate } from './pickPriceForDate';
export { pickEffectiveTotalCoverageUnitCharge } from './pickEffectiveTotalCoverage';

// ============================================================================
// Server Helpers
// ============================================================================
export { extractStructuredError } from './helpers/extractStructuredError';
export type { StructuredErrorForward } from './helpers/extractStructuredError';

// ============================================================================
// Type Definitions - Data
// ============================================================================
export type { default as BranchData } from './types/data/BranchData';
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
export type { default as ReservationResumeProps } from './types/props/ReservationResumeProps';

// ============================================================================
// Type Definitions - General Types
// ============================================================================
// FAQ type aún viene del config barrel; City y Testimonial se mudaron
// a types/type/ como parte del Step 8 (issue #6).
export type { default as City } from './types/type/City';
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
export * from './validation/categoryForm';
export * from './validation/flightForm';
export * from './validation/reservationForm';
export * from './validation/reservationWithFlightForm';
export * from './validation/searcherForm';
export * from './validation/userInformationForm';
export * from './validation/userInformationWithFlightForm';
