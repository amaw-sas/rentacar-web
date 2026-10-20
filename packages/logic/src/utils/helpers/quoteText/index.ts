import { buildAlquicarrosText } from './alquicarros';
import { buildAlquilameText } from './alquilame';
import { buildAlquilatucarroText } from './alquilatucarro';
import type { QuoteFranchise, QuoteTextInput } from './model';

export type { QuoteFranchise, QuoteTextInput, QuoteTextRow } from './model';

const BUILDERS: Record<QuoteFranchise, (input: QuoteTextInput) => string> = {
  alquilame: buildAlquilameText,
  alquilatucarro: buildAlquilatucarroText,
  alquicarros: buildAlquicarrosText,
};

export function buildBrandQuoteText(input: QuoteTextInput, franchise: QuoteFranchise): string {
  return BUILDERS[franchise](input);
}
