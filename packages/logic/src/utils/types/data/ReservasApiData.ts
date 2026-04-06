import type CategoryData from './CategoryData';
import type BranchData from './BranchData';

export interface ExtrasData {
  extraDriverDayPrice: number;
  babySeatDayPrice: number;
  washPrice: number;
}

export default interface ReservasApiData {
  categories: CategoryData[];
  branches: BranchData[];
  extras: ExtrasData;
}
