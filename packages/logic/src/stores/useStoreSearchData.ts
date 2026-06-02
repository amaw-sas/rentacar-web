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
  const { haveMonthlyReservation, selectedPickupLocation } = storeToRefs(useStoreReservationForm());
  const { createErrorMessage } = useMessages();
  const categoriesAvailabilityData = ref<CategoryAvailabilityData[] | null>(
    null
  );

  const pending = ref<boolean>(false);
  const error = ref<ErrorMessage | null>(null);
  
  const selectedCategory = ref<ReturnType<typeof useCategory> | null >(null);
  const noAvailableCategories = ref<boolean>(false);

  const noMonthlyCategories: CategoryType[] = [
    'FU',
    'FL',
    'GL',
    'LU'
  ];

  const search = async () => {
    error.value = null;
    pending.value = true;
    categoriesAvailabilityData.value = null;
    // Reset alongside the other per-search state: only the LLNRAG009 and
    // empty-result paths re-assign this, so without resetting here a stale
    // `true` from a prior LLNRAG009 search leaks into a later search that
    // ends in a different terminal error. Issue #20.
    noAvailableCategories.value = false;

    const { data, error: errorResponse } = await useFetchCategoriesAvailabilityData();

    // Handle missing parameters error silently (not a real error, just missing information)
    if(errorResponse.value) {
      if(errorResponse.value.error === 'missing_parameters') {
        pending.value = false;
        return;
      }
      error.value = errorResponse.value;
    }

    // if monthly reservation is selected
    if(haveMonthlyReservation.value){

      if(errorResponse.value){
        // Mirror the non-monthly branch: no_available_categories_error gets a
        // flag (UI surfaces it inline via the unable-categories rendering),
        // every other Localiza error gets a toast. Pre-fix the flag/toast
        // branches were inverted and the toast call was missing — issue #10
        // SCEN-002.
        if(errorResponse.value.error == "no_available_categories_error")
          noAvailableCategories.value = true;
        else
          createErrorMessage(errorResponse.value);
      }
      else {
        const dataArray = Array.isArray(data.value) ? data.value : [];
        categoriesAvailabilityData.value = categoriesAdminData.value?.filter((categoryAdmin: CategoryData) =>
          !noMonthlyCategories.includes(categoryAdmin.identification)
        ) // filter out monthly-excluded categories (FU, FL, GL, LU)
        .map((categoryAdmin: CategoryData) =>
          // create a category availability object for each category
          createCategoryAvailability(categoryAdmin)
        )
        .map((category: CategoryAvailabilityData) => {
          // add return fee amount to each category
          const categoryAvailability = dataArray.find((categoryAvailability: CategoryAvailabilityData) =>
            categoryAvailability.categoryCode == category.categoryCode
          );

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
      // the monthly-excluded categories (FU/FL/GL/LU), so they must not appear
      // as unable cards either. Non-monthly keeps surfacing every category.
      // Issue #54.
      const adminCategories = haveMonthlyReservation.value
        ? categoriesAdminData.value.filter((categoryAdmin: CategoryData) =>
            !noMonthlyCategories.includes(categoryAdmin.identification)
          )
        : categoriesAdminData.value;
      return adminCategories.map((categoryAdmin: CategoryData) =>
        createCategoryAvailability(categoryAdmin, true)
      );
    }

    if (categoriesAvailabilityData.value) {

      return categoriesAdminData.value.map((categoryAdmin: CategoryData) => {
        const categoryAvailability = categoriesAvailabilityData.value?.find((categoryAvailability: CategoryAvailabilityData) => 
          categoryAvailability.categoryCode == categoryAdmin.id
        );

        if(categoryAvailability){
          
          categoryAvailability['categoryModels'] = categoryAdmin.models;
          categoryAvailability["categoryMonthPrices"] = categoryAdmin.month_prices;
          categoryAvailability["categoryDescription"] = categoryAdmin.category.replace(categoryAdmin.name, "");
          categoryAvailability["totalCoverageUnitCharge"] = categoryAdmin.total_coverage_unit_charge;
          categoryAvailability["picoyplacaExempt"] = categoryAdmin.picoyplaca_exempt;

          return categoryAvailability
        }
        else return createCategoryAvailability(categoryAdmin, true);
      })
      .sort((a: CategoryAvailabilityData, b: CategoryAvailabilityData) => {
        if (a.estimatedTotalAmount < b.estimatedTotalAmount) return -1;
        else if (a.estimatedTotalAmount > b.estimatedTotalAmount) return 1;
        return 0;
      });
      
    } else return [];
    
  });

  
  const filteredCategories = computed<CategoryAvailabilityData[] | []>(() => {
    
    const bogotaBranches = ["AABOT", "ACBOT", "ACBEX", "ACBNN", "ACBOJ"];
    const onlyBogotaCategories: CategoryType[] = ["FU", "FL", "GL"];
    const pickupLocationCode = selectedPickupLocation.value?.code;
    const pickupLocationCity = selectedPickupLocation.value?.city;
    
    //TODO fix this
    if(categories.value.length == 0){
      return [];
    }
    else return categories.value
      // .map((category: CategoryAvailabilityData) => new Category(category))
      // .filter((category: CategoryAvailabilityData) => {
      //   if (haveMonthlyReservation.value)
      //     return category.getCategoryMonthlyPriceTotalInsurancePrice();
      //   else return true;
      // })
      .filter((category: CategoryAvailabilityData) => {
        // filter categories that are not available when selected bogota
        if(pickupLocationCode){
          if (
            !bogotaBranches.includes(pickupLocationCode) &&
            onlyBogotaCategories.includes(category.categoryCode)
          ) {
            return false;
          } else return true;
        }
        return true;
      })
      .filter((category: CategoryAvailabilityData) => {
        // filter category CX: only allowed in 7 cities
        if(pickupLocationCity){
          const onlyCategoryCXCityAllowed = [
            "barranquilla", "bogota", "bucaramanga", "cali",
            "cartagena", "medellin", "santa-marta"
          ];
          if (
            !onlyCategoryCXCityAllowed.includes(pickupLocationCity) &&
            category.categoryCode == "CX"
          ) {
            return false;
          } else return true;
        }
        return true;
      })
      .filter((category: CategoryAvailabilityData) => {
        // filter category GY: only allowed in 8 cities (same as GR)
        if(pickupLocationCity){
          const onlyCategoryGYCityAllowed = [
            "bogota", "bucaramanga", "cali", "medellin",
            "barranquilla", "soledad", "cartagena", "santa-marta"
          ];
          if (
            !onlyCategoryGYCityAllowed.includes(pickupLocationCity) &&
            category.categoryCode == "GY"
          ) {
            return false;
          } else return true;
        }
        return true;
      });

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

const createCategoryAvailability = (category: CategoryData, unable: boolean = false) : CategoryAvailabilityData => ({
    categoryCode: category.id,
    categoryDescription: category.description,
    categoryModels: category.models,
    categoryMonthPrices: category.month_prices,
    picoyplacaExempt: category.picoyplaca_exempt,
    totalAmount: 0,
    estimatedTotalAmount: (unable) ? 999999999 : 1,
    totalCoverageUnitCharge: category.total_coverage_unit_charge,
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