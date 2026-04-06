import * as v from 'valibot';
import '@valibot/i18n/es';
v.setGlobalConfig({ lang: 'es' });

import { UserInformationFormValidationSchema } from './userInformationForm';
import { FlightFormValidationSchema } from './flightForm';

export const UserInformationWithFlightFormValidationSchema = v.object({
    ...UserInformationFormValidationSchema.entries,
    ...FlightFormValidationSchema.entries,
});