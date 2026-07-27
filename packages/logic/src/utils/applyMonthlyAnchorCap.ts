/**
 * Caps the MONTHLY struck price at the market anchor.
 *
 * `one_day_price` is typed by hand in the dashboard and sits above the p95 of
 * what the gama really quotes in 7 of 8 monthly categories (GC: $550.000 typed
 * vs $280.607 real). Striking it through claims a discount nobody would have
 * paid. The anchor is the same p95 the daily flow uses, grossed up with tax and
 * IVA so the two figures are comparable.
 *
 * `min` and not "replace": where the typed price is already honest — at or
 * below the market — it stays, so this can only ever lower a struck price,
 * never raise one.
 *
 * DISPLAY ONLY. The real monthly price, the totals and the checkout never see
 * this; it feeds the `getDailyBasePrice` monthly branch and nothing else.
 *
 * Fails open on anything unusable (no anchor, NULL, non-finite, non-positive):
 * the customer sees today's `one_day_price` exactly as before.
 */
export function applyMonthlyAnchorCap(
  oneDayPrice: number,
  anchorGross: number | null | undefined,
): number {
  return Number.isFinite(anchorGross as number) &&
    (anchorGross as number) > 0 &&
    oneDayPrice > 0
    ? Math.min(oneDayPrice, anchorGross as number)
    : oneDayPrice
}
