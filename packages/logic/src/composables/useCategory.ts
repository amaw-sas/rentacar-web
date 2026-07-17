// External dependencies
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';

// Internal dependencies - composables
import useMoneyFormat from './useMoneyFormat';

// Internal dependencies - stores
import useStoreReservationForm from '../stores/useStoreReservationForm';

// Internal dependencies - utils
import { pickPriceForDate, pickEffectiveTotalCoverageUnitCharge, resolvePicoyPlacaExempt } from '@rentacar-main/logic/utils';

// Types
import type {
  CategoryAvailabilityData,
  CategoryModelData,
  CategoryMonthPriceData,
  CategoryType,
  MonthlyMileage
} from '@rentacar-main/logic/utils';

const { moneyFormat } = useMoneyFormat();

export default function useCategory(categoryAvailableData: CategoryAvailabilityData){

   const storeForm = useStoreReservationForm();
   const { haveMonthlyReservation, fechaRecogida } = storeToRefs(storeForm);

   // extras pricing from Supabase (rental_companies table)
   const { extras } = useFetchRentacarData();
   const EXTRA_DRIVER_DAY_PRICE: number = extras?.extraDriverDayPrice ?? 12000;
   const BABY_SEAT_DAY_PRICE: number = extras?.babySeatDayPrice ?? 12000;
   const WASH_PRICE: number = extras?.washPrice ?? 20000;
   const WASH_ONSITE_PRICE: number = extras?.washOnsitePrice ?? 30000;
   const WASH_DEEP_PRICE: number = extras?.washDeepPrice ?? 150000;
   const WASH_DEEP_UPHOLSTERY_PRICE: number = extras?.washDeepUpholsteryPrice ?? 225000;
   
   // category attributes refs
   const vehicleDayCharge = ref<number>(categoryAvailableData.vehicleDayCharge);
   const estimatedTotalAmount = ref<number>(categoryAvailableData.estimatedTotalAmount);
   const totalCoverageUnitCharge = ref<number>(categoryAvailableData.totalCoverageUnitCharge);
   const totalAmount = ref<number>(categoryAvailableData.totalAmount);
   const extraHoursQuantity = ref<number | undefined>(categoryAvailableData.extraHoursQuantity);
   const extraHoursTotalAmount = ref<number | undefined>(categoryAvailableData.extraHoursTotalAmount);
   const coverageTotalAmount = ref<number>(categoryAvailableData.coverageTotalAmount);
   const coverageQuantity = ref<number>(categoryAvailableData.coverageQuantity);
   const coverageUnitCharge = ref<number>(categoryAvailableData.coverageUnitCharge);
   const ivaFeeAmount = ref<number>(categoryAvailableData.IVAFeeAmount);
   const taxFeeAmount = ref<number>(categoryAvailableData.taxFeeAmount);
   const taxFeePercentage = ref<number>(categoryAvailableData.taxFeePercentage);
   const discountAmount = ref<number | undefined>(categoryAvailableData.discountAmount);
   const discountPercentage = ref<number | undefined>(categoryAvailableData.discountPercentage);
   const returnFeeAmount = ref<number | undefined>(categoryAvailableData.returnFeeAmount);
   const numberDays = ref<number>(categoryAvailableData.numberDays);
   const categoryCode = ref<CategoryType>(categoryAvailableData.categoryCode);
   const picoyplacaExempt = ref<boolean | null>(categoryAvailableData.picoyplacaExempt ?? null);
   const categoryDescription = ref<string>(categoryAvailableData.categoryDescription);
   const categoryModels = ref<CategoryModelData[] | undefined>(categoryAvailableData.categoryModels);
   const categoryMonthPrices = ref<CategoryMonthPriceData[] | undefined>(categoryAvailableData.categoryMonthPrices);
   const referenceToken = ref<string>(categoryAvailableData.referenceToken);
   const rateQualifier = ref<string>(categoryAvailableData.rateQualifier);
   
   // form optional refs
   const withTotalCoverage = ref<boolean>(false);
   const withMileage = ref<MonthlyMileage | null>("1k_kms");
   const withExtraDriver = ref<boolean>(false);
   const withBabySeat = ref<boolean>(false);
   const withWash = ref<boolean>(false);
   
   // elements IDs
   const coverageCheckboxName: string = `coverage-radio-${categoryCode.value}`;
   const basicCoverageCheckboxID: string = `basic-coverage-radio-${categoryCode.value}`;
   const totalCoverageCheckboxID: string = `total-coverage-radio-${categoryCode.value}`;
   const mileageCheckboxName: string = `mileage-radio-${categoryCode.value}`;
   const oneKmMileageCheckboxID: string = `one-km-mileage-radio-${categoryCode.value}`;
   const twoKmsMileageCheckboxID: string = `two-kms-mileage-radio-${categoryCode.value}`;
   const threeKmsMileageCheckboxID: string = `three-kms-mileage-radio-${categoryCode.value}`;

   // util functions
   const getFormattedPrice = (price: number | undefined): string =>
      price !== undefined ? moneyFormat(price) : "";
   
   // category functions

   /**
    * Returns the monthly pricing row whose validity range contains the
    * customer's pickup date. Falls back to the closest legacy (inactive)
    * row when pickup is outside any active range. See pickPriceForDate
    * for the full selection algorithm.
    */
   const getCategoryMonthPrice = (): CategoryMonthPriceData | undefined => {
      if (!categoryMonthPrices.value) return undefined;
      return pickPriceForDate(categoryMonthPrices.value, fechaRecogida.value ?? '');
   };

   /**
    * Issue #313: reserva mensual cuyo pickup cae MÁS ALLÁ del horizonte de datos
    * de tarifas — `pickPriceForDate` devuelve undefined (regla 0) porque no hay
    * fila legítima que cubra la fecha (el caso 2027 del audit). La UI bloquea la
    * reserva por este flag, no por precio; los computeds de precio devuelven 0
    * explícito para que ningún número fabricado se cobre.
    */
   const isMonthlyPriceUnavailable = computed<boolean>(() =>
      haveMonthlyReservation.value && !!withMileage.value && !getCategoryMonthPrice()
   );

   // Issue #28: pico y placa exemption comes solely from the dashboard column.
   const isPicoyPlacaExempt = (): boolean =>
      resolvePicoyPlacaExempt(picoyplacaExempt.value);
   
   const hasReturnFee = (): boolean => returnFeeAmount.value ? true  : false;
   
   const hasExtraHours = (): boolean => extraHoursQuantity.value ? true : false;

   /**
    * Floors the total coverage charge at the basic charge. Keeps "Seguro
    * Total" from ever rendering cheaper than "Seguro Básico" when Supabase
    * data is inverted. See pickEffectiveTotalCoverageUnitCharge.
    */
   const effectiveTotalCoverageUnitCharge = computed<number>(() =>
      pickEffectiveTotalCoverageUnitCharge(totalCoverageUnitCharge.value, coverageUnitCharge.value)
   );

   //TODO change the following when there's total coverage and/or monthly price
   
   const getDailyPrice = computed<number>(() => {
      // Issue #313: fail-closed más allá del horizonte — nunca caer a la
      // matemática diaria ni a la de Seguro Total con un precio fabricado.
      if(isMonthlyPriceUnavailable.value) return 0;

      if(withTotalCoverage.value){
         if(haveMonthlyReservation.value && withMileage.value){
            const mileage = withMileage.value;
            const monthPrice = getCategoryMonthPrice();
            if(monthPrice) {
               const monthPriceMileage = monthPrice[mileage];
               const totalCoverage = monthPrice["total_insurance_price"];
            
               // daily price with total coverage and monthly price
               return (monthPriceMileage + totalCoverage) / 30;
            }
         }
         
         // return getSubtotal.value + getTaxFeePrice.value + getIVAFeePrice.value;
         // daily price with total coverage
         return vehicleDayCharge.value + effectiveTotalCoverageUnitCharge.value;
      }
      else if(haveMonthlyReservation.value && withMileage.value){
         const mileage = withMileage.value;
         const monthPrice = getCategoryMonthPrice();
         if(monthPrice) {
            const monthPriceMileage = monthPrice[mileage];
            
            // monthly price day
            return monthPriceMileage / 30;
         }
      }
      
      // default daily price
      return vehicleDayCharge.value + coverageUnitCharge.value;
   })
   
   /**
    * Get the daily base price of the reservation, 
    * it's shown as crossed out
    */
   const getDailyBasePrice = computed<number>(() => {
      // Issue #313: fail-closed más allá del horizonte.
      if(isMonthlyPriceUnavailable.value) return 0;

      const monthPrice = getCategoryMonthPrice();
      
      if(haveMonthlyReservation.value && monthPrice)
         // one monthly day price
         return monthPrice["one_day_price"]
      else if(hasDiscount())
         return vehicleDayCharge.value + (discountAmount.value ?? 0) + coverageUnitCharge.value;
      else
         return vehicleDayCharge.value + coverageUnitCharge.value;
      
   });
   
   const getTotalCoveragePrice = computed<number>(() => effectiveTotalCoverageUnitCharge.value * coverageQuantity.value);
   
   const getSubtotal = computed<number>(() => {
      return (withTotalCoverage.value)
         ? totalAmount.value + getTotalCoveragePrice.value + (returnFeeAmount.value ?? 0)
         : totalAmount.value + (returnFeeAmount.value ?? 0);
   });
   
   const getTaxFeePrice = computed<number>(() => {
      return (withTotalCoverage.value)
         ? Math.round((getSubtotal.value * taxFeePercentage.value) / 100)
         : taxFeeAmount.value ?? 0;
   });
   
   const getIVAFeePrice = computed<number>(() => {
      if(withTotalCoverage.value){
         const sum = getSubtotal.value + getTaxFeePrice.value;
         const ivaPercentage = 19; // TODO pending to get from admin data
         
         return Math.round((sum * ivaPercentage) / 100);
      }
      else return ivaFeeAmount.value ?? 0;
   })
   
   /**
    * Get the total price of the reservation, this is shown to client
    */
   const getTotalPrice = computed<number>(() => {
      // Issue #313: fail-closed más allá del horizonte — sin esto, con Seguro
      // Total esta rama caía a getSubtotal (precio fabricado que se cobraba).
      if(isMonthlyPriceUnavailable.value) return 0;

      const returnFee = returnFeeAmount.value ?? 0;

      // if has total coverage
      if(withTotalCoverage.value){
         
         // if has monthly reservation and total coverage
         if(haveMonthlyReservation.value && withMileage.value){
            const mileage = withMileage.value;
            const monthPrice = getCategoryMonthPrice();
            
            if(monthPrice) {
               const monthPriceMileage = monthPrice[mileage];
               const totalCoverage = monthPrice["total_insurance_price"];
               
               // price with total coverage plus monthly price plus return fee
               return monthPriceMileage + totalCoverage + returnFee;
            }
         }
         
         // price with total coverage plus return fee
         return getSubtotal.value;
      }
      // if has monthly reservation
      else if(haveMonthlyReservation.value && withMileage.value){
         const mileage = withMileage.value;
         const monthPrice = getCategoryMonthPrice();
         
         if(monthPrice) {
            const monthPriceMileage = monthPrice[mileage];
            
            // monthly price day plus return fee
            return monthPriceMileage + returnFee;
         }
      }
      else {
         // default price, this price has not iva and tax fee
         return (
            (totalAmount.value ?? 0) +
            (coverageTotalAmount.value ?? 0) +
            returnFee
         );
      }
      
      // price zero but must not come here
      return 0;
   })
   
   /**
    * Get the actual total price of the reservation, this is shown in tooltip
    */
   const getActualTotalPrice = computed<number>(() => {
      // Issue #313: fail-closed más allá del horizonte.
      if(isMonthlyPriceUnavailable.value) return 0;

      const returnFee = returnFeeAmount.value ?? 0;

      if(withTotalCoverage.value){
         if(haveMonthlyReservation.value && withMileage.value){
            const mileage = withMileage.value;
            const monthPrice = getCategoryMonthPrice();
            if(monthPrice) {
               const monthPriceMileage = monthPrice[mileage];
               const totalCoverage = monthPrice["total_insurance_price"];
               
               // price with total coverage and monthly price
               return monthPriceMileage + totalCoverage + returnFee;
            }
         }
         // price with total coverage
         return getSubtotal.value + getTaxFeePrice.value + getIVAFeePrice.value;
      }
      else if(haveMonthlyReservation.value && withMileage.value){
         const mileage = withMileage.value;
            const monthPrice = getCategoryMonthPrice();
            if(monthPrice) {
               const monthPriceMileage = monthPrice[mileage];
               
               // monthly price day plus return fee
               return monthPriceMileage + returnFee;
            }
      }
      else {
         
         // default price, it came from localiza api
         return estimatedTotalAmount.value ?? 0;
      }
      
      // price zero but must not come here
      return 0;
   })
   
   const getDiscount = computed<string>(() => {
      let initial: number = 0, final: number = 0;
      initial = ((hasDiscount()) ? vehicleDayCharge.value + (discountAmount.value ?? 0) : vehicleDayCharge.value) + coverageUnitCharge.value;
      final = vehicleDayCharge.value + coverageUnitCharge.value;

      // Base nula (p.ej. reserva mensual: vehicleDayCharge y coverageUnitCharge
      // son 0, el precio vive en month_prices) → no hay descuento diario que
      // mostrar. Sin esta guarda el cálculo hace 100 * (0 / |0|) = NaN.
      if (initial <= 0) return "0";

      const formatter = new Intl.NumberFormat("es-CO", {
         style: "decimal",
      });
      
      return formatter.format(
         Math.round(Math.abs(100 * ((final - initial) / Math.abs(initial))))
      )
   });
   
   /**
    * Get the extra driver price, current daily price is 100.000 COP
    */
   const getExtraDriverPrice = computed<number>(() => 
       ((haveMonthlyReservation.value) ? 30 : numberDays.value) * EXTRA_DRIVER_DAY_PRICE
   );

   /**
    * Get the baby seat price, current daily price is 100.000 COP
    */
   const getBabySeatPrice = computed<number>(() => 
      ((haveMonthlyReservation.value) ? 30 : numberDays.value) * BABY_SEAT_DAY_PRICE
   );

   /**
    * Get wash price, current price is 20.000 COP
    */
   const getWashPrice = computed<number>(() => 
      WASH_PRICE
   );

   /**
    * check if there's additional services selected
    */
   const hasAdditionalServices = computed<boolean>(() =>
      withExtraDriver.value || withBabySeat.value || withWash.value
   )

   const getAdditionalsTotal = computed<number>(() =>
      (withExtraDriver.value ? getExtraDriverPrice.value : 0) +
      (withBabySeat.value ? getBabySeatPrice.value : 0) +
      (withWash.value ? getWashPrice.value : 0)
   );

   const getTotalWithAdditionals = computed<number>(() =>
      getTotalPrice.value + getAdditionalsTotal.value
   );

   // Marketing test (revertible): "Total a pagar" = actual total with IVA + tasa
   // included (getActualTotalPrice) plus the informative additionals.
   const getTotalToPayWithAdditionals = computed<number>(() =>
      getActualTotalPrice.value + getAdditionalsTotal.value
   );

   // IVA + tasa amount = the gap between "Total a pagar" (IVA + tasa incluidos)
   // and "Total renta" (sin ellos). Derived from the same totals shown to the
   // client so the three figures always reconcile (renta + esto = a pagar).
   const getIvaAndTaxAmount = computed<number>(() =>
      Math.max(0, getActualTotalPrice.value - getTotalPrice.value)
   );

   const getFormattedDays = computed<string>(() => {
      if(haveMonthlyReservation.value) return "30 días";
      else return (numberDays.value > 1) ? `${numberDays.value} días` : `${numberDays.value} día`
   });
   
   const hasDiscount = (): boolean => {
      const initial: number = discountAmount.value ? vehicleDayCharge.value + discountAmount.value : vehicleDayCharge.value;
      const final: number = getDailyPrice.value;
      
      if(initial <= final) return false;
      
      return discountAmount.value ? true : false;
   }
   
   /** currency formatted prices */
   const currencyVehicleDayCharge = computed<string>(() => getFormattedPrice(vehicleDayCharge.value));
   const currencyExtraHoursPrice = computed<string>(() => getFormattedPrice(extraHoursTotalAmount.value));
   const currencyTotalCoverageDailyPrice = computed<string>(() => getFormattedPrice(effectiveTotalCoverageUnitCharge.value));
   const currencyCoverageDailyPrice = computed<string>(() => getFormattedPrice(coverageUnitCharge.value));
   const currencyCoveragePrice = computed<string>(() => getFormattedPrice(coverageTotalAmount.value));
   const currencyReturnFee = computed<string>(() => getFormattedPrice(returnFeeAmount.value));
   const currencySubtotal = computed<string>(() => getFormattedPrice(getSubtotal.value));
   const currencyTaxFee = computed<string>(() => getFormattedPrice(getTaxFeePrice.value));
   const currencyIvaFee = computed<string>(() => getFormattedPrice(getIVAFeePrice.value));
   const currencyTotalPrice = computed<string>(() => getFormattedPrice(getTotalPrice.value));
   const currencyActualTotalPrice = computed<string>(() => getFormattedPrice(getActualTotalPrice.value));
   const currencyDailyBasePrice = computed<string>(() => getFormattedPrice(getDailyBasePrice.value));
   const currencyDailyPrice = computed<string>(() => getFormattedPrice(getDailyPrice.value));
   const currencyExtraDriverPrice = computed<string>(() => getFormattedPrice(getExtraDriverPrice.value));
   const currencyBabySeatPrice = computed<string>(() => getFormattedPrice(getBabySeatPrice.value));
   const currencyWashPrice = computed<string>(() => getFormattedPrice(getWashPrice.value));
   const currencyWashOnsitePrice = computed<string>(() => getFormattedPrice(WASH_ONSITE_PRICE));
   const currencyWashDeepPrice = computed<string>(() => getFormattedPrice(WASH_DEEP_PRICE));
   const currencyWashDeepUpholsteryPrice = computed<string>(() => getFormattedPrice(WASH_DEEP_UPHOLSTERY_PRICE));
   const currencyAdditionalsTotal = computed<string>(() => getFormattedPrice(getAdditionalsTotal.value));
   const currencyTotalWithAdditionals = computed<string>(() => getFormattedPrice(getTotalWithAdditionals.value));
   const currencyTotalToPayWithAdditionals = computed<string>(() => getFormattedPrice(getTotalToPayWithAdditionals.value));
   const currencyIvaAndTax = computed<string>(() => getFormattedPrice(getIvaAndTaxAmount.value));
   
   
   // tooltip stuff
   const coverageDayPriceTooltip = computed(() => 
      withTotalCoverage.value ? currencyTotalCoverageDailyPrice.value : currencyCoverageDailyPrice.value
   );
   const dayPriceTooltip = computed(() => currencyVehicleDayCharge.value);
   const taxFeePriceTooltip = computed(() => currencyTaxFee.value);
   const ivaFeePriceTooltip = computed(() => currencyIvaFee.value);
   const actualTotalPriceTooltip = computed(() => currencyActualTotalPrice.value);
   
   return {
      // category attributes refs
      vehicleDayCharge,
      estimatedTotalAmount,
      totalCoverageUnitCharge,
      totalAmount,
      extraHoursQuantity,
      extraHoursTotalAmount,
      coverageTotalAmount,
      coverageQuantity,
      coverageUnitCharge,
      taxFeeAmount,
      discountAmount,
      discountPercentage,
      returnFeeAmount,
      numberDays,
      categoryCode,
      categoryDescription,
      categoryModels,
      categoryMonthPrices,
      referenceToken,
      rateQualifier,
      
      // category optional refs
      withTotalCoverage,
      withMileage,
      withExtraDriver,
      withBabySeat,
      withWash,
      
      // form refs
      haveMonthlyReservation,
      
      // elements IDs
      coverageCheckboxName,
      basicCoverageCheckboxID,
      totalCoverageCheckboxID,
      mileageCheckboxName,
      oneKmMileageCheckboxID,
      twoKmsMileageCheckboxID,
      threeKmsMileageCheckboxID,
      
      // tooltip stuff
      dayPriceTooltip,
      coverageDayPriceTooltip,
      taxFeePriceTooltip,
      ivaFeePriceTooltip,
      actualTotalPriceTooltip,
      
      // computed functions
      isMonthlyPriceUnavailable,
      getTotalPrice,
      getActualTotalPrice,
      getSubtotal,
      getTaxFeePrice,
      getIVAFeePrice,
      getDailyBasePrice,
      getDailyPrice,
      getDiscount,
      getFormattedDays,
      hasAdditionalServices,
      getAdditionalsTotal,
      getTotalWithAdditionals,
      getTotalToPayWithAdditionals,

      // currency formatted prices
      currencyTotalPrice,
      currencyActualTotalPrice,
      currencySubtotal,
      currencyTaxFee,
      currencyIvaFee,
      currencyVehicleDayCharge,
      currencyExtraHoursPrice,
      currencyCoverageDailyPrice,
      currencyCoveragePrice,
      currencyDailyPrice,
      currencyDailyBasePrice,
      currencyReturnFee,
      currencyExtraDriverPrice,
      currencyBabySeatPrice,
      currencyWashPrice,
      currencyWashOnsitePrice,
      currencyWashDeepPrice,
      currencyWashDeepUpholsteryPrice,
      currencyAdditionalsTotal,
      currencyTotalWithAdditionals,
      currencyTotalToPayWithAdditionals,
      currencyIvaAndTax,

      // other functions
      isPicoyPlacaExempt,
      hasDiscount,
      hasExtraHours,
      hasReturnFee,
      
   }
  
}