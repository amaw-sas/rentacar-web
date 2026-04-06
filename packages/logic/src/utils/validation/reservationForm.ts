import * as v from 'valibot';
import '@valibot/i18n/es';
v.setGlobalConfig({ lang: 'es' });

import { CategoryFormValidationSchema } from './categoryForm';
import { UserInformationFormValidationSchema } from './userInformationForm';

export const ReservationFormValidationSchema = v.object({
    ...CategoryFormValidationSchema.entries,
    ...UserInformationFormValidationSchema.entries
})

export type ReservationFormValidationSchemaType = v.InferOutput<typeof ReservationFormValidationSchema>
