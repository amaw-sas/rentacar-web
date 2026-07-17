// Shared deep-link validation for the reservation results routes (issue #322 PR8,
// SCEN-322-V02). This used to live as two ~270-line near-identical copies in
// ui-alquilatucarro and ui-alquilame (and alquicarros had NONE — SCEN-322-V01:
// a past-date or legacy-code deep-link died in an empty "Sin vehículos" grid).
// Now there is ONE implementation here; each brand keeps a thin wrapper in
// app/middleware/validateSearchParams.ts (Nuxt auto-registers route middleware
// from that dir only) that wraps this factory in defineNuxtRouteMiddleware.
//
// Note: `navigateTo` is a Nuxt auto-import (same convention as useRoute in
// useSearch.ts) — resolved by the app build's unimport transform. Unit tests
// stub it via vi.stubGlobal.
import type { RouteLocationNormalized } from 'vue-router';

// Internal dependencies - stores / composables (relative, logic-internal)
import useStoreAdminData from '../stores/useStoreAdminData';
import useDefaultRouteParams from '../composables/useDefaultRouteParams';
import useMessages from '../composables/useMessages';

// Internal dependencies - utils
import {
  createDateFromString,
  createCurrentDateObject,
  isDateObject,
  isTimeObject,
  toDatetime,
  dayDifference,
  formatTime12h,
  parseTime12hOr24h,
  isTime12hFormat,
  resolveCityBranchCorrection,
} from '@rentacar-main/logic/utils';

export interface ValidateSearchParamsOptions {
  /**
   * First path segments that are NOT a city (the single line that differed
   * between the two brand copies). On alquilame/alquicarros the reservation
   * surface is `/reservas` (PATH, no city segment — routing independence):
   * there the first segment is "reservas", NOT a city, so cityContext must be
   * undefined — the #129 city-branch correction is skipped (guarded by
   * `cityContext ?` below) and useDefaultRouteParams falls back to the global
   * default (bogota-aeropuerto). On alquilatucarro the results URL is
   * `/{city}/buscar-vehiculos/...`, so the first segment IS the city; its
   * declared pages never start with /reservas, which makes the default safe
   * for every brand.
   */
  nonCitySegments?: string[];
}

/**
 * Factory for the validate-search-params route middleware body. Corrects
 * (via redirect to `to.name`, so each brand's own route tree is targeted):
 *  - unknown branch slugs/codes → brand/city defaults (+ info toast)
 *  - city-foreign pickup branch → city default (#129)
 *  - legacy branch CODES → slugs
 *  - legacy 24h times → 12h (invalid times → defaults + toast)
 *  - malformed dates/times → defaults (+ toast)
 *  - pickup date in the past → tomorrow / +7 days (SCEN-322-V01)
 *  - >30-day windows → 30-day cap (+ toast); ==30-day windows pin the return hour
 */
