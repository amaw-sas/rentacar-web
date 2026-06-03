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
  // Issue #28: pico y placa exemption from the dashboard column (sole source of
  // truth). null/absent → not exempt. See resolvePicoyPlacaExempt.
  picoyplaca_exempt?: boolean | null;
  // Issue #28 Ola C: geographic visibility from the dashboard. visibility_mode
  // is 'all' | 'restricted' (NOT NULL DEFAULT 'all'); allowed_cities are the
  // whitelisted city slugs. See isCategoryVisibleInCity.
  visibility_mode?: string;
  allowed_cities?: string[];
}
