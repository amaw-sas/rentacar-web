import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The chat forwards the visitor's page context so the advisor inbox can show where
// the conversation started and what the visitor browsed (SCEN-001/002). Source-level
// check, same style as the attribution test; buildChatContext itself is covered in
// utils/__tests__/visitorTrail.test.ts.

const source = readFileSync(
  fileURLToPath(new URL('../useChatConversation.ts', import.meta.url)),
  'utf8',
);

describe('useChatConversation — visitor context in the POST body', () => {
  it('imports buildChatContext from the logic utils', () => {
    expect(source).toMatch(/buildChatContext,[\s\S]*from '@rentacar-main\/logic\/utils'/);
  });

  it('sends context: buildChatContext() inside the JSON.stringify body', () => {
    const bodyIdx = source.indexOf('body: JSON.stringify({');
    const ctxIdx = source.indexOf('context: buildChatContext()');
    expect(bodyIdx).toBeGreaterThan(-1);
    expect(ctxIdx).toBeGreaterThan(bodyIdx);
  });

  it('leaves the attribution line untouched', () => {
    expect(source).toContain('attribution: readStoredAttribution() ?? {}');
  });
});
