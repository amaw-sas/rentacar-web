import * as v from 'valibot';
import '@valibot/i18n/es';
v.setGlobalConfig({ lang: 'es' });

export const SearcherFormValidationSchema = v.object({
    lugarRecogida: v.string('No es un lugar válido'),
    fechaRecogida: v.string('Se requiere una fecha de recogida'),
    horaRecogida: v.string('Se requiere una hora de recogida'),
    lugarDevolucion: v.string('No es un lugar válido'),
    fechaDevolucion: v.string('Se requiere una fecha de devolución'),
    horaDevolucion: v.string('Se requiere una hora de devolución'),
})