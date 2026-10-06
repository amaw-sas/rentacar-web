/**
 * Extract the chat fallback CTAs from a `crear_reserva` tool output.
 *
 * When a booking fails, the server returns `completar_en_web` / `whatsapp_asesor`
 * URLs in the tool result (streamed as a `tool-output-available` SSE part). We
 * render those as buttons FROM THIS STRUCTURED DATA — never from the model's text:
 * gpt-5-mini corrupts/fabricates long URLs when it echoes them (the same reason
 * the quote is injected server-side). Only http(s) URLs are accepted.
 */

export interface ChatActions {
  web?: string;
  whatsapp?: string;
  // WhatsApp "share to anyone" link (wa.me/?text=…) the brain emits on the
  // self-serve / "tómate tu tiempo" path via the `data-buttons` part. Never set by
  // extractChatActions (a booking-failure tool output has no share link) — only by
  // the composable's data-buttons handler. Rendered as a "Compartir cotización" button.
  share?: string;
  // Action buttons from the `data-buttons` part (e.g. "Quiero reservar"): tapping
  // one sends its label verbatim as the customer's message. Arrival order kept.
  opciones?: string[];
}

// Keeps the non-empty string labels in order; undefined when none survive.
export function cleanChatOptions(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const labels = value.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
  return labels.length ? labels : undefined;
}

function httpUrl(v: unknown): string | undefined {
  return typeof v === 'string' && /^https?:\/\//.test(v) ? v : undefined;
}

export function extractChatActions(output: unknown): ChatActions | null {
  if (!output || typeof output !== 'object') return null;
  const o = output as { completar_en_web?: unknown; whatsapp_asesor?: unknown };
  const web = httpUrl(o.completar_en_web);
  const whatsapp = httpUrl(o.whatsapp_asesor);
  if (!web && !whatsapp) return null;
  return { web, whatsapp };
}
