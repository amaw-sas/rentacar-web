// Tarifa general de IVA en Colombia, fija por ley (Estatuto Tributario).
// Fuente de verdad: el dashboard, que emite `IVAFeePercentage` en el payload de
// disponibilidad. Esta constante es SOLO el fallback usado mientras el dashboard
// no despliega ese campo — evita un NaN en el cálculo del IVA cuando el % aún no
// existe. No es un segundo dueño del dato: en cuanto el payload trae el %, este
// valor deja de usarse. Issue #314.
export const IVA_PERCENTAGE = 19;
