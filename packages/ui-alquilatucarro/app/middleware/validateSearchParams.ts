// Thin brand wrapper (issue #322 PR8, SCEN-322-V02): the deep-link validation
// logic lives ONCE in packages/logic. This file only exists because Nuxt
// auto-registers route middleware from app/middleware/ — pages declare it as
// `middleware: ['validate-search-params']`.
//
// alquilatucarro's results URL is `/{city}/buscar-vehiculos/...`, so the first
// path segment is the city (the factory default handles it: no declared page
// starts with /reservas).
import { createValidateSearchParams } from '@rentacar-main/logic/middleware/validateSearchParams';

export default defineNuxtRouteMiddleware(createValidateSearchParams());
