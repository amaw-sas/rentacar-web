import type { CategoryType } from '../type/CategoryType';
import type CategoryModelData from './CategoryModelData';
import type CategoryMonthPriceData from './CategoryMonthPriceData';

export default interface CategoryData {
  id: CategoryType;
  identification: CategoryType;
  name: string;
  category: string;
  description: string;
  image: string;
  ad: string;
  models: CategoryModelData[];
  month_prices: CategoryMonthPriceData[];
  total_coverage_unit_charge: number;
  extra_km_charge: number;
  // Issue #28 Ola B2: pico y placa exemption from the dashboard column. null/
  // absent when the column is missing (pre-backfill) → consumers fall back to
  // the transitional hardcoded list. See resolvePicoyPlacaExempt.
  picoyplaca_exempt?: boolean | null;
}
