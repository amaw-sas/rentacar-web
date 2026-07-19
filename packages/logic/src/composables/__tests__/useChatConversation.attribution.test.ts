import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The chat must forward the customer's marketing origin so a bot-closed reservation
// keeps its true "Origen" instead of "Desconocido". Source-level check (mirrors
// useRecordReservationForm.attribution.test.ts — mocking Nuxt auto-imports + fetch in
// node isn't worth it); the live payload is asserted separately via agent-browser.

const source = readFileSync(
  fileURLToPath(new URL('../useChatConversation.ts', import.meta.url)),
  'utf8',
);

describe('useChatConversation — attribution in the POST body', () => {
  it('imports readStoredAttribution from the logic utils', () => {
    expect(source).toMatch(/readStoredAttribution,[\s\S]*from '@rentacar-main\/logic\/utils'/);
  });

  it('sends attribution in the request body: stored value, else {} (Directo)', () => {
    expect(source).toContain('attribution: readStoredAttribution() ?? {}');
  });

  it('never sends attribution as null (would be "Desconocido", not "Directo")', () => {
    expect(source).not.toMatch(/attribution:\s*readStoredAttribution\(\)\s*\?\?\s*null/);
  });

  it('places attribution inside the JSON.stringify body alongside brand/messages', () => {
    const bodyIdx = source.indexOf('body: JSON.stringify({');
    const attrIdx = source.indexOf('attribution: readStoredAttribution()');
    expect(bodyIdx).toBeGreaterThan(-1);
    expect(attrIdx).toBeGreaterThan(bodyIdx);
  });
});
