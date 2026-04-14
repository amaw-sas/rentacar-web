import * as v from "valibot";
import "@valibot/i18n/es";
v.setGlobalConfig({ lang: "es" });

// Vehicle category code validation: must be a non-empty string.
// We don't hardcode a whitelist here — Localiza adds/renames categories over
// time and the admin API already validates against the current catalog.
export const CategoryFormValidationSchema = v.object({
  vehiculo: v.pipe(
    v.string("Se requiere seleccionar una categoría de vehículo"),
    v.minLength(1, "Selecciona una categoría de vehículo"),
  ),
});
