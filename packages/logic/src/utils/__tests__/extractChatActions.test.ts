import { describe, it, expect } from 'vitest';
import { extractChatActions } from '../extractChatActions';

describe('extractChatActions', () => {
  it('extracts web + whatsapp URLs from a crear_reserva tool output', () => {
    expect(
      extractChatActions({
        error: 'falló (LLNRRE002)',
        completar_en_web: 'https://alquilatucarro.com/armenia/buscar-vehiculos/...',
        whatsapp_asesor: 'https://wa.me/573016729250?text=hola',
      }),
    ).toEqual({
      web: 'https://alquilatucarro.com/armenia/buscar-vehiculos/...',
      whatsapp: 'https://wa.me/573016729250?text=hola',
    });
  });

  it('returns null for a normal output without fallback links', () => {
    expect(extractChatActions({ numero_solicitud: 'AVX123' })).toBeNull();
    expect(extractChatActions({ error: 'x' })).toBeNull();
  });

  it('ignores non-http values (no fabrication)', () => {
    expect(
      extractChatActions({ completar_en_web: 'javascript:alert(1)', whatsapp_asesor: 42 }),
    ).toBeNull();
  });

  it('returns null for non-objects', () => {
    expect(extractChatActions(null)).toBeNull();
    expect(extractChatActions('text')).toBeNull();
  });

  it('keeps only the present link', () => {
    expect(
      extractChatActions({ completar_en_web: 'https://a.co/x' }),
    ).toEqual({ web: 'https://a.co/x', whatsapp: undefined });
  });
});
