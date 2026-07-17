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
  /**
   * @deprecated Issue #322 PR10 — the server no longer emits this scalar: it
   * came from `activePricing[0] ?? allPricing[0]` (undefined Postgres order,
   * inactive-legacy fallback). The charge now travels per pricing row in
   * `month_prices[].total_coverage_unit_charge` and is selected by pickup date
   * via pickTotalCoverageChargeForDate. Kept optional so old fixtures typecheck.
   */
  total_coverage_unit_charge?: number;
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
