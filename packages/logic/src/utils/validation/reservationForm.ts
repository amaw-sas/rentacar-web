import * as v from 'valibot';
import '@valibot/i18n/es';
v.setGlobalConfig({ lang: 'es' });

import { CategoryFormValidationSchema } from './categoryForm';
import { userInformationEntries, identificationError } from './userInformationForm';

// Exported so the with-flight schema composes on the raw entries: `.entries` would
// drop the object-level identification check, so each leaf re-applies it.
export const reservationEntries = {
    ...CategoryFormValidationSchema.entries,
    ...userInformationEntries,
};

export const ReservationFormValidationSchema = v.pipe(
    v.object(reservationEntries),
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

export type ReservationFormValidationSchemaType = v.InferOutput<typeof ReservationFormValidationSchema>
