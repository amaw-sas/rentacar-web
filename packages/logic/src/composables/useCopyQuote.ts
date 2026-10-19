// External dependencies
import { computed, type ComputedRef, type Ref } from 'vue';
import { storeToRefs } from 'pinia';

// Internal dependencies - composables
import useCategory from './useCategory';

// Internal dependencies - stores
import useStoreReservationForm from '../stores/useStoreReservationForm';
import useStoreSearchData from '../stores/useStoreSearchData';

// Internal dependencies - utils
import {
  buildQuoteText,
  canQuoteTotalCoverageFor,
  formatQuoteDateTime,
  pickPriceForDate,
  sellablePlans,
} from '@rentacar-main/logic/utils';

// Types
import type { CategoryAvailabilityData, QuoteTextRow } from '@rentacar-main/logic/utils';

export interface CopyQuoteOptions {
  totalCoverage: boolean;
  babySeat: boolean;
}

// Mismo marcador que usa la tarjeta para una gama agotada.
const SOLD_OUT_AMOUNT = 999999999;

export default function useCopyQuote(
  rows: Ref<CategoryAvailabilityData[]> | ComputedRef<CategoryAvailabilityData[]>,
) {
  // Stores y toast se capturan en setup. useCategory corre en cada clic y solo toca
  // pinia/useState, que se resuelven en el cliente fuera de setup.
  const storeForm = useStoreReservationForm();
  const storeSearch = useStoreSearchData();
  const toast = useToast();
  const { extras } = useFetchRentacarData();
  const {
    haveMonthlyReservation,
    fechaRecogida,
    horaRecogida,
    fechaDevolucion,
    horaDevolucion,
    selectedPickupLocation,
    selectedReturnLocation,
  } = storeToRefs(storeForm);
  const { pending, searchOutdated } = storeToRefs(storeSearch);

  const isSoldOut = (row: CategoryAvailabilityData): boolean => row.estimatedTotalAmount === SOLD_OUT_AMOUNT;

  // Barato a propósito: sin useCategory, se evalúa en cada render del botón.
  const canCopy = computed<boolean>(() => {
    if (pending.value || searchOutdated.value) return false;
    return rows.value.some((row) => {
      if (isSoldOut(row)) return false;
      if (!haveMonthlyReservation.value) return row.estimatedTotalAmount > 0;
      return sellablePlans(row.categoryMonthPrices, fechaRecogida.value).length > 0;
    });
  });

  const buildText = (opts: CopyQuoteOptions): string | null => {
    const monthly = haveMonthlyReservation.value;
    const kept: QuoteTextRow[] = [];
    let first: ReturnType<typeof useCategory> | null = null;

    for (const row of rows.value) {
      if (isSoldOut(row)) continue;

      // Instancia nueva por llamada: useCategory copia la fila al crearse.
      const cat = useCategory(row);
      let plan: QuoteTextRow['plan'];

      if (monthly) {
        const plans = sellablePlans(row.categoryMonthPrices, fechaRecogida.value);
        if (plans.length === 0) continue;
        const chosen = plans[0]!.value;
        cat.withMileage.value = chosen;
        plan = chosen as QuoteTextRow['plan'];
      }

      let withoutTotalCoverage = false;
      if (opts.totalCoverage) {
        // Mensual cobra total_insurance_price de la fila del mes; regular, el cargo diario.
        const quotable = monthly
          ? (pickPriceForDate(row.categoryMonthPrices ?? [], fechaRecogida.value ?? '')?.total_insurance_price ?? 0) > 0
          : canQuoteTotalCoverageFor({ canQuoteTotalCoverage: cat.canQuoteTotalCoverage.value }, false);
        if (quotable) cat.withTotalCoverage.value = true;
        else withoutTotalCoverage = true;
      }

      const price = cat.getActualTotalPrice.value;
      if (!(price > 0)) continue;

      first ??= cat;
      kept.push({
        code: row.categoryCode,
        description: row.categoryDescription,
        price,
        ...(withoutTotalCoverage && { withoutTotalCoverage }),
        ...(plan && { plan }),
      });
    }

    if (!first) return null;

    const pickupBranch = selectedPickupLocation.value?.name ?? '';
    const returnBranch = selectedReturnLocation.value?.name ?? pickupBranch;

    return buildQuoteText({
      pickupBranch,
      returnBranch,
      pickupDateTime: formatQuoteDateTime(fechaRecogida.value ?? '', horaRecogida.value ?? ''),
      returnDateTime: formatQuoteDateTime(fechaDevolucion.value ?? '', horaDevolucion.value ?? ''),
      days: monthly ? 30 : first.numberDays.value,
      extraHours: monthly ? 0 : (first.extraHoursQuantity.value ?? 0),
      monthly,
      totalCoverage: opts.totalCoverage,
      rows: kept,
      babySeat: opts.babySeat
        ? {
            total: first.getBabySeatPrice.value,
            // Mismo respaldo que useCategory.BABY_SEAT_DAY_PRICE.
            dailyPrice: extras?.babySeatDayPrice ?? 12000,
            monthly,
          }
        : null,
    });
  };

  const copy = async (opts: CopyQuoteOptions): Promise<boolean> => {
    if (import.meta.server) return false;

    const text = buildText(opts);
    if (text === null) {
      toast.add({ title: 'No hay gamas para copiar', color: 'error' });
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.add({
        title: 'Cotización copiada',
        description: 'Pégala en WhatsApp para el cliente',
        color: 'success',
        icon: 'i-heroicons-clipboard-document-check',
      });
      return true;
    } catch (err) {
      console.error('Error al copiar la cotización:', err);
      toast.add({
        title: 'No se pudo copiar',
        description: 'Inténtalo de nuevo en unos segundos',
        color: 'error',
      });
      return false;
    }
  };

  return { canCopy, buildText, copy };
}
