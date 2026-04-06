import type CategoryAvailabilityData from '../data/CategoryAvailabilityData';
import type VehicleCategoryData from '../data/VehicleCategoryData';

export default interface CategoryProps {
  category: CategoryAvailabilityData;
  vehicleCategory?: VehicleCategoryData;
  showButton?: boolean;
  stepper?: any;
}
