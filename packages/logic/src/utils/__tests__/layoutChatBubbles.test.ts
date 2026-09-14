import { describe, expect, it } from 'vitest';
import { layoutChatBubbles, type ChatBubble, type ChatBubbleSource } from '../layoutChatBubbles';
import { splitBubbles } from '../splitBubbles';
import type {
  ChatPartRef,
  GamaCardsPart,
  QuoteTablePart,
  SedeCardsPart,
} from '../../composables/useChatConversation';

// chat-parts-order.scenarios.md — pure layout of an assistant message into
// bubbles of ordered blocks. Messages WITHOUT the v2 marker must lay out exactly
// like today's ChatConversation.vue (bubblesFor + template order); v2 messages
// follow the recorded arrival order, each data ref rendering its own payload.

const quoteTable: QuoteTablePart = {
  sede: 'Bogotá Aeropuerto',
  dias: 3,
  filas: [
    { categoria: 'C', descripcion: 'Económico Mecánico', precioTotal: 450000, horasExtra: 0, precioHoraExtra: 0 },
    { categoria: 'F', descripcion: 'Sedán Mecánico', precioTotal: 520000, horasExtra: 0, precioHoraExtra: 0 },
  ],
};
const gamaCards: GamaCardsPart = {
  gama: 'F',
  descripcion: 'Sedán mecánico',
  modelos: [
    { nombre: 'Chevrolet Onix', imagen: 'https://img.test/onix.webp' },
    { nombre: 'Kia Soluto', imagen: '' },
  ],
};
const sedeCards: SedeCardsPart = {
  sedes: [
    { code: 'AABOT', nombre: 'Bogotá Aeropuerto', horario: 'Lun-Dom 6am-10pm' },
    { code: 'ABCTR', nombre: 'Bogotá Centro', horario: 'Lun-Sáb 8am-6pm' },
  ],
};
const actions = { web: 'https://reserva.test/x', whatsapp: 'https://wa.me/573000000000' };
const webOnly = { web: 'https://reserva.test/x' };

const t = (text: string, newBubble = false): ChatPartRef => ({ type: 'text', text, newBubble });
const d = (type: 'quoteTable' | 'gamaCards' | 'buttons' | 'sedeCards', data: unknown): ChatPartRef =>
  ({ type, data }) as ChatPartRef;

// Block kinds per bubble, text blocks shown by their content.
function shape(bubbles: ChatBubble[]): string[][] {
  return bubbles.map((b) => b.blocks.map((blk) => (blk.kind === 'text' ? `text:${blk.text}` : blk.kind)));
}

