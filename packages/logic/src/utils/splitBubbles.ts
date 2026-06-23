/**
 * Split an assistant reply into separate chat bubbles.
 *
 * The bot emits a line containing only `---` between topics (max 3 bubbles) so the
 * widget can render WhatsApp-style multiple bubbles instead of one long block.
 * We split on a line that is ONLY dashes (3+), trim, and drop empties. Inline
 * dashes inside a sentence are NOT separators (the regex needs newlines around).
 * If there's no separator, returns the whole text as a single bubble.
 */
export function splitBubbles(text: string): string[] {
  return text
    .split(/\n\s*-{3,}\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
