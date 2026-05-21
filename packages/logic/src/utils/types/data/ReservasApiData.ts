import type CategoryData from './CategoryData';
import type BranchData from './BranchData';
import type VehicleCategoryData from './VehicleCategoryData';
import type ExtrasData from './ExtrasData';
import type City from '../type/City';
import type Testimonial from '../type/Testimonial';
import type FAQ from '../type/FAQ';

export type { ExtrasData };

export default interface ReservasApiData {
  categories: CategoryData[];
  branches: BranchData[];
  extras: ExtrasData | undefined;
  vehicleCategories: VehicleCategoryData;
  cities: City[];
  franchiseTestimonials: Record<string, Testimonial[]>;
  faqs: FAQ[];
}
