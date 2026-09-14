/**
 * Lay out an assistant message as chat bubbles of ordered blocks.
 *
 * Two paths, chosen per message:
 * - LEGACY (no `partsOrder === 2`): exactly today's render — one bubble per
 *   `splitBubbles(text)` chunk, and every code-owned part appended to the LAST
 *   bubble in a fixed order (quote table, gama cards, sede cards, actions).
 *   Stored transcripts and servers without the v2 marker land here.
 * - V2: walk the recorded `parts` refs in arrival order. A text block that
 *   started right after another text block opens a new bubble (max 3; beyond
 *   that it folds into the last text block). A data piece stays inside the
 *   current bubble, in its place, rendering the payload it arrived with.
 *
 * Invalid payloads (malformed or corrupt storage) are treated as absent and list
 * entries the template can't render are dropped; malformed refs are skipped.
 * Never throws on persisted data.
 */
import type {
  ChatMessage,
  GamaCardsPart,
  QuoteTablePart,
  SedeCardsPart,
} from '../composables/useChatConversation';
import type { ChatActions } from './extractChatActions';
import { splitBubbles } from './splitBubbles';

export type ChatBubbleBlock =
  | { kind: 'text'; text: string }
  | { kind: 'quoteTable'; data: QuoteTablePart }
  | { kind: 'gamaCards'; data: GamaCardsPart }
  | { kind: 'sedeCards'; data: SedeCardsPart }
  | { kind: 'actions'; data: ChatActions };

export interface ChatBubble {
  // This bubble's text blocks joined with '\n' ('' when it has none).
  text: string;
  blocks: ChatBubbleBlock[];
  // Last block is a data part — the time goes on its own row.
  endsWithPart: boolean;
  hasCards: boolean;
}

export type ChatBubbleSource = Pick<
  ChatMessage,
  'text' | 'actions' | 'quoteTable' | 'gamaCards' | 'sedeCards' | 'partsOrder' | 'parts'
>;

type DataKind = Exclude<ChatBubbleBlock['kind'], 'text'>;
type DataBlock = Exclude<ChatBubbleBlock, { kind: 'text' }>;

// Mirrors the parser's text-block cap (useChatConversation submit()).
const MAX_TEXT_BUBBLES = 3;
const LEGACY_DATA_ORDER: DataKind[] = ['quoteTable', 'gamaCards', 'sedeCards', 'actions'];
const REF_KIND = new Map<unknown, DataKind>([
  ['quoteTable', 'quoteTable'],
  ['gamaCards', 'gamaCards'],
  ['sedeCards', 'sedeCards'],
  ['buttons', 'actions'],
]);

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

// Sede entries need a non-empty string name; code/horario normalize to strings.
// Returns the original object when nothing had to change.
function cleanSedeCards(value: unknown): SedeCardsPart | null {
  if (!isObject(value) || !Array.isArray(value.sedes)) return null;
  const raw: unknown[] = value.sedes;
  const sedes = raw
    .filter((s): s is Record<string, unknown> => isObject(s) && typeof s.nombre === 'string' && s.nombre !== '')
    .map((s) => ({
      code: typeof s.code === 'string' ? s.code : '',
      nombre: s.nombre as string,
      horario: typeof s.horario === 'string' ? s.horario : '',
    }));
  if (!sedes.length) return null;
  const original = value as unknown as SedeCardsPart;
  const unchanged =
    sedes.length === raw.length &&
    sedes.every((s, i) => {
      const o = raw[i] as Record<string, unknown>;
      return o.code === s.code && o.horario === s.horario;
    });
  return unchanged ? original : { ...original, sedes };
}

// Model entries that aren't objects would crash the card template; drop them.
function cleanGamaCards(value: unknown): GamaCardsPart | null {
  if (!isObject(value) || !Array.isArray(value.modelos)) return null;
  const raw: unknown[] = value.modelos;
  const modelos = raw.filter(isObject) as unknown as GamaCardsPart['modelos'];
  const original = value as unknown as GamaCardsPart;
  return modelos.length === raw.length ? original : { ...original, modelos };
}

