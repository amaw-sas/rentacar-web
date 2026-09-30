import { cityLookupError } from '@rentacar-main/logic/utils'

export default defineNuxtRouteMiddleware((to) => {
    const city = to.params.city;
    if (city) {
        const { cities } = useFetchRentacarData();

        // 404 SOLO con catálogo poblado: con el catálogo vacío este mismo
        // lookup fallido es un fallo de datos, no una URL inválida (SCEN-005,
        // docs/specs/2026-09-30-hydration-stale-catalog-race).
        const lookupError = cityLookupError(
            cities.some((c) => c.id === city),
            cities.length,
        )
        if (lookupError) {
            throw createError(lookupError)
        }
    }
})