// Initial flag of the phone field: the flag last shown in the form, then the
// visitor's country, then Colombia. A code only counts if the phone input offers
// it (`known`); otherwise the next candidate is tried. Never returns empty.

const FALLBACK_COUNTRY = 'CO'

export function pickPhoneCountry(
  stored: string | null | undefined,
  visitor: string | null | undefined,
  known: ReadonlySet<string>,
): string {
  for (const candidate of [stored, visitor, FALLBACK_COUNTRY]) {
    if (!candidate) continue
    const code = candidate.toUpperCase()
    if (known.has(code)) return code
  }
  return FALLBACK_COUNTRY
}
