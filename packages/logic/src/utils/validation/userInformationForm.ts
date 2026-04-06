
import { isValidPhoneNumber } from 'libphonenumber-js';
import * as v from "valibot";
import "@valibot/i18n/es";
v.setGlobalConfig({ lang: "es" });

export const UserInformationFormValidationSchema = v.object({
  nombreCompleto: v.pipe(v.string("Escribe tus nombres"), v.minLength(1)),
  apellidos: v.pipe(v.string("Escribe tus apellidos"), v.minLength(1)),
  tipoIdentificacion: v.string("Selecciona una identificación"),
  identificacion: v.pipe(
    v.string("Escribe tu identificación"),
    v.minLength(5, "La identificación debe tener más de 5 caracteres")
  ),
  telefono: v.pipe(
    v.string("Escribe tu número de teléfono o WhatsApp"),
    v.minLength(5, "Escribe tu número de WhatsApp o teléfono"),
    v.custom((input) => isValidPhoneNumber(input as string), "Número de teléfono o WhatsApp no válido")
  ),
  email: v.pipe(v.string("Escribe tu email o correo electrónico"), v.email("Email no válido")),
  politicaPrivacidad: v.pipe(
    v.boolean("Debe aceptar las políticas de privacidad"),
    v.value(true, "Debe aceptar las políticas de privacidad")
  ),
});

export type UserInformationFormValidationSchemaType = v.InferOutput<
  typeof UserInformationFormValidationSchema
>;
