import type CategoryData from './CategoryData';
import type BranchData from './BranchData';
import type VehicleCategoryData from './VehicleCategoryData';
import type ExtrasData from './ExtrasData';
import type City from '../type/City';
import type Testimonial from '../type/Testimonial';
import type FAQ from '../type/FAQ';

export type { ExtrasData };

export default interface ReservasApiData {
  /**
   * Server epoch (milliseconds) when this catalog snapshot finished loading.
   * Optional only for backwards-compatible fixtures/old payloads; the client
   * treats a missing or invalid value as expired and refreshes after mount.
   */
  catalogFetchedAt?: number;
  /**
   * Cheapest real p05 day price across gamas, taxes included (`price_floors`,
   * migration 142). The only figure honest enough to publish as a "desde" —
   * `category_pricing.monthly_one_day_price` is the list rate BEFORE the
   * discount and sits near the p90 of what customers actually pay.
   *
   * Absent and `null` mean DIFFERENT things and the difference is load-bearing:
   * absent = this brand never opted into the real floor (its title keeps the
   * legacy list-rate claim), `null` = it opted in and there is nothing
   * publishable today, so the title carries no number at all. See buildHomeSEO.
   */
  dayPriceFloorGross?: number | null;
  categories: CategoryData[];
  branches: BranchData[];
  extras: ExtrasData | undefined;
  vehicleCategories: VehicleCategoryData;
  cities: City[];
  franchiseTestimonials: Record<string, Testimonial[]>;
  faqs: FAQ[];
}
