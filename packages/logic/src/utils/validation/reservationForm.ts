import * as v from 'valibot';
import '@valibot/i18n/es';
v.setGlobalConfig({ lang: 'es' });

import { CategoryFormValidationSchema } from './categoryForm';
import { userInformationEntries, identificationError, extraDriverDocumentError } from './userInformationForm';

const isBlank = (value: unknown) => String(value ?? '').trim() === '';

// Presence + format for the extra driver's document in a single message-producing
// rule, so the forwarded issue carries the specific reason (missing / sentinel /
// malformed) instead of a generic one.
function extraDriverDocumentIssue(contratado: unknown, documento: unknown): string | null {
    if (contratado !== true) return null;
    if (isBlank(documento)) return 'Escribe la cédula o documento del conductor adicional';
    return extraDriverDocumentError(documento);
}

// Exported so the with-flight schema composes on the raw entries: `.entries` would
// drop the object-level identification check, so each leaf re-applies it.
export const reservationEntries = {
    ...CategoryFormValidationSchema.entries,
    ...userInformationEntries,
    // Extra driver (issue #396). `conductorAdicional` mirrors
    // `selectedCategory.withExtraDriver` into the form state — it lives in the search
    // store, where the schema cannot reach it.
    // `nullish`, NOT `optional`: the store refs start at `null` and `optional` only
    // neutralises `undefined`, which would reject every reservation in every brand.
    conductorAdicional: v.nullish(v.boolean(), false),
    conductorAdicionalNombre: v.nullish(v.string(), ''),
    conductorAdicionalIdentificacion: v.nullish(v.string(), ''),
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
    ),
    // Extra driver name — required only while the add-on is contracted. Written
    // inline because valibot infers the cross-field input type only when
    // `v.forward(v.partialCheck(...))` sits literally inside the `v.pipe`.
    v.forward(
        v.partialCheck(
            [["conductorAdicional"], ["conductorAdicionalNombre"]],
            (input) => input.conductorAdicional !== true || !isBlank(input.conductorAdicionalNombre),
            "Escribe el nombre del conductor adicional"
        ),
        ["conductorAdicionalNombre"]
    ),
    v.forward(
        v.partialCheck(
            [["conductorAdicional"], ["conductorAdicionalIdentificacion"]],
            (input) =>
                extraDriverDocumentIssue(input.conductorAdicional, input.conductorAdicionalIdentificacion) === null,
            (issue) =>
                extraDriverDocumentIssue(issue.input.conductorAdicional, issue.input.conductorAdicionalIdentificacion) ??
                "Documento del conductor adicional no válido"
        ),
        ["conductorAdicionalIdentificacion"]
    )
);

export type ReservationFormValidationSchemaType = v.InferOutput<typeof ReservationFormValidationSchema>
