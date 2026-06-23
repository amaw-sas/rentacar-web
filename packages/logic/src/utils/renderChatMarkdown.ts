/**
 * Minimal, safe Markdown renderer for chat bubbles.
 *
 * Supports two inline marks the bot emits:
 *  - `[label](url)`  → button-styled anchor (fallback CTAs). Only http(s)/tel URLs.
 *  - `**bold**`       → `<strong>` (e.g. price, request code).
 *
 * Everything else is HTML-escaped FIRST, then the two marks are applied on the
 * escaped string (the `*`, `[`, `]`, `(`, `)` markers survive escaping). Content
 * comes from our own server, but we escape defensively so a stray `<` can never
 * inject markup. Newlines become <br>.
 */

const LINK_RE = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|tel:[^\s)]+)\)/g;
const BOLD_RE = /\*\*([^*\n]+)\*\*/g;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderChatMarkdown(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(
    LINK_RE,
    (_m, label: string, url: string) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="cc-link-btn">${label}</a>`,
  );
  html = html.replace(BOLD_RE, '<strong>$1</strong>');
  return html.replace(/\n/g, '<br>');
}
