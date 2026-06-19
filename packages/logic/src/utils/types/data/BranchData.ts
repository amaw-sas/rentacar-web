import type LocationSchedule from './LocationSchedule';

export default interface BranchData {
  id: number;
  code: string;
  name: string;
  city: string;
  // Structured per-branch hours (contract v2, issue #47). Render only
  // `schedule.display`; the day keys drive the searcher's date/hour restriction.
  schedule?: LocationSchedule;
  slug?: string; // Computed at runtime from name
}
