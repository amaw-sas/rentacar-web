import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createChatConversation,
  type ChatConversationConfig,
  type ChatMessage,
} from '../useChatConversation';
import { layoutChatBubbles, type ChatBubble } from '../../utils/layoutChatBubbles';

// globos-separados-por-fotos.scenarios.md (SCEN-001..006): a text that arrives
// right after PHOTO cards opens a new bubble, so each gama's price+photos pair
// gets its own bubble and the closing question stands alone. Diego's 6-oct
// decision (with preview): ONLY photo cards break; the quote table and the sede
// list keep gluing exactly as today.
//
// Same stubbed-browser harness as useChatConversation.partsOrder.test.ts.

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

beforeEach(() => {
  vi.useFakeTimers();
  stream = makeStreamedFetch();
  store = makeStorage();
  vi.stubGlobal('localStorage', store);
  vi.stubGlobal('document', {
    visibilityState: 'visible',
    addEventListener: () => {},
    removeEventListener: () => {},
  });
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
  const brand = `gs${brandSeq++}`;
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
const cards = (gama: string, nombre: string) => ({
  type: 'data-gamaCards',
  data: {
    gama,
    descripcion: `Descripción ${gama}`,
    modelos: [{ nombre, imagen: `https://img.test/${gama}.webp` }],
  },
});
const TABLA = {
  type: 'data-quoteTable',
  data: {
    sede: 'Bogotá Aeropuerto',
    dias: 4,
    filas: [
      { categoria: 'C', descripcion: 'Compacto Mecánico', precioTotal: 700000, horasExtra: 0, precioHoraExtra: 0 },
    ],
  },
};
const SEDES = {
  type: 'data-sedeCards',
  data: {
    sedes: [{ code: 'AABOT', nombre: 'Bogotá Aeropuerto', horario: 'Lun-Dom 24h' }],
  },
};

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

const PRECIO_C = 'Gama C (Compacto mecánico): $700.000 por los 4 días.';
const PRECIO_FX = 'Gama FX (Sedán automático): $888.000 por los 4 días.';
const CIERRE = 'El carro exacto se asigna en la sede según disponibilidad. ¿Con cuál seguimos, la C o la FX?';

describe('SCEN-001 — dos gamas → tres globos', () => {
  it('cada par precio+fotos en su burbuja, el cierre solo', async () => {
    const inst = createChatConversation(cfg());
    const m = await runTurn(inst, [
      MARKER,
      ...text(PRECIO_C),
      cards('C', 'Fiat Mobi'),
      ...text(PRECIO_FX),
      cards('FX', 'Chevrolet Onix'),
      ...text(CIERRE),
    ]);
    expect(shape(layoutChatBubbles(m))).toEqual([
      [`text:${PRECIO_C}`, 'gamaCards'],
      [`text:${PRECIO_FX}`, 'gamaCards'],
      [`text:${CIERRE}`],
    ]);
  });
});

describe('SCEN-002 — gama única → dos globos', () => {
  it('[ficha + fotos] y [oferta] aparte', async () => {
    const inst = createChatConversation(cfg());
    const m = await runTurn(inst, [
      MARKER,
      ...text('Estos son ejemplos de la Gama FX. Queda en $888.000 por los 4 días.'),
      cards('FX', 'Chevrolet Onix'),
      ...text('**¿Te ayudo a realizar la reserva?**'),
    ]);
    expect(shape(layoutChatBubbles(m))).toEqual([
      ['text:Estos son ejemplos de la Gama FX. Queda en $888.000 por los 4 días.', 'gamaCards'],
      ['text:**¿Te ayudo a realizar la reserva?**'],
    ]);
  });
});

describe('SCEN-003 — la cotización con tabla NO cambia', () => {
  it('texto, tabla y cierre siguen en una sola burbuja', async () => {
    const inst = createChatConversation(cfg());
    const m = await runTurn(inst, [
      MARKER,
      ...text('Te resumo: Bogotá Aeropuerto, 4 días:'),
      TABLA,
      ...text('**¿Te ayudo a realizar la reserva?**'),
    ]);
    expect(shape(layoutChatBubbles(m))).toEqual([
      [
        'text:Te resumo: Bogotá Aeropuerto, 4 días:',
        'quoteTable',
        'text:**¿Te ayudo a realizar la reserva?**',
      ],
    ]);
  });
});

describe('SCEN-004 — la lista de sedes NO cambia', () => {
  it('texto, tarjetas de sede y texto siguen en una sola burbuja', async () => {
    const inst = createChatConversation(cfg());
    const m = await runTurn(inst, [
      MARKER,
      ...text('Estas son las sedes de Bogotá:'),
      SEDES,
      ...text('¿Cuál te queda mejor?'),
    ]);
    expect(shape(layoutChatBubbles(m))).toEqual([
      ['text:Estas son las sedes de Bogotá:', 'sedeCards', 'text:¿Cuál te queda mejor?'],
    ]);
  });
});

describe('SCEN-005 — tres gamas → cuatro globos (tope en 6, decisión del dueño 6-oct)', () => {
  // Enmienda anotada en el contrato: el QA en vivo mostró que el globo explicativo
  // del redactor sumaba un 4º texto y el tope viejo de 3 pegaba el cierre bajo las
  // fotos de la última gama.
  it('cada par en su burbuja y el cierre aparte, aun siendo el 4º texto', async () => {
    const inst = createChatConversation(cfg());
    const m = await runTurn(inst, [
      MARKER,
      ...text('Gama C: $700.000.'),
      cards('C', 'Fiat Mobi'),
      ...text('Gama F: $776.000.'),
      cards('F', 'Renault Logan'),
      ...text('Gama FX: $888.000.'),
      cards('FX', 'Chevrolet Onix'),
      ...text('¿Con cuál seguimos?'),
    ]);
    expect(shape(layoutChatBubbles(m))).toEqual([
      ['text:Gama C: $700.000.', 'gamaCards'],
      ['text:Gama F: $776.000.', 'gamaCards'],
      ['text:Gama FX: $888.000.', 'gamaCards'],
      ['text:¿Con cuál seguimos?'],
    ]);
  });
});

describe('el titular del contrato vale para TODA forma de stream', () => {
  it('fotos PRIMERO (sin texto previo): el texto que sigue abre globo nuevo', async () => {
    // El titular: "un texto que llega después de las FOTOS abre globo nuevo" —
    // también cuando el turno abre con las tarjetas.
    const inst = createChatConversation(cfg());
    const m = await runTurn(inst, [MARKER, cards('FX', 'Chevrolet Onix'), ...text('¿Cuál te gusta?')]);
    expect(shape(layoutChatBubbles(m))).toEqual([['gamaCards'], ['text:¿Cuál te gusta?']]);
  });

  it('un delta SIN text-start después de las fotos también rompe', async () => {
    // El AI SDK puede intercalar data-parts entre deltas del mismo turno: la
    // ruptura no depende de que llegue un text-start.
    const inst = createChatConversation(cfg());
    const m = await runTurn(inst, [
      MARKER,
      ...text(PRECIO_C),
      cards('C', 'Fiat Mobi'),
      { type: 'text-delta', delta: CIERRE },
    ]);
    expect(shape(layoutChatBubbles(m))).toEqual([
      [`text:${PRECIO_C}`, 'gamaCards'],
      [`text:${CIERRE}`],
    ]);
  });
});

describe('un payload de fotos RECHAZADO no rompe el globo', () => {
  it('tras unas fotos pintadas, un gamaCards inválido vuelve a pegar el texto que sigue', async () => {
    // "Solo las fotos PINTADAS abren globo": un payload sin `modelos` ocupa su
    // lugar como cualquier dato (no pinta nada) y el texto siguiente se pega.
    const inst = createChatConversation(cfg());
    const m = await runTurn(inst, [
      MARKER,
      ...text(PRECIO_C),
      cards('C', 'Fiat Mobi'),
      { type: 'data-gamaCards', data: { gama: 'FX' } },
      ...text(CIERRE),
    ]);
    expect(shape(layoutChatBubbles(m))).toEqual([
      [`text:${PRECIO_C}`, 'gamaCards', `text:${CIERRE}`],
    ]);
  });
});

describe('SCEN-006 — lo guardado con marcas viejas no se mueve', () => {
  it('un mensaje restaurado conserva su agrupado: el layout no recalcula marcas', () => {
    // Un transcript persistido ANTES de este cambio trae `newBubble: false` en el
    // texto que sigue a las fotos. Ese historial se sigue pintando pegado, como
    // cuando se guardó — la regla nueva vive en el parser, no acá.
    const guardado = {
      id: 'a1',
      role: 'assistant',
      text: `${PRECIO_C}\n---\n${CIERRE}`,
      partsOrder: 2,
      parts: [
        { type: 'text', text: PRECIO_C, newBubble: false },
        { type: 'gamaCards', data: { gama: 'C', modelos: [{ nombre: 'Fiat Mobi', imagen: 'https://img.test/c.webp' }] } },
        { type: 'text', text: CIERRE, newBubble: false },
      ],
    } as unknown as ChatMessage;
    expect(shape(layoutChatBubbles(guardado))).toEqual([
      [`text:${PRECIO_C}`, 'gamaCards', `text:${CIERRE}`],
    ]);
  });
});
