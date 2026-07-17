// External dependencies
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';

// Internal dependencies - stores
import useStoreAdminData from './useStoreAdminData';
import useStoreReservationForm from './useStoreReservationForm';

// Internal dependencies - composables
import useFetchCategoriesAvailabilityData from '../composables/useFetchCategoriesAvailabilityData';
import useCategory from '../composables/useCategory';
import useMessages from '../composables/useMessages';

// utils
import { categoryOffersMonthly, isCategoryVisibleInCity, isBlockingSearchError, categoryReadingRank, pickTotalCoverageChargeForDate } from '@rentacar-main/logic/utils';

// Types
import type {
  CategoryAvailabilityData,
  CategoryData,
  CategoryType,
  ErrorMessage,
} from '@rentacar-main/logic/utils';

const useStoreSearchData = defineStore("storeSearchData", () => {
  const storeAdminData = useStoreAdminData();
  // storeToRefs preserves reactivity across the store boundary. Plain
  // destructure was snapshotting categories at init, so the inline
  // "¡Oops!" block never rendered when admin data arrived late. Issue
  // #10 SCEN-004.
  const { categories: categoriesAdminData } = storeToRefs(storeAdminData);
  const storeForm = useStoreReservationForm();
  const { haveMonthlyReservation, selectedPickupLocation, fechaRecogida } = storeToRefs(storeForm);
  const { createErrorMessage } = useMessages();
  const categoriesAvailabilityData = ref<CategoryAvailabilityData[] | null>(
    null
  );

  const pending = ref<boolean>(false);
  const error = ref<ErrorMessage | null>(null);
  
  const selectedCategory = ref<ReturnType<typeof useCategory> | null >(null);
  const noAvailableCategories = ref<boolean>(false);

  // Whether a category is offered for monthly rental is derived from its
  // pricing (issue #28, Ola A), not a hardcoded code list: a category offers
  // monthly when the pricing row applicable to the pickup date carries a
  // positive 1k/2k monthly price. The dashboard clears those to NULL (→ 0 in
  // the payload) for the non-monthly gamas. See categoryOffersMonthly.
  const offersMonthly = (category: CategoryData): boolean =>
    categoryOffersMonthly(category.month_prices, fechaRecogida.value ?? '');

  // Issue #322 PR10: the "Seguro Total" charge is selected from the pricing
  // row that applies to the searched pickup date (same criterion as the
  // monthly prices — pickPriceForDate rule 1), never from a scalar picked in
  // undefined Postgres order. `null` = no active row applies → the UI omits
  // the Seguro Total option instead of quoting a retired rate.
  const coverageChargeFor = (category: CategoryData): number | null =>
    pickTotalCoverageChargeForDate(category.month_prices, fechaRecogida.value ?? '');

  // Issue 322 SCEN-322-E06: discard out-of-order availability responses so a
  // slow first search cannot overwrite a newer one or clear `pending` early.
  let searchGeneration = 0;

  const search = async () => {
    const gen = ++searchGeneration;
    error.value = null;
    pending.value = true;
    categoriesAvailabilityData.value = null;
    // Nueva búsqueda = nueva reserva potencial: desbloquear submit consumido (E03).
    storeForm.formSubmitLocked = false;
    // Reset alongside the other per-search state: only the LLNRAG009 and
    // empty-result paths re-assign this, so without resetting here a stale
    // `true` from a prior LLNRAG009 search leaks into a later search that
    // ends in a different terminal error. Issue #20.
    noAvailableCategories.value = false;

    const { data, error: errorResponse } = await useFetchCategoriesAvailabilityData();

    // Stale response: a newer search() started after us.
    if (gen !== searchGeneration) return;

    // missing_parameters is NOT silent (issue #322 SCEN-322-V03): search() only
    // runs on a real search intent (submit, deep-link/query hydration, retry),
    // never on an idle mount — so missing params here mean an incomplete
    // deep-link (e.g. a /reservas?… link without hours, or an unknown branch
    // slug). Swallowing it left the page blank with no explanation. It now
    // flows through the standard error path below: error.value renders the
    // inline state and the branch-specific createErrorMessage raises the toast
    // (useMessages maps the friendly copy).
    if(errorResponse.value) {
      error.value = errorResponse.value;
    }

    // if monthly reservation is selected
    if(haveMonthlyReservation.value){

      // Monthly availability does NOT come from Localiza: the price is sourced
      // entirely from category_pricing (month_prices) via offersMonthly. Localiza
      // rejects >=30-day windows with no_available_categories_error (LLNRAG009),
      // but that must NOT hide monthly categories — what decides availability is
      // whether the category carries monthly pricing for the pickup date. So a
      // LLNRAG009 is non-blocking: build the list from the catalog regardless,
      // with the Localiza-only returnFee degrading to 0. Only a *different*
      // Localiza error blocks the search with a toast (symmetry with the
      // non-monthly branch — issue #10 SCEN-002). Issue #201.
      const blockingError = isBlockingSearchError(errorResponse.value);

      if(blockingError){
        // blockingError is true only when errorResponse.value is truthy
        // (isBlockingSearchError guards `!!error`), so it is non-null here.
        createErrorMessage(errorResponse.value!);
      }
      else {
        // Clear a non-blocking LLNRAG009 (set at the top of search) so the
        // `categories` computed renders the priced cards instead of the gray
        // "unable" grid, and the "agotado" inline block stays hidden. #201
        if(errorResponse.value) error.value = null;

        const dataArray = Array.isArray(data.value) ? data.value : [];
        // Index once instead of a linear find per category — issue #15.
        const returnFeeByCode = indexByCode(dataArray);
        categoriesAvailabilityData.value = categoriesAdminData.value?.filter((categoryAdmin: CategoryData) =>
          offersMonthly(categoryAdmin)
        ) // keep only categories that actually offer monthly pricing
        .map((categoryAdmin: CategoryData) =>
          // create a category availability object for each category
          createCategoryAvailability(categoryAdmin, false, coverageChargeFor(categoryAdmin))
        )
        .map((category: CategoryAvailabilityData) => {
          // add return fee amount to each category
          const categoryAvailability = returnFeeByCode.get(category.categoryCode);

          if(categoryAvailability)
            category['returnFeeAmount'] = categoryAvailability.returnFeeAmount;

          return category;
        }) as CategoryAvailabilityData[];
      }

    }
    else {

      // if there's any data response
      if (data.value && Array.isArray(data.value)) {
        noAvailableCategories.value = data.value.length == 0;
        categoriesAvailabilityData.value = data.value;
      } else if (errorResponse.value) {
        if(errorResponse.value.error == 'no_available_categories_error')
          noAvailableCategories.value = true;
        else
          createErrorMessage(errorResponse.value);

        categoriesAvailabilityData.value = [];
      } else {
        // data.value exists but is not an array (unexpected response)
        categoriesAvailabilityData.value = [];
      }
    }

    // Re-check before clearing pending: a concurrent search may have started
    // during toast/UI work above.
    if (gen !== searchGeneration) return;
    pending.value = false;
  };

  const categories = computed<CategoryAvailabilityData[] | []>(() => {

    /** if there's a error besides no_available_categories_error, don't show unable categories */
    if(error.value && error.value.error != "no_available_categories_error")
      return [];

    if (!categoriesAdminData.value) return [];

    /** LLNRAG009 — surface every admin category as unable regardless of whether
     * the search-store branch (monthly or non-monthly) populated
     * categoriesAvailabilityData. Monthly used to leave it null, which the
     * legacy guard `categoriesAvailabilityData && categoriesAdminData` would
     * short-circuit, and the inline "¡Oops!" rendered without the gray-card
     * grid below. SCEN-U2.
     */
    if (error.value?.error === "no_available_categories_error") {
      // Mirror the monthly *success* path: monthly reservations never offer
      // categories without monthly pricing, so they must not appear as unable
      // cards either. Non-monthly keeps surfacing every category. Issue #54.
      const adminCategories = haveMonthlyReservation.value
        ? categoriesAdminData.value.filter((categoryAdmin: CategoryData) =>
            offersMonthly(categoryAdmin)
          )
        : categoriesAdminData.value;
      return adminCategories.map((categoryAdmin: CategoryData) =>
        createCategoryAvailability(categoryAdmin, true, coverageChargeFor(categoryAdmin))
      );
    }

    if (categoriesAvailabilityData.value) {

      // Index once so the merge is O(n+m) instead of O(n·m) — issue #15.
      const availabilityByCode = indexByCode(categoriesAvailabilityData.value);

      return categoriesAdminData.value.map((categoryAdmin: CategoryData) => {
        const categoryAvailability = availabilityByCode.get(categoryAdmin.id);

        if(categoryAvailability){
          
          categoryAvailability['categoryModels'] = categoryAdmin.models;
          categoryAvailability["categoryMonthPrices"] = categoryAdmin.month_prices;
          categoryAvailability["categoryDescription"] = categoryAdmin.category.replace(categoryAdmin.name, "");
          categoryAvailability["totalCoverageUnitCharge"] = coverageChargeFor(categoryAdmin);
          categoryAvailability["picoyplacaExempt"] = categoryAdmin.picoyplaca_exempt;
          categoryAvailability["visibilityMode"] = categoryAdmin.visibility_mode;
          categoryAvailability["allowedCities"] = categoryAdmin.allowed_cities;

          return categoryAvailability
        }
        else return createCategoryAvailability(categoryAdmin, true, coverageChargeFor(categoryAdmin));
      })
      // Reading order (matches the chat): available cards first, then by class
      // (compacto → sedán → camioneta), then transmission (mecánico → híbrido →
      // automático), then price. Unable cards carry the 999999999 sentinel, so
      // rank them last while keeping the same class/price order among themselves.
      .sort((a: CategoryAvailabilityData, b: CategoryAvailabilityData) => {
        const unableA = a.estimatedTotalAmount === 999999999 ? 1 : 0;
        const unableB = b.estimatedTotalAmount === 999999999 ? 1 : 0;
        return (
          unableA - unableB ||
          categoryReadingRank(a.categoryCode) - categoryReadingRank(b.categoryCode) ||
          a.estimatedTotalAmount - b.estimatedTotalAmount
        );
      });
      
    } else return [];
    
  });

  
  const filteredCategories = computed<CategoryAvailabilityData[] | []>(() => {

    const pickupLocationCity = selectedPickupLocation.value?.city;

    //TODO fix this
    if(categories.value.length == 0){
      return [];
    }
    // Issue #28: geographic visibility is derived solely from the dashboard
    // (visibility_mode + allowed cities). See isCategoryVisibleInCity.
    else return categories.value
      .filter((category: CategoryAvailabilityData) =>
        isCategoryVisibleInCity(
          category.visibilityMode,
          category.allowedCities,
          pickupLocationCity,
        )
      );

  });

  /** Verifica si hay al menos una categoría realmente disponible (no marcada como unable) */
  const hasAvailableCategories = computed<boolean>(() => {
    if (filteredCategories.value.length === 0) return false;
    return filteredCategories.value.some(
      (category: CategoryAvailabilityData) => category.estimatedTotalAmount !== 999999999
    );
  });

  return {
    categoriesAvailabilityData,
    categories,
    filteredCategories,
    hasAvailableCategories,
    search,
    pending,
    error,
    selectedCategory,
    noAvailableCategories,
  };
});