// Literal reimplementation of TODAY's render (ui-alquilatucarro ChatConversation.vue):
// bubblesFor() → chunks or [''] when only code-owned parts exist; each chunk renders
// its text when non-empty; the LAST bubble appends quote table, gama cards, actions
// (in that order); has-parts = last bubble && any part.
function referenceTodayLayout(m: ChatBubbleSource): ChatBubble[] {
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

describe('SCEN-E1 — today\'s format without marker renders like today', () => {
  it('3 text blocks + quoteTable + gamaCards + buttons → 3 bubbles, data at the end of the third', () => {
    const m: ChatBubbleSource = { text: 'A\n---\nB\n---\nC', quoteTable, gamaCards, actions };
    const bubbles = layoutChatBubbles(m);
    expect(shape(bubbles)).toEqual([
      ['text:A'],
      ['text:B'],
      ['text:C', 'quoteTable', 'gamaCards', 'actions'],
    ]);
    expect(bubbles.map((b) => b.text)).toEqual(['A', 'B', 'C']);
    expect(bubbles.map((b) => b.endsWithPart)).toEqual([false, false, true]);
    expect(bubbles.map((b) => b.hasCards)).toEqual([false, false, true]);
    expect(bubbles).toEqual(referenceTodayLayout(m));
  });

  it('parts present but partsOrder missing → still the legacy layout', () => {
    const m = { text: 'A\n---\nB', quoteTable, parts: [t('A'), d('quoteTable', quoteTable), t('B', false)] };
    expect(layoutChatBubbles(m)).toEqual(referenceTodayLayout(m));
  });
});

describe('SCEN-E2 — v2 text → table → text is one bubble in order', () => {
  it('lays out 1 bubble [text, quoteTable, text]', () => {
    const bubbles = layoutChatBubbles({
      text: 'Te cotizo:\n---\n¿Cuál te gusta?',
      quoteTable,
      partsOrder: 2,
      parts: [t('Te cotizo:'), d('quoteTable', quoteTable), t('¿Cuál te gusta?')],
    });
    expect(shape(bubbles)).toEqual([['text:Te cotizo:', 'quoteTable', 'text:¿Cuál te gusta?']]);
    expect(bubbles[0]!.text).toBe('Te cotizo:\n¿Cuál te gusta?');
    expect(bubbles[0]!.endsWithPart).toBe(false);
    expect(bubbles[0]!.hasCards).toBe(false);
    expect((bubbles[0]!.blocks[1] as { data: unknown }).data).toBe(quoteTable);
  });
});

describe('SCEN-E3 — v2 text → cards → text → buttons → text is one bubble in order', () => {
  it('lays out 1 bubble [text, gamaCards, text, actions, text]', () => {
    const bubbles = layoutChatBubbles({
      text: 'Modelos:\n---\nReserva aquí:\n---\n¿Algo más?',
      gamaCards,
      actions: webOnly,
      partsOrder: 2,
      parts: [t('Modelos:'), d('gamaCards', gamaCards), t('Reserva aquí:'), d('buttons', webOnly), t('¿Algo más?')],
    });
    expect(shape(bubbles)).toEqual([
      ['text:Modelos:', 'gamaCards', 'text:Reserva aquí:', 'actions', 'text:¿Algo más?'],
    ]);
    expect(bubbles[0]!.hasCards).toBe(true);
    expect(bubbles[0]!.endsWithPart).toBe(false);
  });

  it('a bubble ending in data reports endsWithPart', () => {
    const bubbles = layoutChatBubbles({
      text: 'Modelos:',
      gamaCards,
      partsOrder: 2,
      parts: [t('Modelos:'), d('gamaCards', gamaCards)],
    });
    expect(shape(bubbles)).toEqual([['text:Modelos:', 'gamaCards']]);
    expect(bubbles[0]!.endsWithPart).toBe(true);
  });
});

describe('SCEN-E4 — v2 sede cards render in place', () => {
  it('lays out 1 bubble [text, sedeCards, text] carrying both sedes', () => {
    const bubbles = layoutChatBubbles({
      text: 'Sedes en Bogotá:\n---\n¿Cuál te queda mejor?',
      sedeCards,
      partsOrder: 2,
      parts: [t('Sedes en Bogotá:'), d('sedeCards', sedeCards), t('¿Cuál te queda mejor?')],
    });
    expect(shape(bubbles)).toEqual([['text:Sedes en Bogotá:', 'sedeCards', 'text:¿Cuál te queda mejor?']]);
    const block = bubbles[0]!.blocks[1] as { kind: 'sedeCards'; data: SedeCardsPart };
    expect(block.data.sedes.map((s) => s.nombre)).toEqual(['Bogotá Aeropuerto', 'Bogotá Centro']);
  });

  it('legacy message with sedeCards appends it after gama cards and before actions', () => {
    const bubbles = layoutChatBubbles({ text: 'Hola', quoteTable, gamaCards, sedeCards, actions });
    expect(shape(bubbles)).toEqual([['text:Hola', 'quoteTable', 'gamaCards', 'sedeCards', 'actions']]);
  });
});

describe('SCEN-E5 — consecutive text blocks still split bubbles', () => {
  it('without marker: "Hola\\n---\\n¿Ciudad?" → 2 bubbles', () => {
    expect(shape(layoutChatBubbles({ text: 'Hola\n---\n¿Ciudad?' }))).toEqual([
      ['text:Hola'],
      ['text:¿Ciudad?'],
    ]);
  });

  it('with v2: text ref then newBubble text ref → 2 bubbles', () => {
    expect(
      shape(
        layoutChatBubbles({
          text: 'Hola\n---\n¿Ciudad?',
          partsOrder: 2,
          parts: [t('Hola'), t('¿Ciudad?', true)],
        }),
      ),
    ).toEqual([['text:Hola'], ['text:¿Ciudad?']]);
  });
});

describe('SCEN-E8 — empty sede cards and unknown pieces render nothing', () => {
  it('v2: a sedeCards ref whose payload is empty or missing adds no block and no bubble', () => {
    for (const slot of [undefined, { sedes: [] }, {} as SedeCardsPart]) {
      const bubbles = layoutChatBubbles({
        text: 'A',
        sedeCards: slot as SedeCardsPart | undefined,
        partsOrder: 2,
        parts: [t('A'), d('sedeCards', slot)],
      });
      expect(shape(bubbles)).toEqual([['text:A']]);
      expect(bubbles[0]!.endsWithPart).toBe(false);
    }
  });

  it('legacy: an empty sedeCards slot is treated as absent', () => {
    expect(shape(layoutChatBubbles({ text: 'A', sedeCards: { sedes: [] } }))).toEqual([['text:A']]);
    // Nothing but an empty slot → no bubble at all.
    expect(layoutChatBubbles({ text: '', sedeCards: { sedes: [] } })).toEqual([]);
  });

  it('invalid quoteTable / gamaCards slots are treated as absent', () => {
    const m = {
      text: '',
      quoteTable: { sede: 'x', dias: 1 } as unknown as QuoteTablePart,
      gamaCards: { gama: 'F' } as unknown as GamaCardsPart,
    };
    expect(layoutChatBubbles(m)).toEqual([]);
    expect(
      layoutChatBubbles({
        ...m,
        partsOrder: 2,
        parts: [d('quoteTable', m.quoteTable), d('gamaCards', m.gamaCards)],
      }),
    ).toEqual([]);
  });
});

describe('corrupt stored entries never reach the template', () => {
  const corruptSedes = { sedes: [null] } as unknown as SedeCardsPart;

  it('legacy: sedes [null] → no sedeCards block, no throw', () => {
    expect(shape(layoutChatBubbles({ text: 'A', sedeCards: corruptSedes }))).toEqual([['text:A']]);
    expect(layoutChatBubbles({ text: '', sedeCards: corruptSedes })).toEqual([]);
  });

  it('v2: sedes [null] in the ref and the slot → no sedeCards block, no throw', () => {
    const bubbles = layoutChatBubbles({
      text: 'A\n---\nB',
      sedeCards: corruptSedes,
      partsOrder: 2,
      parts: [t('A'), d('sedeCards', corruptSedes), t('B')],
    });
    expect(shape(bubbles)).toEqual([['text:A', 'text:B']]);
  });

  it('keeps only sede entries with a non-empty string nombre and normalizes code/horario', () => {
    const mixed = {
      sedes: [null, 'x', { nombre: '' }, { nombre: 7 }, { nombre: 'Cali Centro', code: 3, horario: null }],
    } as unknown as SedeCardsPart;
    for (const m of [
      { text: 'A', sedeCards: mixed },
      { text: 'A', sedeCards: mixed, partsOrder: 2 as const, parts: [t('A'), d('sedeCards', mixed)] },
    ]) {
      const block = layoutChatBubbles(m)[0]!.blocks[1] as { kind: string; data: SedeCardsPart };
      expect(block.kind).toBe('sedeCards');
      expect(block.data.sedes).toEqual([{ code: '', nombre: 'Cali Centro', horario: '' }]);
    }
  });

  it('drops gama model entries that are not objects (legacy and v2)', () => {
    const corruptCards = {
      gama: 'F',
      modelos: [null, 'x', { nombre: 'Chevrolet Onix', imagen: '' }],
    } as unknown as GamaCardsPart;
    for (const m of [
      { text: 'A', gamaCards: corruptCards },
      { text: 'A', gamaCards: corruptCards, partsOrder: 2 as const, parts: [t('A'), d('gamaCards', corruptCards)] },
    ]) {
      const block = layoutChatBubbles(m)[0]!.blocks[1] as { kind: string; data: GamaCardsPart };
      expect(block.kind).toBe('gamaCards');
      expect(block.data.modelos).toEqual([{ nombre: 'Chevrolet Onix', imagen: '' }]);
    }
  });
});

describe('SCEN-E10 — production\'s interleaved flow without marker renders like today', () => {
  it('text→table→text→text (flattened) → 3 bubbles, table at the end of the third', () => {
    const m = { text: 'Ida y vuelta.\n---\nLa más elegida es la C.\n---\n¿Cuál reservamos?', quoteTable };
    const bubbles = layoutChatBubbles(m);
    expect(shape(bubbles)).toEqual([
      ['text:Ida y vuelta.'],
      ['text:La más elegida es la C.'],
      ['text:¿Cuál reservamos?', 'quoteTable'],
    ]);
    expect(bubbles).toEqual(referenceTodayLayout(m));
  });

  it('buttons→text (flattened) → 1 bubble, button below the text', () => {
    const m = { text: 'Te dejo el enlace para reservar tú mismo abajo.', actions: webOnly };
    const bubbles = layoutChatBubbles(m);
    expect(shape(bubbles)).toEqual([['text:Te dejo el enlace para reservar tú mismo abajo.', 'actions']]);
    expect(bubbles).toEqual(referenceTodayLayout(m));
  });
});

describe('legacy equivalence — layoutChatBubbles === today\'s render', () => {
  const fixtures: Array<[string, ChatBubbleSource]> = [
    ['text with --- separators', { text: 'uno\n---\ndos\n---\ntres' }],
    ['empty text + only actions', { text: '', actions }],
    ['empty text + only gamaCards', { text: '', gamaCards }],
    ['empty text + quoteTable + actions', { text: '', quoteTable, actions }],
    ['block-4 fold with \\n\\n', { text: 'A\n---\nB\n---\nC\n\nD', quoteTable }],
    ['whitespace-only text', { text: '   \n ' }],
    ['whitespace-only text + actions', { text: '  ', actions }],
    ['no slots, plain text', { text: 'Hola, ¿en qué te ayudo?' }],
    ['no slots, empty text', { text: '' }],
    ['trailing separator', { text: 'a\n---\n', gamaCards }],
    ['all three slots, single text', { text: 'Listo', quoteTable, gamaCards, actions }],
  ];
  it.each(fixtures)('%s', (_name, m) => {
    expect(layoutChatBubbles(m)).toEqual(referenceTodayLayout(m));
  });
});

describe('v2 edge cases', () => {
  it('malformed parts never throw; a data ref without payload is skipped', () => {
    const bad: unknown[] = [
      null,
      42,
      'text',
      { type: 'nope' },
      { type: 'text' },
      { type: 'text', text: 7, newBubble: true },
      { type: 'text', text: 'ok' },
      { type: 'quoteTable' },
    ];
    const bubbles = layoutChatBubbles({
      text: 'ok',
      quoteTable,
      partsOrder: 2,
      parts: bad as ChatPartRef[],
    });
    // The payload-less ref renders nothing; the filled slot lands at the end.
    expect(shape(bubbles)).toEqual([['text:ok', 'quoteTable']]);
  });

  it('a v2 walk that yields no bubbles falls back to the legacy layout', () => {
    const m = {
      text: 'Hola',
      quoteTable,
      partsOrder: 2 as const,
      parts: [null, { type: 'nope' }] as unknown as ChatPartRef[],
    };
    const bubbles = layoutChatBubbles(m);
    expect(shape(bubbles)).toEqual([['text:Hola', 'quoteTable']]);
    expect(bubbles).toEqual(referenceTodayLayout(m));
  });

  it('partsOrder 2 with a non-array parts falls back to legacy', () => {
    const m = { text: 'A\n---\nB', quoteTable, partsOrder: 2 as const, parts: { 0: 'x' } as unknown as ChatPartRef[] };
    expect(layoutChatBubbles(m)).toEqual(referenceTodayLayout(m));
  });

  it('a blank text ref keeps its pending break for the next non-blank text', () => {
    const bubbles = layoutChatBubbles({
      text: 'A\n---\n  \n---\nB',
      partsOrder: 2,
      parts: [t('A'), t('  ', true), t('B', true)],
    });
    expect(shape(bubbles)).toEqual([['text:A'], ['text:B']]);
  });

  it('a leading blank text with newBubble does not create an empty bubble', () => {
    const bubbles = layoutChatBubbles({
      text: 'A',
      partsOrder: 2,
      parts: [t(''), t('A', true)],
    });
    expect(shape(bubbles)).toEqual([['text:A']]);
  });

  it('a data piece cancels the pending break of a preceding blank text', () => {
    const bubbles = layoutChatBubbles({
      text: 'A\n---\n\n---\nB',
      quoteTable,
      partsOrder: 2,
      parts: [t('A'), t('', true), d('quoteTable', quoteTable), t('B')],
    });
    expect(shape(bubbles)).toEqual([['text:A', 'quoteTable', 'text:B']]);
  });

  it('caps text-block bubbles at 3; the 4th and 5th fold into the last text block', () => {
    const bubbles = layoutChatBubbles({
      text: 'A\n---\nB\n---\nC\n\nD\n\nE',
      partsOrder: 2,
      parts: [t('A'), t('B', true), t('C', true), t('D', true), t('E', true)],
    });
    expect(shape(bubbles)).toEqual([['text:A'], ['text:B'], ['text:C\n\nD\n\nE']]);
    // Same result as today's flattened text for the same stream.
    expect(bubbles).toEqual(referenceTodayLayout({ text: 'A\n---\nB\n---\nC\n\nD\n\nE' }));
  });

  it('over the cap, a break after a data block appends a new text block instead of folding', () => {
    const bubbles = layoutChatBubbles({
      text: 'A\n---\nB\n---\nC\n\nD',
      quoteTable,
      partsOrder: 2,
      parts: [t('A'), t('B', true), t('C', true), d('quoteTable', quoteTable), t('D', true)],
    });
    expect(shape(bubbles)).toEqual([['text:A'], ['text:B'], ['text:C', 'quoteTable', 'text:D']]);
  });

  it('model-written --- inside one text ref opens bubbles uncapped (as today)', () => {
    const bubbles = layoutChatBubbles({
      text: 'A\n---\nB\n---\nC\n---\nD',
      partsOrder: 2,
      parts: [t('A\n---\nB\n---\nC\n---\nD')],
    });
    expect(shape(bubbles)).toEqual([['text:A'], ['text:B'], ['text:C'], ['text:D']]);
  });

  it('a repeated gamaCards type renders each payload in its own place', () => {
    const gamaC: GamaCardsPart = { gama: 'C', modelos: [{ nombre: 'Kia Picanto', imagen: '' }] };
    const gamaF: GamaCardsPart = { gama: 'F', modelos: [{ nombre: 'Chevrolet Onix', imagen: '' }] };
    const m = {
      text: 'Gama C:\n---\nY la Gama F:',
      gamaCards: gamaF, // slot keeps last-wins
      partsOrder: 2 as const,
      parts: [t('Gama C:'), d('gamaCards', gamaC), t('Y la Gama F:'), d('gamaCards', gamaF)],
    };
    for (const msg of [m, JSON.parse(JSON.stringify(m))]) {
      const bubbles = layoutChatBubbles(msg);
      expect(shape(bubbles)).toEqual([['text:Gama C:', 'gamaCards', 'text:Y la Gama F:', 'gamaCards']]);
      const gamas = bubbles[0]!.blocks
        .filter((b) => b.kind === 'gamaCards')
        .map((b) => (b as { data: GamaCardsPart }).data.gama);
      expect(gamas).toEqual(['C', 'F']);
    }
  });

  it('a re-quote shows both tables in place', () => {
    const second: QuoteTablePart = { ...quoteTable, dias: 5 };
    const bubbles = layoutChatBubbles({
      text: 'Por 3 días:\n---\nPor 5 días:',
      quoteTable: second,
      partsOrder: 2,
      parts: [t('Por 3 días:'), d('quoteTable', quoteTable), t('Por 5 días:'), d('quoteTable', second)],
    });
    expect(shape(bubbles)).toEqual([['text:Por 3 días:', 'quoteTable', 'text:Por 5 días:', 'quoteTable']]);
    const dias = bubbles[0]!.blocks
      .filter((b) => b.kind === 'quoteTable')
      .map((b) => (b as { data: QuoteTablePart }).data.dias);
    expect(dias).toEqual([3, 5]);
  });

  it('a filled slot with no ref (tool-output actions) lands at the end of the last bubble', () => {
    const bubbles = layoutChatBubbles({
      text: 'A\n---\nB',
      quoteTable,
      actions,
      partsOrder: 2,
      parts: [t('A'), d('quoteTable', quoteTable), t('B', false)],
    });
    expect(shape(bubbles)).toEqual([['text:A', 'quoteTable', 'text:B', 'actions']]);
    expect(bubbles[0]!.endsWithPart).toBe(true);
  });

  it('a slot overridden after its data ref (tool-output after data-buttons) also shows at the end', () => {
    const bubbles = layoutChatBubbles({
      text: 'Reserva:\n---\nListo.',
      actions, // tool-output-available replaced the data-buttons payload
      partsOrder: 2,
      parts: [t('Reserva:'), d('buttons', webOnly), t('Listo.')],
    });
    expect(shape(bubbles)).toEqual([['text:Reserva:', 'actions', 'text:Listo.', 'actions']]);
    const last = bubbles[0]!.blocks.at(-1) as { data: unknown };
    expect(last.data).toEqual(actions);
  });

  it('only data, no text → one bubble with the data in order', () => {
    const bubbles = layoutChatBubbles({
      text: '',
      gamaCards,
      actions,
      partsOrder: 2,
      parts: [d('buttons', actions), d('gamaCards', gamaCards)],
    });
    expect(shape(bubbles)).toEqual([['actions', 'gamaCards']]);
    expect(bubbles[0]!.text).toBe('');
  });

  it('data then text: text without break stays in the same bubble', () => {
    const bubbles = layoutChatBubbles({
      text: 'Te dejo el enlace abajo.',
      actions: webOnly,
      partsOrder: 2,
      parts: [d('buttons', webOnly), t('Te dejo el enlace abajo.')],
    });
    expect(shape(bubbles)).toEqual([['actions', 'text:Te dejo el enlace abajo.']]);
  });

  it('nothing at all → no bubbles', () => {
    expect(layoutChatBubbles({ text: '', partsOrder: 2, parts: [] })).toEqual([]);
  });
});
