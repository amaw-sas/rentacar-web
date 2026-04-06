// External dependencies
import { ref } from 'vue';

// Internal dependencies - utils
import { createCurrentDateObject } from '@rentacar-main/logic/utils';

/**
 * Returns default route parameters for search URLs
 * @param cityContext - Optional city slug to use for location defaults (e.g., "armenia", "medellin")
 *                      If provided, returns city-specific airport (e.g., "armenia-aeropuerto")
 *                      If not provided, falls back to global default ("bogota-aeropuerto")
 */
export default function useDefaultRouteParams(cityContext?: string){
    const defaultBranch = cityContext
        ? `${cityContext}-aeropuerto`
        : 'bogota-aeropuerto'; // Fallback global default
    const defaultHour = '12:00pm';
    const defaultDaysRange = 7;

    const currentDay = createCurrentDateObject();
    const nextDay = currentDay.add({ days: 1 });
    const nextWeekDay = nextDay.add({ days: defaultDaysRange });

    const defaultLugarRecogida = ref<string | null>(defaultBranch);
    const defaultLugarDevolucion = ref<string | null>(defaultBranch);
    const defaultFechaRecogida = ref<string | null>(nextDay.toString());
    const defaultFechaDevolucion = ref<string | null>(nextWeekDay.toString());
    const defaultHoraRecogida = ref<string | null>(defaultHour);
    const defaultHoraDevolucion = ref<string | null>(defaultHour);

    return {
        defaultLugarRecogida,
        defaultLugarDevolucion,
        defaultFechaRecogida,
        defaultFechaDevolucion,
        defaultHoraRecogida,
        defaultHoraDevolucion,
    }
}