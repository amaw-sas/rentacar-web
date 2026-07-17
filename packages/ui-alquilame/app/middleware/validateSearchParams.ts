// Thin brand wrapper (issue #322 PR8, SCEN-322-V02): the deep-link validation
// logic lives ONCE in packages/logic. This file only exists because Nuxt
// auto-registers route middleware from app/middleware/ — the /reservas PATH
// pages declare it as `middleware: ['validate-search-params']`.
//
// alquilame's reservation surface is `/reservas` (PATH, no city segment —
// routing independence): the first segment is "reservas", NOT a city, so the
// factory treats it as nonCity and skips the #129 city-branch correction.
import { createValidateSearchParams } from '@rentacar-main/logic/middleware/validateSearchParams';

export default defineNuxtRouteMiddleware(
  createValidateSearchParams({ nonCitySegments: ['reservas'] }),
);
