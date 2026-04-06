// Note: utilities and composables are auto-imported by Nuxt
import {
  createDateFromString,
  createTimeFromString,
  createCurrentDateObject,
  isDateObject,
  isTimeObject,
  toDatetime,
  dayDifference,
  formatTime,
  formatTime12h,
  parseTime12hOr24h,
  isTime12hFormat
} from '@rentacar-main/logic/utils';

export default defineNuxtRouteMiddleware((to, from) => {

  const { createMessage } = useMessages();

  const lugar_recogida = to.params.lugar_recogida as string;
  const lugar_devolucion = to.params.lugar_devolucion as string;
  const fecha_recogida = to.params.fecha_recogida as string;
  let fecha_devolucion = to.params.fecha_devolucion as string;
  const hora_recogida = to.params.hora_recogida as string;
  const hora_devolucion = to.params.hora_devolucion as string;

  // Extract city context from URL path for city-aware defaults
  // e.g., "/armenia/buscar-vehiculos/..." → cityContext = "armenia"
  const pathSegments = to.path.split('/').filter(Boolean);
  const cityContext = pathSegments[0]; // First segment is always the city

  // Skip validation if route doesn't have search parameters (e.g., /bogota, /medellin)
  if (!fecha_recogida || !fecha_devolucion || !hora_recogida || !hora_devolucion) {
    return;
  }

  // Validate branch slugs (or legacy codes)
  const { searchBranchBySlugOrCode } = useStoreAdminData();
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

  // Puedes hacer validaciones o procesamiento basado en esos parámetros
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
  // Aquí no es necesario hacer nada, ya que si no retornas nada, la navegación continúa
})