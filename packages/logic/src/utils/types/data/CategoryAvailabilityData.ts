import type { CategoryType } from '../type/CategoryType';
import type CategoryModelData from './CategoryModelData';
import type CategoryMonthPriceData from './CategoryMonthPriceData';

export default interface CategoryAvailabilityData {
  categoryCode: CategoryType;
  categoryDescription: string;
  categoryModels?: CategoryModelData[];
  categoryMonthPrices?: CategoryMonthPriceData[];
  totalAmount: number;
  estimatedTotalAmount: number;
  vehicleDayCharge: number;
  numberDays: number;
  discountAmount?: number;
  discountPercentage?: number;
  returnFeeAmount?: number;
  taxFeeAmount: number;
  taxFeePercentage: number;
  IVAFeeAmount: number;
  coverageUnitCharge: number;
  coverageQuantity: number;
  coverageTotalAmount: number;
  // Per-day "Seguro Total" charge for the searched pickup date, selected via
  // pickTotalCoverageChargeForDate (issue #322 PR10). `null` = no active
  // pricing row applies to the date → coverage cannot be quoted and the UI
  // must omit the Seguro Total option instead of showing a wrong price.
  totalCoverageUnitCharge: number | null;
  extraHoursQuantity?: number;
  extraHoursUnityAmount?: number;
  extraHoursTotalAmount?: number;
  referenceToken: string;
  rateQualifier: string;
  // Issue #28: pico y placa exemption from the dashboard column (sole source of
  // truth; null/absent → not exempt). See resolvePicoyPlacaExempt.
  picoyplacaExempt?: boolean | null;
  // Issue #28 Ola C: geographic visibility from the dashboard (visibility_mode +
  // whitelisted city slugs). See isCategoryVisibleInCity.
  visibilityMode?: string;
  allowedCities?: string[];
}
