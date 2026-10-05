
import * as v from "valibot";
import { normalizePhoneNumber } from "./normalizePhoneNumber";
import {
  getActivePhoneCountry,
  hasPhoneLengthProblem,
  isPhoneValidatorReady,
  isValidPhone,
} from "./phoneValidator";
import "@valibot/i18n/es";
v.setGlobalConfig({ lang: "es" });

// Identification formats by document type. The UI offers only these two:
// CC (Cédula de Ciudadanía): digits only, 7–12.
// PP (Pasaporte): alphanumeric, 6–15 — real passports include lowercase letters.
const CC_FORMAT = /^\d{7,12}$/;
const PP_FORMAT = /^[A-Za-z0-9]{6,15}$/;

// The extra driver has no document-type selector — one field takes both a cédula
// and a passport, so the format is the permissive union of the two. Kept separate
// from PP_FORMAT on purpose: the passport rule may tighten without dragging the
// extra driver's field along.
const EXTRA_DRIVER_DOCUMENT_FORMAT = /^[A-Za-z0-9]{6,15}$/;

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

/**
 * Pure rule for the extra driver's ID document (issue #396). Returns a Spanish
 * error message, or `null` when the value is acceptable.
 * Empty input returns `null` — presence is enforced by the cross-field check,
 * which only fires when the add-on is contracted.
 * Surrounding whitespace is tolerated (trimmed before checks).
 */
export function extraDriverDocumentError(documento: unknown): string | null {
  const id = String(documento ?? "").trim();
  if (id === "") return null;
  if (SENTINEL_BLOCKLIST.has(id)) {
    return "Escribe la identificación real del conductor adicional, no un valor de prueba";
  }
  return EXTRA_DRIVER_DOCUMENT_FORMAT.test(id)
    ? null
    : "El documento debe tener entre 6 y 15 caracteres (letras y números)";
}

const PHONE_MSG_GENERIC = "Número de teléfono o WhatsApp no válido";
const PHONE_MSG_NOT_COLOMBIA =
  "Este número no es de Colombia. ¿Es de otro país? Elige su bandera a la izquierda.";
const PHONE_MSG_OTHER_FLAG =
  "Este número no corresponde al país de la bandera. Revisa la bandera a la izquierda.";
const PHONE_MSG_INCOMPLETE =
  "Este número está incompleto o no corresponde a la bandera. Revísalo, y si es de otro país, elige su bandera a la izquierda.";

// Colombian numbers are exactly 10 digits: mobiles start with 3, landlines with
// 60 + a department digit (1, 2, 4, 5, 6, 7, 8).
const COLOMBIAN_SHAPE = /^(3|60[1245678])/;

/**
 * Message for a phone number the full metadata rejects. vue-tel-input prefixes
 * what the customer types with the flag's dial code only when its own (min)
 * metadata accepts the number; otherwise raw digits arrive and are judged
 * against the flag on screen (set by usePhoneFieldLoader).
 *
 * Length comes first: a wrong digit count is "incomplete", never "pick another
 * flag". Under Colombia, a Colombian-shaped number that is not 10 digits is a
 * typo too. Only a complete number that does not exist gets the flag message —
 * the case of a US number typed under the Colombian flag (+57 1 817…, +57 609…).
 * Without the metadata loaded nothing can be judged, so the generic message.
 */
export function phoneInvalidMessage(input: unknown): string {
  if (!isPhoneValidatorReady()) return PHONE_MSG_GENERIC;
  const value = String(input ?? "").trim();
  const digits = value.replace(/\D/g, "");

  if (value.startsWith("+")) {
    if (!value.startsWith("+57")) {
      return hasPhoneLengthProblem(value) ? PHONE_MSG_INCOMPLETE : PHONE_MSG_OTHER_FLAG;
    }
    return colombianFlagMessage(digits.slice(2));
  }

  const flag = getActivePhoneCountry();
  if (flag === "CO") return colombianFlagMessage(digits);
  if (!flag || hasPhoneLengthProblem(digits, flag)) return PHONE_MSG_INCOMPLETE;
  return PHONE_MSG_OTHER_FLAG;
}

function colombianFlagMessage(nationalDigits: string): string {
  if (hasPhoneLengthProblem(nationalDigits, "CO")) return PHONE_MSG_INCOMPLETE;
  // The shape is judged without the prefixes customers add by habit (0, 0057,
  // 57 without +): `0 300…` or `57 300 123 456` are Colombian typos too.
  const core = stripColombianPrefixes(nationalDigits);
  if (COLOMBIAN_SHAPE.test(core) && (core.length !== 10 || isValidPhone(`+57${core}`))) {
    return PHONE_MSG_INCOMPLETE;
  }
  return PHONE_MSG_NOT_COLOMBIA;
}

function stripColombianPrefixes(digits: string): string {
  let core = digits.replace(/^00/, "");
  if (/^57(3|60)/.test(core) && core.length >= 11) core = core.slice(2);
  return core.replace(/^0+/, "");
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
    v.custom(
      (input) => isValidPhone(normalizePhoneNumber(input as string)),
      (issue) => phoneInvalidMessage(issue.input)
    )
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
