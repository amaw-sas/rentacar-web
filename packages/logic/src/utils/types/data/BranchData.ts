export default interface BranchData {
  id: number;
  code: string;
  name: string;
  city: string;
  schedule?: string;
  slug?: string; // Computed at runtime from name
}
