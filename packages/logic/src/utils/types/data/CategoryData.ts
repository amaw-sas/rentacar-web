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
}
