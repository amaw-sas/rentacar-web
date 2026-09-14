import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import {
  createChatConversation,
  type ChatConversationConfig,
  type ChatMessage,
} from '../useChatConversation';
import { layoutChatBubbles, type ChatBubble } from '../../utils/layoutChatBubbles';
import { splitBubbles } from '../../utils/splitBubbles';

// chat-parts-order.scenarios.md at the stream level: the SSE parser records the
// arrival order of text and data pieces, and only a turn carrying
// `data-partsOrder {v:2}` stores it on the message. Without the marker the stored
// message and its layout are byte-identical to today's.
//
// Same stubbed-browser harness as useChatConversation.watchdog.test.ts (fake
// timers + controllable SSE reader), plus captured document/window listeners so
// a mid-stream persist can be triggered like a real tab-hide.

function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}

type ReadResult = { done: boolean; value?: Uint8Array };

// Each fetch call gets its own controllable reader; `push`/`end` target the
// latest one.
function makeStreamedFetch() {
  const encoder = new TextEncoder();
  let queue: ReadResult[] = [];
  let pending: ((r: ReadResult) => void) | null = null;

  const read = (): Promise<ReadResult> =>
    new Promise((resolve) => {
      const next = queue.shift();
      if (next) return resolve(next);
      pending = resolve;
    });

  const fetchImpl = vi.fn(() => {
    queue = [];
    pending = null;
    return Promise.resolve({
      ok: true,
      headers: { get: () => null },
      body: { getReader: () => ({ read }) },
    });
  });

  const deliver = (r: ReadResult) => {
    if (pending) {
      const p = pending;
      pending = null;
      p(r);
    } else {
      queue.push(r);
    }
  };
  const push = (...events: unknown[]) =>
    deliver({
      done: false,
      value: encoder.encode(events.map((e) => `data: ${JSON.stringify(e)}\n`).join('')),
    });
  const end = () => deliver({ done: true });

  return { fetchImpl, push, end };
}

let stream: ReturnType<typeof makeStreamedFetch>;
let store: ReturnType<typeof makeStorage>;
let docListeners: Record<string, () => void>;
let doc: { visibilityState: string; addEventListener: (t: string, fn: () => void) => void; removeEventListener: () => void };