// Index availability rows by category code, keeping the FIRST occurrence for
// duplicate codes — preserves the semantics of the Array.find it replaced
// (issue #15). new Map(entries) would keep the LAST and silently regress.
const indexByCode = (
  rows: CategoryAvailabilityData[],
): Map<CategoryType, CategoryAvailabilityData> => {
  const byCode = new Map<CategoryType, CategoryAvailabilityData>();
  for (const row of rows) {
    if (!byCode.has(row.categoryCode)) byCode.set(row.categoryCode, row);
  }
  return byCode;
};

const createCategoryAvailability = (
  category: CategoryData,
  unable: boolean = false,
  totalCoverageUnitCharge: number | null = null,
) : CategoryAvailabilityData => ({
    categoryCode: category.id,
    categoryDescription: category.description,
    categoryModels: category.models,
    categoryMonthPrices: category.month_prices,
    picoyplacaExempt: category.picoyplaca_exempt,
    visibilityMode: category.visibility_mode,
    allowedCities: category.allowed_cities,
    totalAmount: 0,
    estimatedTotalAmount: (unable) ? 999999999 : 1,
    totalCoverageUnitCharge,
    returnFeeAmount: 0,
    vehicleDayCharge: 0,
    numberDays: 0,
    taxFeeAmount: 0,
    taxFeePercentage: 0,
    IVAFeeAmount: 0,
    coverageUnitCharge: 0,
    coverageQuantity: 0,
    coverageTotalAmount: 0,
    referenceToken: "",
    rateQualifier: "",
  } as CategoryAvailabilityData)

export default useStoreSearchData;