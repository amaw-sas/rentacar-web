
import { isValidPhoneNumber } from 'libphonenumber-js';
import * as v from "valibot";
import { normalizePhoneNumber } from "./normalizePhoneNumber";
import "@valibot/i18n/es";
v.setGlobalConfig({ lang: "es" });

// Identification formats by document type. The UI offers only these two:
// CC (Cédula de Ciudadanía): digits only, 7–12.
// PP (Pasaporte): alphanumeric, 6–15 — real passports include lowercase letters.
const CC_FORMAT = /^\d{7,12}$/;
const PP_FORMAT = /^[A-Za-z0-9]{6,15}$/;

// Trivial sentinels that hijack customer records on CC collision (issue #44).
// Rejected for every document type.
const SENTINEL_BLOCKLIST = new Set([
  "123456", "1234567", "12345678", "123456789", "1234567890",
  "000000", "0000000", "00000000",
  "111111",
  "999999", "9999999", "99999999", "999999999", "9999999999",
]);

/**
 * Pure cross-field rule for `identificacion`, keyed on `tipoIdentificacion`.
 * Returns a Spanish error message, or `null` when the value is acceptable.
 * Empty input returns `null` — presence is enforced by the field-level pipe.
 * Surrounding whitespace is tolerated (trimmed before checks).
 */
export function identificationError(
  tipoIdentificacion: unknown,
  identificacion: unknown
): string | null {
  const id = String(identificacion ?? "").trim();
  if (id === "") return null;
  if (SENTINEL_BLOCKLIST.has(id)) {
    return "Escribe tu identificación real, no un valor de prueba";
  }
  if (tipoIdentificacion === "Cedula Ciudadania") {
    return CC_FORMAT.test(id) ? null : "La cédula debe tener solo números (7 a 12 dígitos)";
  }
  if (tipoIdentificacion === "Pasaporte") {
    return PP_FORMAT.test(id) ? null : "El pasaporte debe tener entre 6 y 15 caracteres (letras y números)";
  }
  // Unknown/unselected type: blocklist already applied, no format enforced.
  return null;
}

// Shared field entries. Exported so composed schemas spread them WITHOUT the
// object-level identification check (which `.entries` would drop) and re-apply it
// themselves. The check itself is inlined per schema — valibot only infers the
// cross-field input type when `v.forward(v.partialCheck(...))` is written directly
// inside the `v.pipe`, so it can't be shared; the LOGIC stays in `identificationError`.
export const userInformationEntries = {
  nombreCompleto: v.pipe(v.string("Escribe tus nombres"), v.minLength(1)),
  apellidos: v.pipe(v.string("Escribe tus apellidos"), v.minLength(1)),
  tipoIdentificacion: v.string("Selecciona una identificación"),
  identificacion: v.pipe(
    v.string("Escribe tu identificación"),
    v.minLength(1, "Escribe tu identificación")
  ),
  telefono: v.pipe(
    v.string("Escribe tu número de teléfono o WhatsApp"),
    v.minLength(5, "Escribe tu número de WhatsApp o teléfono"),
    v.custom((input) => isValidPhoneNumber(normalizePhoneNumber(input as string)), "Número de teléfono o WhatsApp no válido")
  ),
  email: v.pipe(v.string("Escribe tu email o correo electrónico"), v.email("Email no válido")),
  politicaPrivacidad: v.pipe(
    v.boolean("Debe aceptar las políticas de privacidad"),
    v.value(true, "Debe aceptar las políticas de privacidad")
  ),
};

export const UserInformationFormValidationSchema = v.pipe(
  v.object(userInformationEntries),
  // Cross-field identification check forwarded onto the `identificacion` field.
  v.forward(
    v.partialCheck(
      [["tipoIdentificacion"], ["identificacion"]],
      (input) => identificationError(input.tipoIdentificacion, input.identificacion) === null,
      (issue) =>
        identificationError(issue.input.tipoIdentificacion, issue.input.identificacion) ??
        "Identificación no válida"
    ),
    ["identificacion"]
  )
);

export type UserInformationFormValidationSchemaType = v.InferOutput<
  typeof UserInformationFormValidationSchema
>;
