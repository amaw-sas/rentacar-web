import * as v from "valibot";
import "@valibot/i18n/es";
v.setGlobalConfig({ lang: "es" });

export const CategoryFormValidationSchema = v.object({
  vehiculo: v.pipe(
    v.string("Se requiere seleccionar una categoría de vehículo"),
    v.maxLength(2),
    v.check(
      (value) =>
        [
          "C",
          "F",
          "FL",
          "FX",
          "FY",
          "FU",
          "LY",
          "H",
          "G",
          "GC",
          "GL",
          "GR",
          "G4",
          "V",
          "LE",
          "LP",
          "VP",
          "GX",
        ].includes(value),
      "La categoría no es válida"
    )
  ),
});
