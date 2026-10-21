/**
 * Normalizes the `?asesor=` value like the dashboard's resolveReferral
 * (trim + lowercase) and rejects only what cannot be a code: empty, over 60
 * chars, or containing whitespace, '/', '?' or '#'. Deliberately looser than
 * the dashboard form pattern: legacy codes may contain '_'.
 */
const MAX_LENGTH = 60;
const FORBIDDEN = /[\s/?#]/;

export function normalizeAdvisorCode(raw: unknown): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return null;
  const code = value.trim().toLowerCase();
  if (!code || code.length > MAX_LENGTH || FORBIDDEN.test(code)) return null;
  return code;
}