function dataBlock(kind: DataKind, value: unknown): DataBlock | null {
  switch (kind) {
    case 'quoteTable':
      return isObject(value) && Array.isArray(value.filas)
        ? { kind, data: value as unknown as QuoteTablePart }
        : null;
    case 'gamaCards': {
      const data = cleanGamaCards(value);
      return data ? { kind, data } : null;
    }
    case 'sedeCards': {
      const data = cleanSedeCards(value);
      return data ? { kind, data } : null;
    }
    case 'actions':
      return isObject(value) ? { kind, data: value as ChatActions } : null;
  }
}

function finalize(groups: ChatBubbleBlock[][]): ChatBubble[] {
  return groups.map((blocks) => ({
    text: blocks
      .filter((b): b is Extract<ChatBubbleBlock, { kind: 'text' }> => b.kind === 'text')
      .map((b) => b.text)
      .join('\n'),
    blocks,
    endsWithPart: blocks.length > 0 && blocks[blocks.length - 1]!.kind !== 'text',
    hasCards: blocks.some((b) => b.kind === 'gamaCards'),
  }));
}

// Filled slots go at the end of the last bubble, in the legacy order — unless a
// ref already rendered that same payload in place. A slot a later arrival
// overrode (tool-output actions after data-buttons) still shows, as today.
function appendSlots(m: ChatBubbleSource, groups: ChatBubbleBlock[][], rendered: DataBlock[]) {
  for (const kind of LEGACY_DATA_ORDER) {
    const block = dataBlock(kind, m[kind]);
    if (!block) continue;
    let json: string | undefined;
    const shown = rendered.some((r) => {
      if (r.kind !== kind) return false;
      if (r.data === block.data) return true;
      json ??= JSON.stringify(block.data);
      return JSON.stringify(r.data) === json;
    });
    if (shown) continue;
    if (!groups.length) groups.push([]);
    groups[groups.length - 1]!.push(block);
  }
}

function legacyLayout(m: ChatBubbleSource): ChatBubble[] {
  const groups: ChatBubbleBlock[][] = [];
  for (const chunk of splitBubbles(typeof m.text === 'string' ? m.text : '')) {
    groups.push([{ kind: 'text', text: chunk }]);
  }
  appendSlots(m, groups, []);
  return finalize(groups);
}

export function layoutChatBubbles(m: ChatBubbleSource): ChatBubble[] {
  if (m.partsOrder !== 2 || !Array.isArray(m.parts)) return legacyLayout(m);

  const groups: ChatBubbleBlock[][] = [];
  const rendered: DataBlock[] = [];
  // A break requested by a text block survives blank blocks but not data pieces.
  let pendingBreak = false;
  for (const ref of m.parts as unknown[]) {
    if (!isObject(ref)) continue;
    const { type } = ref;

    if (type === 'text') {
      const { text, newBubble } = ref;
      if (typeof text !== 'string') continue;
      if (newBubble === true) pendingBreak = true;
      const chunks = splitBubbles(text);
      if (!chunks.length) continue;
      const [first, ...rest] = chunks as [string, ...string[]];
      const current = groups[groups.length - 1];
      const lastBlock = current?.[current.length - 1];
      if (pendingBreak && current && groups.length < MAX_TEXT_BUBBLES) {
        groups.push([{ kind: 'text', text: first }]);
      } else if (pendingBreak && current && lastBlock?.kind === 'text') {
        lastBlock.text += `\n\n${first}`;
      } else if (current) {
        current.push({ kind: 'text', text: first });
      } else {
        groups.push([{ kind: 'text', text: first }]);
      }
      pendingBreak = false;
      // A model-written `---` inside the block splits as today (uncapped).
      for (const chunk of rest) groups.push([{ kind: 'text', text: chunk }]);
      continue;
    }

    const kind = REF_KIND.get(type);
    if (!kind) continue;
    pendingBreak = false;
    const block = dataBlock(kind, ref.data);
    if (!block) continue;
    rendered.push(block);
    if (!groups.length) groups.push([]);
    groups[groups.length - 1]!.push(block);
  }

  // Refs that place nothing (corrupted / all invalid) must not hide the text:
  // render the message the legacy way instead.
  if (!groups.length) return legacyLayout(m);

  appendSlots(m, groups, rendered);
  return finalize(groups);
}
