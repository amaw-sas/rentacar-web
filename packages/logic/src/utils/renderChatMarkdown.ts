/**
 * Minimal, safe Markdown-link renderer for chat bubbles.
 *
 * The chat bot emits `[label](url)` for its fallback CTAs (finish on the web /
 * message an advisor). We render those as button-styled anchors and HTML-escape
 * everything else, so the bubble shows short clickable buttons instead of a long
 * raw URL. Content comes from our own server, but we escape defensively so a
 * stray `<` can never inject markup. Only http(s) and tel URLs are linkified;
 * anything else is left as escaped text.
 */

const LINK_RE = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|tel:[^\s)]+)\)/g;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderChatMarkdown(text: string): string {
  let out = '';
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    const [full, label, url] = m;
    const idx = m.index ?? 0;
    out += escapeHtml(text.slice(last, idx));
    out +=
      `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" ` +
      `class="cc-link-btn">${escapeHtml(label)}</a>`;
    last = idx + full.length;
  }
  out += escapeHtml(text.slice(last));
  return out.replace(/\n/g, '<br>');
}
