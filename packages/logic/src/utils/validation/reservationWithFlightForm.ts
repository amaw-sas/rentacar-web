import * as v from 'valibot';
import '@valibot/i18n/es';
v.setGlobalConfig({ lang: 'es' });

import { ReservationFormValidationSchema } from './reservationForm';
import { FlightFormValidationSchema } from './flightForm';

export const ReservationWithFlightFormValidationSchema = v.object({
    ...ReservationFormValidationSchema.entries,
    ...FlightFormValidationSchema.entries,
});

export type ReservationWithFlightFormValidationSchemaType = v.InferOutput<typeof ReservationWithFlightFormValidationSchema>
