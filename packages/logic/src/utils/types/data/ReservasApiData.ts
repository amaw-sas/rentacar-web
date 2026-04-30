import type CategoryData from './CategoryData';
import type BranchData from './BranchData';
import type VehicleCategoryData from './VehicleCategoryData';
import type ExtrasData from './ExtrasData';

export type { ExtrasData };

export default interface ReservasApiData {
  categories: CategoryData[];
  branches: BranchData[];
  extras: ExtrasData | undefined;
  vehicleCategories: VehicleCategoryData;
}
