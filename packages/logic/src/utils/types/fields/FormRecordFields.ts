import { type CategoryType } from '../type/CategoryType';
import { type MonthlyMileage } from '../type/MonthlyMileage';
import type AttributionInput from '../type/AttributionInput';

export default interface FormFields {
  fullname: string | null;
  identification_type: string | null;
  identification: string | null;
  phone: string | null;
  email: string | null;
  category: CategoryType | null;
  pickup_location: string | null;
  pickup_date: string | null;
  pickup_hour: string | null;
  return_location: string | null;
  return_date: string | null;
  return_hour: string | null;
  selected_days: number | undefined;
  extra_hours: number | undefined;
  extra_hours_price: number | undefined;
  coverage_days: number | undefined;
  coverage_price: number | undefined;
  return_fee: number | undefined;
  tax_fee: number | undefined;
  iva_fee: number | undefined;
  total_price: number | undefined;
  total_price_to_pay?: number;
  franchise: string | null;
  user?: string | null;
  total_insurance?: boolean | null;
  reference_token: string | undefined;
  rate_qualifier: string | undefined;
  extra_driver?: number | undefined;
  baby_seat?: number | undefined;
  wash?: number | undefined;
  // Always 0 — the flight branch was removed (issue #322 SCEN-322-X07); the
  // flag stays for wire compatibility with the dashboard record endpoint.
  flight?: number | undefined;
  monthly_mileage?: MonthlyMileage | null;
  attribution?: AttributionInput;
}
