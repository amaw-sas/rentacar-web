// Los predicados de tarifa mensual viven ahora en @rentacar-main/logic/utils
// (los comparte el botón «Copiar cotización»). Este archivo solo conserva la
// ruta de importación histórica del wizard.
export { sellablePlans, canQuoteTotalCoverageFor } from '@rentacar-main/logic/utils'
export type { SellablePlan, TotalCoverageQuotable } from '@rentacar-main/logic/utils'
