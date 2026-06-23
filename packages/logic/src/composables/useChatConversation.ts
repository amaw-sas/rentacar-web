/**
 * useChatConversation — drives the AI chat bubble against the dashboard brain.
 *
 * Talks to `${rentacarPublicApiBase}/api/chat` (the published rentacar-dashboard
 * endpoint), which streams the AI SDK UI Message Stream protocol over SSE
 * (text/event-stream, `data: {type,...}` lines: text-start / text-delta /
 * text-end / reasoning-* / ...).
 *
 * We consume that SSE by hand with fetch + a ReadableStream reader instead of
 * @ai-sdk/vue. Rationale: @ai-sdk/vue's `Chat` pulls the whole `ai` barrel
 * (→ @ai-sdk/gateway → @vercel/oidc, server-only code) into the client bundle —
 * it breaks Vite dev hydration through the linked logic layer and bloats a site
 * tuned hard for Core Web Vitals. We only need text deltas + the conversation
 * id, so a ~zero-dependency parser is lighter and fully under our control.
 *
 * Per-brand wiring (no hardcoded numbers): `brand` is franchise.shortname. The
 * endpoint returns x-conversation-id (CORS-exposed); we capture it and resend it
 * so the dashboard keeps the same server-side conversation. conversationId +
 * the transcript persist in localStorage (per brand) so the chat survives
 * reloads and SSR/ISR navigation. Reasoning parts are ignored.
 */
import { computed, ref } from 'vue';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

type ChatStatus = 'ready' | 'submitting' | 'streaming' | 'error';

export function useChatConversation() {
  const { franchise } = useAppConfig();
  const { rentacarPublicApiBase } = useRuntimeConfig().public;

  const brand = franchise.shortname as string;
  const api = `${rentacarPublicApiBase}/api/chat`;
  const messagesKey = `rentacar-chat:${brand}:messages`;
  const conversationKey = `rentacar-chat:${brand}:conversationId`;

  function restore(): ChatMessage[] {
    if (!import.meta.client) return [];
    try {
      const raw = localStorage.getItem(messagesKey);
      return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    } catch {
      return [];
    }
  }

  const messages = ref<ChatMessage[]>(restore());
  const input = ref('');
  const status = ref<ChatStatus>('ready');
  const error = ref<Error | null>(null);
  const conversationId = ref<string | null>(
    import.meta.client ? localStorage.getItem(conversationKey) : null,
  );
  const isStreaming = computed(
    () => status.value === 'submitting' || status.value === 'streaming',
  );

  let controller: AbortController | null = null;

  function genId(): string {
    if (import.meta.client && typeof crypto?.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `m-${messages.value.length}-${Date.now()}`;
  }

  function persist() {
    if (!import.meta.client) return;
    try {
      localStorage.setItem(messagesKey, JSON.stringify(messages.value));
      if (conversationId.value) {
        localStorage.setItem(conversationKey, conversationId.value);
      }
    } catch {
      /* quota / private mode — non-fatal, chat still works in-memory */
    }
  }

  async function submit() {
    const text = input.value.trim();
    if (!text || isStreaming.value) return;
    input.value = '';
    error.value = null;

    messages.value.push({ id: genId(), role: 'user', text });

    // Build the request history BEFORE adding the assistant placeholder, in the
    // UIMessage shape the endpoint expects (parts[], not a content string).
    const payloadMessages = messages.value.map((m) => ({
      id: m.id,
      role: m.role,
      parts: [{ type: 'text', text: m.text }],
    }));

    // Placeholder assistant message; grab the reactive proxy to stream into it.
    messages.value.push({ id: genId(), role: 'assistant', text: '' });
    const assistant = messages.value[messages.value.length - 1]!;

    status.value = 'submitting';
    controller = new AbortController();

    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          ...(conversationId.value ? { conversationId: conversationId.value } : {}),
          messages: payloadMessages,
        }),
        signal: controller.signal,
      });

      const id = response.headers.get('x-conversation-id');
      if (id) conversationId.value = id;

      if (!response.ok || !response.body) {
        throw new Error(`Chat request failed (${response.status})`);
      }

      status.value = 'streaming';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are newline-delimited; keep the trailing partial line.
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          let event: { type?: string; delta?: string; errorText?: string };
          try {
            event = JSON.parse(data);
          } catch {
            continue;
          }
          if (event.type === 'text-delta' && typeof event.delta === 'string') {
            assistant.text += event.delta;
          } else if (event.type === 'error') {
            throw new Error(event.errorText || 'stream error');
          }
        }
      }

      // Defense-in-depth: a turn that streams no text deltas (e.g. the model ended
      // on a tool call, or the function was cut short) would otherwise leave an
      // empty white bubble. Replace it with a recoverable message.
      if (assistant.text.trim() === '') {
        assistant.text =
          'Disculpa, no alcancé a completar esa respuesta. ¿Lo intentamos de nuevo?';
      }

      status.value = 'ready';
      persist();
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') {
        status.value = 'ready';
      } else {
        error.value = e as Error;
        status.value = 'error';
      }
      persist();
    } finally {
      controller = null;
    }
  }

  function stop() {
    controller?.abort();
  }

  function clear() {
    stop();
    messages.value = [];
    conversationId.value = null;
    error.value = null;
    status.value = 'ready';
    if (import.meta.client) {
      localStorage.removeItem(messagesKey);
      localStorage.removeItem(conversationKey);
    }
  }

  return {
    messages,
    input,
    status,
    isStreaming,
    error,
    submit,
    stop,
    clear,
    conversationId,
  };
}