beforeEach(() => {
  vi.useFakeTimers();
  stream = makeStreamedFetch();
  store = makeStorage();
  docListeners = {};
  doc = {
    visibilityState: 'visible',
    addEventListener: (type: string, fn: () => void) => {
      docListeners[type] = fn;
    },
    removeEventListener: () => {},
  };
  vi.stubGlobal('localStorage', store);
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', { addEventListener: () => {} });
  vi.stubGlobal('fetch', stream.fetchImpl);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

let brandSeq = 0;
function cfg(): ChatConversationConfig {
  const brand = `po${brandSeq++}`;
  return {
    brand,
    api: 'http://api.test/api/chat',
    messagesKey: `rentacar-chat:${brand}:messages`,
    conversationKey: `rentacar-chat:${brand}:conversationId`,
    lastReadKey: `rentacar-chat:${brand}:lastReadMessageId`,
  };
}

const MARKER = { type: 'data-partsOrder', data: { v: 2 } };
const text = (s: string) => [
  { type: 'text-start', id: s },
  { type: 'text-delta', id: s, delta: s },
  { type: 'text-end', id: s },
];
const quoteTable = {
  sede: 'Bogotá Aeropuerto',
  dias: 3,
  filas: [
    { categoria: 'C', descripcion: 'Económico Mecánico', precioTotal: 450000, horasExtra: 0, precioHoraExtra: 0 },
    { categoria: 'F', descripcion: 'Sedán Mecánico', precioTotal: 520000, horasExtra: 0, precioHoraExtra: 0 },
  ],
};
const gamaCards = {
  gama: 'F',
  descripcion: 'Sedán mecánico',
  modelos: [
    { nombre: 'Chevrolet Onix', imagen: 'https://img.test/onix.webp' },
    { nombre: 'Kia Soluto', imagen: '' },
  ],
};
const sedes = [
  { code: 'AABOT', nombre: 'Bogotá Aeropuerto', horario: 'Lun-Dom 6am-10pm' },
  { code: 'ABCTR', nombre: 'Bogotá Centro', horario: 'Lun-Sáb 8am-6pm' },
];
const dq = { type: 'data-quoteTable', data: quoteTable };
const dg = { type: 'data-gamaCards', data: gamaCards };

async function runTurn(inst: ReturnType<typeof createChatConversation>, events: unknown[]) {
  inst.input.value = 'hola';
  const turn = inst.submit();
  await vi.advanceTimersByTimeAsync(0);
  stream.push(...events);
  stream.end();
  await vi.advanceTimersByTimeAsync(0);
  await turn;
  return inst.messages.value.at(-1)!;
}

function shape(bubbles: ChatBubble[]): string[][] {
  return bubbles.map((b) => b.blocks.map((blk) => (blk.kind === 'text' ? `text:${blk.text}` : blk.kind)));
}

// Literal reimplementation of TODAY's render (ui-alquilatucarro ChatConversation.vue
// bubblesFor + template): chunks or [''] for part-only messages; quote table, gama
// cards, actions appended on the LAST bubble.
function referenceTodayLayout(m: ChatMessage): ChatBubble[] {
  const chunks = splitBubbles(m.text);
  const list = chunks.length ? chunks : m.actions || m.quoteTable || m.gamaCards ? [''] : [];
  return list.map((chunk, i) => {
    const isLast = i === list.length - 1;
    const blocks: ChatBubble['blocks'] = [];
    if (chunk) blocks.push({ kind: 'text', text: chunk });
    if (isLast) {
      if (m.quoteTable) blocks.push({ kind: 'quoteTable', data: m.quoteTable });
      if (m.gamaCards) blocks.push({ kind: 'gamaCards', data: m.gamaCards });
      if (m.actions) blocks.push({ kind: 'actions', data: m.actions });
    }
    return {
      text: chunk,
      blocks,
      endsWithPart: isLast && !!(m.quoteTable || m.gamaCards || m.actions),
      hasCards: isLast && !!m.gamaCards,
    };
  });
}

function storedLast(c: ChatConversationConfig): Record<string, unknown> {
  return (JSON.parse(store.getItem(c.messagesKey)!) as Array<Record<string, unknown>>).at(-1)!;
}

describe('SCEN-E1 — stream without marker renders like today', () => {
  it('3 text blocks + quoteTable + gamaCards + buttons → no parts keys, 3 bubbles, data at the end of the third', async () => {
    const c = cfg();
    const inst = createChatConversation(c);
    const m = await runTurn(inst, [
      ...text('A'),
      ...text('B'),
      ...text('C'),
      dq,
      dg,
      { type: 'data-buttons', data: { web: 'https://reserva.test/x', whatsapp: 'https://wa.me/57300' } },
    ]);
    expect(m.text).toBe('A\n---\nB\n---\nC');
    expect('parts' in m).toBe(false);
    expect('partsOrder' in m).toBe(false);
    expect(storedLast(c)).not.toHaveProperty('parts');
    expect(storedLast(c)).not.toHaveProperty('partsOrder');
    const bubbles = layoutChatBubbles(m);
    expect(shape(bubbles)).toEqual([
      ['text:A'],
      ['text:B'],
      ['text:C', 'quoteTable', 'gamaCards', 'actions'],
    ]);
    expect(bubbles).toEqual(referenceTodayLayout(m));
  });
});

describe('SCEN-E2 — v2 text → table → text', () => {
  it('stores ordered parts and lays out 1 bubble [text, quoteTable, text]', async () => {
    const inst = createChatConversation(cfg());
    const m = await runTurn(inst, [MARKER, ...text('Te cotizo:'), dq, ...text('¿Cuál te gusta?')]);
    // Payload/preview text is still assembled exactly as today.
    expect(m.text).toBe('Te cotizo:\n---\n¿Cuál te gusta?');
    expect(m.partsOrder).toBe(2);
    expect(m.parts).toEqual([
      { type: 'text', text: 'Te cotizo:', newBubble: false },
      { type: 'quoteTable', data: quoteTable },
      { type: 'text', text: '¿Cuál te gusta?', newBubble: false },
    ]);
    expect(shape(layoutChatBubbles(m))).toEqual([['text:Te cotizo:', 'quoteTable', 'text:¿Cuál te gusta?']]);
  });
});

describe('SCEN-E3 — v2 text → cards → text → buttons → text', () => {
  it('lays out 1 bubble in arrival order', async () => {
    const inst = createChatConversation(cfg());
    const m = await runTurn(inst, [
      MARKER,
      ...text('Modelos:'),
      dg,
      ...text('Reserva aquí:'),
      { type: 'data-buttons', data: { web: 'https://reserva.test/x' } },
      ...text('¿Algo más?'),
    ]);
    expect(m.actions).toEqual({ web: 'https://reserva.test/x', whatsapp: undefined, share: undefined });
    const bubbles = layoutChatBubbles(m);
    expect(shape(bubbles)).toEqual([
      ['text:Modelos:', 'gamaCards', 'text:Reserva aquí:', 'actions', 'text:¿Algo más?'],
    ]);
    expect(bubbles[0]!.hasCards).toBe(true);
  });
});

describe('SCEN-E4 — v2 sede cards render in place', () => {
  it('stores sedeCards and lays out [text, sedeCards, text]', async () => {
    const inst = createChatConversation(cfg());
    const m = await runTurn(inst, [
      MARKER,
      ...text('Sedes en Bogotá:'),
      { type: 'data-sedeCards', data: { sedes } },
      ...text('¿Cuál te queda mejor?'),
    ]);
    expect(m.sedeCards).toEqual({ sedes });
    expect(shape(layoutChatBubbles(m))).toEqual([
      ['text:Sedes en Bogotá:', 'sedeCards', 'text:¿Cuál te queda mejor?'],
    ]);
  });

  it('filters sede entries without a usable nombre and coerces code/horario', async () => {
    const inst = createChatConversation(cfg());
    const m = await runTurn(inst, [
      MARKER,
      ...text('Sedes:'),
      {
        type: 'data-sedeCards',
        data: {
          sedes: [null, 'x', { nombre: '' }, { nombre: 7 }, { nombre: 'Cali Centro', code: 3, horario: null }, sedes[0]],
        },
      },
    ]);
    expect(m.sedeCards).toEqual({
      sedes: [{ code: '', nombre: 'Cali Centro', horario: '' }, sedes[0]],
    });
  });
});

describe('SCEN-E5 — consecutive text blocks split bubbles with and without marker', () => {
  const events = [
    { type: 'text-start', id: '1' },
    { type: 'text-delta', id: '1', delta: 'Hola' },
    { type: 'text-start', id: '2' },
    { type: 'text-delta', id: '2', delta: '¿Ciudad?' },
  ];

  it('without marker → 2 bubbles', async () => {
    const m = await runTurn(createChatConversation(cfg()), events);
    expect(shape(layoutChatBubbles(m))).toEqual([['text:Hola'], ['text:¿Ciudad?']]);
  });

  it('with v2 → 2 bubbles', async () => {
    const m = await runTurn(createChatConversation(cfg()), [MARKER, ...events]);
    expect(m.parts).toEqual([
      { type: 'text', text: 'Hola', newBubble: false },
      { type: 'text', text: '¿Ciudad?', newBubble: true },
    ]);
    expect(shape(layoutChatBubbles(m))).toEqual([['text:Hola'], ['text:¿Ciudad?']]);
  });

  it('a delta before the first text-start is the same block, as in legacy ("HolaMundo")', async () => {
    const events = [
      { type: 'text-delta', id: '1', delta: 'Hola' },
      { type: 'text-start', id: '1' },
      { type: 'text-delta', id: '1', delta: 'Mundo' },
    ];
    const legacy = await runTurn(createChatConversation(cfg()), events);
    const v2 = await runTurn(createChatConversation(cfg()), [MARKER, ...events]);
    expect(legacy.text).toBe('HolaMundo');
    expect(v2.text).toBe('HolaMundo');
    expect(shape(layoutChatBubbles(v2))).toEqual([['text:HolaMundo']]);
    expect(layoutChatBubbles(v2)).toEqual(layoutChatBubbles(legacy));
  });
});

describe('SCEN-E8 — empty sede cards and unknown data pieces render nothing', () => {
  // Owner decision on "no extra bubble is opened by the ignored pieces": a KNOWN data
  // piece between two texts takes the place of its (rejected) payload, so it still
  // suppresses the text→text break; an UNKNOWN data-* is as if it never arrived.
  it('rejected known pieces render nothing and keep the texts in one bubble', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    const m = await runTurn(createChatConversation(cfg()), [
      MARKER,
      ...text('Antes.'),
      { type: 'data-sedeCards', data: {} },
      { type: 'data-sedeCards', data: { sedes: [] } },
      { type: 'data-sedeCards', data: { sedes: [{ nombre: '' }] } },
      { type: 'data-sedeCards' },
      { type: 'data-somethingUnknown', data: { x: 1 } },
      ...text('Después.'),
    ]);

    expect(m.sedeCards).toBeUndefined();
    expect(m.parts?.every((p) => p.type === 'text')).toBe(true);
    const bubbles = layoutChatBubbles(m);
    expect(shape(bubbles)).toEqual([['text:Antes.', 'text:Después.']]);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('a rejected quoteTable or buttons piece also suppresses the break', async () => {
    const m = await runTurn(createChatConversation(cfg()), [
      MARKER,
      ...text('A'),
      { type: 'data-quoteTable', data: { sede: 'x', dias: 1 } },
      ...text('B'),
      { type: 'data-buttons', data: { web: '' } },
      ...text('C'),
      { type: 'data-gamaCards', data: { gama: 'F' } },
      ...text('D'),
    ]);
    expect(m.quoteTable).toBeUndefined();
    expect(m.actions).toBeUndefined();
    expect(m.gamaCards).toBeUndefined();
    expect(shape(layoutChatBubbles(m))).toEqual([['text:A', 'text:B', 'text:C', 'text:D']]);
  });

  it('an unknown data piece alone is as if it never arrived: the texts still split', async () => {
    const withUnknown = await runTurn(createChatConversation(cfg()), [
      MARKER,
      ...text('A'),
      { type: 'data-somethingUnknown', data: { x: 1 } },
      ...text('B'),
    ]);
    const without = await runTurn(createChatConversation(cfg()), [MARKER, ...text('A'), ...text('B')]);
    expect(withUnknown.parts).toEqual(without.parts);
    expect(shape(layoutChatBubbles(withUnknown))).toEqual([['text:A'], ['text:B']]);
    expect(layoutChatBubbles(withUnknown)).toEqual(layoutChatBubbles(without));
  });

  it('a tool-output between texts does not suppress the break', async () => {
    const m = await runTurn(createChatConversation(cfg()), [
      MARKER,
      ...text('A'),
      { type: 'tool-output-available', output: { completar_en_web: 'https://reserva.test/y' } },
      ...text('B'),
    ]);
    // No ref for tool output: its actions land at the end of the last bubble.
    expect(shape(layoutChatBubbles(m))).toEqual([['text:A'], ['text:B', 'actions']]);
  });

  it('a partsOrder marker with another version is ignored', async () => {
    const m = await runTurn(createChatConversation(cfg()), [
      { type: 'data-partsOrder', data: { v: 3 } },
      ...text('A'),
    ]);
    expect('parts' in m).toBe(false);
    expect('partsOrder' in m).toBe(false);
  });
});

describe('SCEN-E10 — production\'s interleaved flow without marker renders like today', () => {
  it('text→table→text→text and buttons→text match today\'s layout and store no parts', async () => {
    const c = cfg();
    const inst = createChatConversation(c);
    const first = await runTurn(inst, [
      ...text('Ida y vuelta.'),
      dq,
      ...text('La más elegida es la C.'),
      ...text('¿Cuál reservamos?'),
    ]);
    expect(shape(layoutChatBubbles(first))).toEqual([
      ['text:Ida y vuelta.'],
      ['text:La más elegida es la C.'],
      ['text:¿Cuál reservamos?', 'quoteTable'],
    ]);
    expect(layoutChatBubbles(first)).toEqual(referenceTodayLayout(first));

    const second = await runTurn(inst, [
      { type: 'data-buttons', data: { web: 'https://reserva.test/x' } },
      ...text('Te dejo el enlace para reservar tú mismo abajo.'),
    ]);
    expect(shape(layoutChatBubbles(second))).toEqual([
      ['text:Te dejo el enlace para reservar tú mismo abajo.', 'actions'],
    ]);
    expect(layoutChatBubbles(second)).toEqual(referenceTodayLayout(second));

    expect(store.getItem(c.messagesKey)).not.toContain('"parts"');
    expect(store.getItem(c.messagesKey)).not.toContain('"partsOrder"');
  });
});

describe('SCEN-E6 — transcripts saved before the change still load identically', () => {
  it('restores today\'s stored shape unchanged and lays it out like today', () => {
    const errorSpy = vi.spyOn(console, 'error');
    const warnSpy = vi.spyOn(console, 'warn');
    const c = cfg();
    const now = Date.now();
    const seed: ChatMessage[] = [
      { id: 'u1', role: 'user', text: 'cotízame', createdAt: now },
      {
        id: 'a1',
        role: 'assistant',
        text: 'A\n---\nB',
        quoteTable,
        gamaCards,
        actions: { web: 'https://reserva.test/x', whatsapp: undefined, share: undefined },
        createdAt: now,
      },
    ];
    store.setItem(c.messagesKey, JSON.stringify(seed));

    const inst = createChatConversation(c);
    expect(inst.messages.value).toEqual(JSON.parse(JSON.stringify(seed)));
    const restored = inst.messages.value.at(-1)!;
    const bubbles = layoutChatBubbles(restored);
    expect(shape(bubbles)).toEqual([['text:A'], ['text:B', 'quoteTable', 'gamaCards', 'actions']]);
    expect(bubbles).toEqual(referenceTodayLayout(restored));
    expect(inst.danglingUserTurn.value).toBe(false);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('SCEN-E7 — v2 order survives reload', () => {
  it('a new instance over the same storage lays out the same single ordered bubble', async () => {
    const c = cfg();
    const first = createChatConversation(c);
    const live = await runTurn(first, [MARKER, ...text('Te cotizo:'), dq, ...text('¿Cuál te gusta?')]);
    const liveLayout = layoutChatBubbles(live);

    const reloaded = createChatConversation(c);
    const restored = reloaded.messages.value.at(-1)!;
    expect(restored.partsOrder).toBe(2);
    expect(shape(layoutChatBubbles(restored))).toEqual([
      ['text:Te cotizo:', 'quoteTable', 'text:¿Cuál te gusta?'],
    ]);
    expect(layoutChatBubbles(restored)).toEqual(liveLayout);
  });
});

describe('repeated data types in one v2 turn', () => {
  const gamaC = { gama: 'C', modelos: [{ nombre: 'Kia Picanto', imagen: '' }] };
  const gamaF = { gama: 'F', modelos: [{ nombre: 'Chevrolet Onix', imagen: '' }] };

  it('two gamaCards render each under its own text, live and after reload', async () => {
    const c = cfg();
    const m = await runTurn(createChatConversation(c), [
      MARKER,
      ...text('Gama C:'),
      { type: 'data-gamaCards', data: gamaC },
      ...text('Y la Gama F:'),
      { type: 'data-gamaCards', data: gamaF },
    ]);
    // The single slot keeps last-wins, as today.
    expect(m.gamaCards).toEqual(gamaF);
    const restored = createChatConversation(c).messages.value.at(-1)!;
    for (const msg of [m, restored]) {
      const bubbles = layoutChatBubbles(msg);
      expect(shape(bubbles)).toEqual([['text:Gama C:', 'gamaCards', 'text:Y la Gama F:', 'gamaCards']]);
      const gamas = bubbles[0]!.blocks
        .filter((b) => b.kind === 'gamaCards')
        .map((b) => (b as { data: { gama: string } }).data.gama);
      expect(gamas).toEqual(['C', 'F']);
    }
  });

  it('a re-quote shows both tables in place', async () => {
    const second = { ...quoteTable, dias: 5 };
    const m = await runTurn(createChatConversation(cfg()), [
      MARKER,
      ...text('Por 3 días:'),
      dq,
      ...text('Por 5 días:'),
      { type: 'data-quoteTable', data: second },
    ]);
    expect(m.quoteTable).toEqual(second);
    const bubbles = layoutChatBubbles(m);
    expect(shape(bubbles)).toEqual([['text:Por 3 días:', 'quoteTable', 'text:Por 5 días:', 'quoteTable']]);
    expect(
      bubbles[0]!.blocks.filter((b) => b.kind === 'quoteTable').map((b) => (b as { data: { dias: number } }).data.dias),
    ).toEqual([3, 5]);
  });

  // Owner decision: one visible button group, last wins — as the legacy render does.
  it('tool-output actions replacing a data-buttons payload show as ONE group at the end', async () => {
    const m = await runTurn(createChatConversation(cfg()), [
      MARKER,
      ...text('Reserva:'),
      { type: 'data-buttons', data: { web: 'https://reserva.test/x' } },
      ...text('Listo.'),
      {
        type: 'tool-output-available',
        output: { completar_en_web: 'https://reserva.test/y', whatsapp_asesor: 'https://wa.me/57300' },
      },
    ]);
    expect(m.actions).toEqual({ web: 'https://reserva.test/y', whatsapp: 'https://wa.me/57300' });
    const bubbles = layoutChatBubbles(m);
    expect(shape(bubbles)).toEqual([['text:Reserva:', 'text:Listo.', 'actions']]);
    expect(bubbles.flatMap((b) => b.blocks).filter((blk) => blk.kind === 'actions')).toHaveLength(1);
    expect((bubbles[0]!.blocks.at(-1) as { data: unknown }).data).toEqual(m.actions);
  });
});

describe('quote table rows that are not objects never reach analytics or the template', () => {
  const row = quoteTable.filas[0];

  it('the parser drops invalid rows before storing the table', async () => {
    const m = await runTurn(createChatConversation(cfg()), [
      MARKER,
      ...text('Te cotizo:'),
      { type: 'data-quoteTable', data: { ...quoteTable, filas: [null, row, 1] } },
    ]);
    expect(m.quoteTable).toEqual({ ...quoteTable, filas: [row] });
    expect(m.parts?.find((p) => p.type === 'quoteTable')).toEqual({
      type: 'quoteTable',
      data: { ...quoteTable, filas: [row] },
    });
    expect(shape(layoutChatBubbles(m))).toEqual([['text:Te cotizo:', 'quoteTable']]);
  });

  it('a table whose rows are all invalid is rejected (and still holds the texts together)', async () => {
    const m = await runTurn(createChatConversation(cfg()), [
      MARKER,
      ...text('A'),
      { type: 'data-quoteTable', data: { ...quoteTable, filas: [null] } },
      ...text('B'),
    ]);
    expect(m.quoteTable).toBeUndefined();
    expect(m.parts?.some((p) => p.type === 'quoteTable')).toBe(false);
    expect(shape(layoutChatBubbles(m))).toEqual([['text:A', 'text:B']]);
  });

  it('a stored transcript with corrupt rows restores and lays out without throwing', () => {
    const c = cfg();
    const now = Date.now();
    store.setItem(
      c.messagesKey,
      JSON.stringify([
        { id: 'u1', role: 'user', text: 'cotízame', createdAt: now },
        { id: 'a1', role: 'assistant', text: 'A', quoteTable: { ...quoteTable, filas: [null, row] }, createdAt: now },
        { id: 'a2', role: 'assistant', text: 'B', quoteTable: { ...quoteTable, filas: [null] }, createdAt: now },
      ]),
    );
    const inst = createChatConversation(c);
    const [, a1, a2] = inst.messages.value;
    const withRow = layoutChatBubbles(a1!);
    expect(shape(withRow)).toEqual([['text:A', 'quoteTable']]);
    expect((withRow[0]!.blocks[1] as { data: { filas: unknown[] } }).data.filas).toEqual([row]);
    expect(shape(layoutChatBubbles(a2!))).toEqual([['text:B']]);
  });
});

describe('mid-stream persist keeps parts reactive', () => {
  it('a tab-hide flush before more pieces arrive does not freeze the stored parts', async () => {
    const c = cfg();
    const inst = createChatConversation(c);
    inst.input.value = 'hola';
    const turn = inst.submit();
    await vi.advanceTimersByTimeAsync(0);

    stream.push(MARKER, { type: 'text-start', id: '1' }, { type: 'text-delta', id: '1', delta: 'Te' });
    await vi.advanceTimersByTimeAsync(0);

    // Tab goes hidden mid-stream → persist() flushes the partial reply.
    doc.visibilityState = 'hidden';
    docListeners.visibilitychange!();
    expect(storedLast(c).parts).toEqual([{ type: 'text', text: 'Te', newBubble: false }]);

    // A reactive consumer that only reads `parts` (what the v2 layout reads).
    const partsView = computed(() => JSON.stringify(inst.messages.value.at(-1)!.parts));
    expect(partsView.value).toBe(JSON.stringify([{ type: 'text', text: 'Te', newBubble: false }]));

    stream.push({ type: 'text-delta', id: '1', delta: ' cotizo:' }, dq, ...text('¿Cuál?'));
    stream.end();
    await vi.advanceTimersByTimeAsync(0);
    await turn;

    const m = inst.messages.value.at(-1)!;
    const expected = [
      { type: 'text', text: 'Te cotizo:', newBubble: false },
      { type: 'quoteTable', data: quoteTable },
      { type: 'text', text: '¿Cuál?', newBubble: false },
    ];
    expect(m.parts).toEqual(expected);
    expect(partsView.value).toBe(JSON.stringify(expected));
    expect(shape(layoutChatBubbles(m))).toEqual([['text:Te cotizo:', 'quoteTable', 'text:¿Cuál?']]);
  });
});

describe('empty v2 turn falls back to the rescue text', () => {
  it('blank-only text deletes parts so the rescue text renders', async () => {
    const c = cfg();
    const m = await runTurn(createChatConversation(c), [
      MARKER,
      { type: 'text-start', id: '1' },
      { type: 'text-delta', id: '1', delta: '   ' },
    ]);
    expect(m.text).toBe('Disculpa, no alcancé a completar esa respuesta. ¿Lo intentamos de nuevo?');
    expect('parts' in m).toBe(false);
    expect('partsOrder' in m).toBe(false);
    expect(storedLast(c)).not.toHaveProperty('parts');
    expect(shape(layoutChatBubbles(m))).toEqual([
      ['text:Disculpa, no alcancé a completar esa respuesta. ¿Lo intentamos de nuevo?'],
    ]);
  });

  it('a sede-only v2 turn is real content: no rescue text, not dangling', async () => {
    const inst = createChatConversation(cfg());
    const m = await runTurn(inst, [MARKER, { type: 'data-sedeCards', data: { sedes } }]);
    expect(m.text).toBe('');
    expect(m.partsOrder).toBe(2);
    expect(shape(layoutChatBubbles(m))).toEqual([['sedeCards']]);
    expect(inst.danglingUserTurn.value).toBe(false);
  });
});
