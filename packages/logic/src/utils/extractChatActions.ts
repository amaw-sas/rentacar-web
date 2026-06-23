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
