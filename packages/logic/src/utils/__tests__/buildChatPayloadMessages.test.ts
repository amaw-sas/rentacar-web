import { describe, it, expect } from 'vitest';
import {
  buildChatPayloadMessages,
  CHAT_PAYLOAD_TAIL,
} from '../buildChatPayloadMessages';

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  replyTo?: { context: string };
};

// Alternating user/assistant transcript of `turns` turns (2 messages each).
function transcript(turns: number): Msg[] {
  const out: Msg[] = [];
  for (let i = 0; i < turns; i++) {
    out.push({ id: `u${i}`, role: 'user', text: `pregunta ${i}` });
    out.push({ id: `a${i}`, role: 'assistant', text: `respuesta ${i}` });
  }
  return out;
}

describe('buildChatPayloadMessages', () => {
  it('maps a short transcript verbatim into the UIMessage parts shape', () => {
    const msgs: Msg[] = [
      { id: 'u0', role: 'user', text: 'hola' },
      { id: 'a0', role: 'assistant', text: 'buenas' },
    ];
    expect(buildChatPayloadMessages(msgs)).toEqual([
      { id: 'u0', role: 'user', parts: [{ type: 'text', text: 'hola' }] },
      { id: 'a0', role: 'assistant', parts: [{ type: 'text', text: 'buenas' }] },
    ]);
  });

  it('caps a long transcript at the bounded tail (C10 brick fix)', () => {
    // 50 turns = 100 messages — well past the server's 60-message cap. Full-transcript
    // resends would 400; the tail keeps it bounded so the chat never bricks.
    const msgs = transcript(50);
    const payload = buildChatPayloadMessages(msgs);
    expect(payload).toHaveLength(CHAT_PAYLOAD_TAIL);
    expect(msgs.length).toBeGreaterThan(CHAT_PAYLOAD_TAIL);
  });

  it('always keeps the current (last) user message as the final payload element', () => {
    const msgs = transcript(50);
    msgs.push({ id: 'uNow', role: 'user', text: 'este es el turno actual' });
    const payload = buildChatPayloadMessages(msgs);
    const last = payload[payload.length - 1]!;
    expect(last.id).toBe('uNow');
    expect(last.parts[0]!.text).toBe('este es el turno actual');
  });

  it('prepends the reply-to context so the brain knows the referenced gama/model', () => {
    const msgs: Msg[] = [
      {
        id: 'u0',
        role: 'user',
        text: 'quiero esa',
        replyTo: { context: '[El cliente responde sobre la Gama C, total $500000.]' },
      },
    ];
    const [only] = buildChatPayloadMessages(msgs);
    expect(only!.parts[0]!.text).toBe(
      '[El cliente responde sobre la Gama C, total $500000.]\nquiero esa',
    );
  });

  it('handles a first turn (single message) without slicing anything off', () => {
    const msgs: Msg[] = [{ id: 'u0', role: 'user', text: 'primer mensaje' }];
    expect(buildChatPayloadMessages(msgs)).toHaveLength(1);
  });

  it('respects a custom tail size', () => {
    expect(buildChatPayloadMessages(transcript(10), 4)).toHaveLength(4);
  });
});