export function createValidateSearchParams(
  options: ValidateSearchParamsOptions = {},
) {
  const { nonCitySegments = ['reservas'] } = options;

  return (to: RouteLocationNormalized) => {
    const { createMessage } = useMessages();

    const lugar_recogida = to.params.lugar_recogida as string;
    const lugar_devolucion = to.params.lugar_devolucion as string;
    const fecha_recogida = to.params.fecha_recogida as string;
    let fecha_devolucion = to.params.fecha_devolucion as string;
    const hora_recogida = to.params.hora_recogida as string;
    const hora_devolucion = to.params.hora_devolucion as string;

    // Extract city context from URL path for city-aware defaults
    // e.g., "/armenia/buscar-vehiculos/..." → cityContext = "armenia".
    // See ValidateSearchParamsOptions.nonCitySegments for the /reservas case.
    const pathSegments = to.path.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];
    const cityContext =
      firstSegment && nonCitySegments.includes(firstSegment)
        ? undefined
        : firstSegment;

    // Skip validation if route doesn't have search parameters (e.g., /bogota, /medellin)
    if (!fecha_recogida || !fecha_devolucion || !hora_recogida || !hora_devolucion) {
      return;
    }

    // Validate branch slugs (or legacy codes)
    const { searchBranchBySlugOrCode, searchBranchByCity } = useStoreAdminData();
    const pickupBranch = searchBranchBySlugOrCode(lugar_recogida);
    const returnBranch = searchBranchBySlugOrCode(lugar_devolucion);

    if (!pickupBranch || !returnBranch) {
      const {
        defaultLugarRecogida,
        defaultLugarDevolucion,
        defaultFechaRecogida,
        defaultFechaDevolucion,
        defaultHoraRecogida,
        defaultHoraDevolucion
      } = useDefaultRouteParams(cityContext);

      to.params.lugar_recogida = defaultLugarRecogida.value as string;
      to.params.lugar_devolucion = defaultLugarDevolucion.value as string;
      to.params.fecha_recogida = defaultFechaRecogida.value as string;
      to.params.fecha_devolucion = defaultFechaDevolucion.value as string;
      to.params.hora_recogida = defaultHoraRecogida.value as string;
      to.params.hora_devolucion = defaultHoraDevolucion.value as string;

      createMessage({
        type: "info",
        message: "Ubicación inválida. Se ajustó a la sede por defecto.",
      });

      return navigateTo({
        name: to.name,
        params: to.params,
        query: to.query,
      });
    }

    // Issue #129: the pickup branch must belong to the page's city. If it's foreign,
    // fall to the city's default branch and redirect to the corrected URL (the return
    // is realigned only when it is also foreign — a legitimate one-way is untouched).
    const cityCorrection = cityContext
      ? resolveCityBranchCorrection(
          pickupBranch,
          returnBranch,
          cityContext,
          searchBranchByCity(cityContext),
        )
      : null;
    if (cityCorrection) {
      to.params.lugar_recogida = cityCorrection.lugar_recogida;
      if (cityCorrection.lugar_devolucion) {
        to.params.lugar_devolucion = cityCorrection.lugar_devolucion;
      }

      createMessage({
        type: "info",
        message: "La sede de recogida no corresponde a la ciudad; se ajustó a la sede por defecto.",
      });

      return navigateTo({
        name: to.name,
        params: to.params,
        query: to.query,
      });
    }

    // Redirect if using legacy codes instead of slugs
    const isPickupSlug = pickupBranch.slug === lugar_recogida;
    const isReturnSlug = returnBranch.slug === lugar_devolucion;

    if (!isPickupSlug || !isReturnSlug) {
      // Legacy code detected - redirect to slug-based URL
      to.params.lugar_recogida = pickupBranch.slug;
      to.params.lugar_devolucion = returnBranch.slug;

      return navigateTo({
        name: to.name,
        params: to.params,
        query: to.query,
      });
    }

    // Validate time formats and redirect legacy 24h to 12h
    const isPickup12h = isTime12hFormat(hora_recogida);
    const isReturn12h = isTime12hFormat(hora_devolucion);

    if (!isPickup12h || !isReturn12h) {
      // Parse times (supporting both formats)
      const pickupTime = parseTime12hOr24h(hora_recogida);
      const returnTime = parseTime12hOr24h(hora_devolucion);

      if (!pickupTime || !returnTime) {
        // Invalid time format - fallback to defaults
        const {
          defaultLugarRecogida,
          defaultLugarDevolucion,
          defaultFechaRecogida,
          defaultFechaDevolucion,
          defaultHoraRecogida,
          defaultHoraDevolucion
        } = useDefaultRouteParams(cityContext);

        to.params.lugar_recogida = defaultLugarRecogida.value as string;
        to.params.lugar_devolucion = defaultLugarDevolucion.value as string;
        to.params.fecha_recogida = defaultFechaRecogida.value as string;
        to.params.fecha_devolucion = defaultFechaDevolucion.value as string;
        to.params.hora_recogida = defaultHoraRecogida.value as string;
        to.params.hora_devolucion = defaultHoraDevolucion.value as string;

        createMessage({
          type: "info",
          message: "Formato de hora inválido. Se ajustó al valor por defecto.",
        });

        return navigateTo({ name: to.name, params: to.params, query: to.query });
      }

      // Legacy 24h format detected - redirect to 12h URL
      to.params.hora_recogida = formatTime12h(toDatetime(createCurrentDateObject(), pickupTime));
      to.params.hora_devolucion = formatTime12h(toDatetime(createCurrentDateObject(), returnTime));

      return navigateTo({ name: to.name, params: to.params, query: to.query });
    }

    const dateFechaRecogida = createDateFromString(fecha_recogida);
    const dateFechaDevolucion = createDateFromString(fecha_devolucion);
    const dateHoraRecogida = parseTime12hOr24h(hora_recogida);
    const dateHoraDevolucion = parseTime12hOr24h(hora_devolucion);

    // Malformed date/time params → defaults + redirect
    if (
      !(
        isDateObject(dateFechaRecogida) &&
        isDateObject(dateFechaDevolucion) &&
        isTimeObject(dateHoraRecogida) &&
        isTimeObject(dateHoraDevolucion)
      )
    ) {

      const {
        defaultLugarRecogida,
        defaultLugarDevolucion,
        defaultFechaRecogida,
        defaultFechaDevolucion,
        defaultHoraRecogida,
        defaultHoraDevolucion
      } = useDefaultRouteParams(cityContext);

      to.params.lugar_recogida = defaultLugarRecogida.value as string;
      to.params.lugar_devolucion = defaultLugarDevolucion.value as string;
      to.params.fecha_recogida = defaultFechaRecogida.value as string;
      to.params.fecha_devolucion = defaultFechaDevolucion.value as string;
      to.params.hora_recogida = defaultHoraRecogida.value as string;
      to.params.hora_devolucion = defaultHoraDevolucion.value as string;

      createMessage({
        type: "info",
        message: "Parámetros inválidos. Se ajustaron a los valores por defecto.",
      });

      return navigateTo({
        name: to.name,
        params: {
          ...to.params,
        },
        query: to.query,
      });

    }

    // Validación: fecha de recogida en el pasado
    // Si el usuario accede con una URL que tiene fecha pasada (ej: link guardado, historial),
    // redirige automáticamente a mañana con devolución +7 días para evitar errores.
    // Impacto: bajo, solo afecta URLs con fechas inválidas.
    const today = createCurrentDateObject();
    if (dateFechaRecogida.compare(today) < 0) {
      const tomorrow = today.add({ days: 1 });
      const newReturnDate = tomorrow.add({ days: 7 });

      to.params.fecha_recogida = tomorrow.toString();
      to.params.fecha_devolucion = newReturnDate.toString();

      return navigateTo({
        name: to.name,
        params: {
          ...to.params
        }
      });
    }

    // Cuando la diferencia de fechas es mensual
    if(
      dayDifference(dateFechaDevolucion, dateFechaRecogida) == 30
      && dateHoraDevolucion.compare(dateHoraRecogida) > 0
    ){
        to.params.hora_devolucion = formatTime12h(toDatetime(createCurrentDateObject(), dateHoraRecogida));

        return navigateTo({
          name: to.name,
          params: {
            ...to.params
          },
          query: to.query,
        });

    }

    // Cuando la diferencia de fechas supera el mes
    if(dayDifference(dateFechaDevolucion, dateFechaRecogida) > 30){

      fecha_devolucion = (dateFechaRecogida.copy()).add({days: 30}).toString();
      to.params.fecha_devolucion = fecha_devolucion;


      createMessage({
        type: "info",
        message: "La fecha de devolución ha sido ajustada a 30 días después de la fecha de recogida.",
      });

      return navigateTo({
        name: to.name,
        params: {
          ...to.params
        },
        query: to.query,
      });

    }

    // Si la validación pasa, continúa con la navegación
    // Aquí no es necesario hacer nada — si no retornas nada, la navegación continúa
  };
}

export default createValidateSearchParams;
