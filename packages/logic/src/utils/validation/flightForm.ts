import * as v from 'valibot';
import '@valibot/i18n/es';
v.setGlobalConfig({ lang: 'es' });

export const FlightFormValidationSchema = v.object({
    aerolinea: v.pipe(v.string('Se requiere la aerolinea'), v.minLength(3) ),
    numeroVueloIda: v.pipe(v.string('Se requiere el número de vuelo de ida'), v.minLength(3) ),
})