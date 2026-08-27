// External dependencies
import { defineStore } from 'pinia';
import { computed } from 'vue';

// Internal dependencies - composables
import useFetchRentacarData from '../composables/useFetchRentacarData';

// Types
import type { BranchData } from '@rentacar-main/logic/utils';
import { isBookable } from '../utils/isBookable';

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

  /**
   * The branches a customer may actually be offered.
   *
   * Deliberately NOT the same list as `sortedBranches`, which stays complete. Three things break
   * if the shared list is filtered instead:
   *   · `CityPage.vue` paints the switched-off city's delivery points from it, and that page has
   *     to keep working — keeping it alive is the entire point of `bookable`;
   *   · `searchBranchByCode`/`BySlug` resolve a switched-off branch, so an existing deep link
   *     still lands on something real instead of 404ing;
   *   · `Searcher.vue` reads `sortedBranches.length === 0` as "the load failed, reload the page".
   *     Filtering the shared list would fire that message the day the last city goes off sale,
   *     telling a customer the site is broken when it is only closed.
   *
   * `isBookable` rather than `branch.bookable`: the catalog payload is cached for an hour, so
   * right after the deploy the field is absent and absent means on sale.
   */
  const bookableBranches = computed<BranchData[]>(() =>
    sortedBranches.value.filter(isBookable)
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
    bookableBranches,
    searchBranchByCity,
    searchBranchByCode,
    isBranchCode,
    searchBranchBySlug,
    isBranchSlug,
    searchBranchBySlugOrCode,
  };
});

export default useStoreAdminData;