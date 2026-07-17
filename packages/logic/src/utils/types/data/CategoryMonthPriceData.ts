export default interface CategoryMonthPriceData {
  "1k_kms": number;
  "2k_kms": number;
  "3k_kms": number;
  init_date: string;
  end_date: string;
  total_insurance_price: number;
  one_day_price: number;
  status: "active" | "inactive";
  // Per-row "Seguro Total" daily charge (issue #322 PR10). Selected by pickup
  // date via pickTotalCoverageChargeForDate — never by array order. `null`
  // (or absent, for pre-change fixtures) = the row carries no quotable charge.
  total_coverage_unit_charge?: number | null;
}
