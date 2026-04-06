/**
 * Converts a string to a URL-friendly slug
 *
 * This function transforms any text into a valid URL slug by:
 * - Normalizing accented characters (é → e, í → i, ñ → n)
 * - Converting to lowercase
 * - Replacing spaces with hyphens
 * - Removing special characters
 * - Removing duplicate hyphens
 *
 * @param text - The text to convert to slug
 * @returns The slugified string
 *
 * @example
 * slugify("Armenia Aeropuerto") // "armenia-aeropuerto"
 * slugify("Medellín Aeropuerto José María Córdoba") // "medellin-aeropuerto-jose-maria-cordoba"
 * slugify("Bogotá Centro Nuestro") // "bogota-centro-nuestro"
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')                     // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '')      // Remove diacritics (accents)
    .toLowerCase()                         // Convert to lowercase
    .trim()                                // Remove leading/trailing whitespace
    .replace(/[^a-z0-9\s-]/g, '')         // Remove special characters
    .replace(/\s+/g, '-')                  // Replace spaces with hyphens
    .replace(/-+/g, '-')                   // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');              // Remove leading/trailing hyphens
}
