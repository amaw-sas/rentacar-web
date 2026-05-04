// External dependencies
import { defineStore } from 'pinia';
import { computed } from 'vue';

// Internal dependencies - composables
import useFetchRentacarData from '../composables/useFetchRentacarData';

// Types
import type { BranchData } from '@rentacar-main/logic/utils';

const useStoreAdminData = defineStore("storeAdminData", () => {
  // Reactive reads via computed. Direct destructure was capturing whatever
  // useFetchRentacarData returned at store init — typically the empty
  // sentinel when the rentacar-data plugin had not finished — and never
  // recovered once the plugin populated useState. Issue #10 SCEN-004.
  const categories = computed(() => useFetchRentacarData().categories);
  const branches = computed(() => useFetchRentacarData().branches);

  const sortedBranches = computed<BranchData[] | []>(() =>
    branches.value
      ? [...branches.value]
          .sort((a: BranchData, b: BranchData) =>
            a.name.localeCompare(b.name)
          )
      : []
  );

  function searchBranchByCity(city: string | string[]): BranchData | undefined {
    return sortedBranches.value.find(
      (branch: BranchData) => branch.city == city
    );
  }

  function searchBranchByCode(branch_code: string): BranchData | undefined {
    return sortedBranches.value.find(
      (branch: BranchData) => branch.code == branch_code
    );
  }
  
  function isBranchCode(branch_code: string): boolean {
    const branch = searchBranchByCode(branch_code);
    return (branch) ? true : false;
  }

  function searchBranchBySlug(slug: string): BranchData | undefined {
    return sortedBranches.value.find(
      (branch: BranchData) => branch.slug === slug
    );
  }

  function isBranchSlug(slug: string): boolean {
    return searchBranchBySlug(slug) !== undefined;
  }

  function searchBranchBySlugOrCode(value: string): BranchData | undefined {
    // Priority 1: Search by slug (current behavior)
    const bySlug = searchBranchBySlug(value);
    if (bySlug) return bySlug;

    // Priority 2: Search by code (backward compatibility)
    // Normalize: lowercase input → uppercase code
    const byCode = searchBranchByCode(value.toUpperCase());
    return byCode;
  }

  return {
    categories,
    branches,
    sortedBranches,
    searchBranchByCity,
    searchBranchByCode,
    isBranchCode,
    searchBranchBySlug,
    isBranchSlug,
    searchBranchBySlugOrCode,
  };
});

export default useStoreAdminData;