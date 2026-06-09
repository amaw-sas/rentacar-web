import * as v from 'valibot';
import '@valibot/i18n/es';
v.setGlobalConfig({ lang: 'es' });

import { reservationEntries } from './reservationForm';
import { identificationError } from './userInformationForm';
import { FlightFormValidationSchema } from './flightForm';

export const ReservationWithFlightFormValidationSchema = v.pipe(
    v.object({
        ...reservationEntries,
        ...FlightFormValidationSchema.entries,
    }),
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

export type ReservationWithFlightFormValidationSchemaType = v.InferOutput<typeof ReservationWithFlightFormValidationSchema>
