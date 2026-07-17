// Thin brand wrapper (issue #322 PR8, SCEN-322-V01/V02): alquicarros had NO
// deep-link validation — a /reservas PATH link with a past date or a legacy
// branch code died in an empty "Sin vehículos" wizard. The validation logic
// lives ONCE in packages/logic; this file only exists because Nuxt
// auto-registers route middleware from app/middleware/ — the /reservas PATH
// pages declare it as `middleware: ['validate-search-params']`.
//
// alquicarros' reservation surface is `/reservas` (PATH, no city segment —
// routing independence): the first segment is "reservas", NOT a city, so the
// factory treats it as nonCity and skips the #129 city-branch correction.
import { createValidateSearchParams } from '@rentacar-main/logic/middleware/validateSearchParams';

export default defineNuxtRouteMiddleware(
  createValidateSearchParams({ nonCitySegments: ['reservas'] }),
);
