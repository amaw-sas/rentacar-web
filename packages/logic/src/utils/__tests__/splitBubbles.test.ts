import { describe, it, expect } from 'vitest';
import { splitBubbles } from '../splitBubbles';

describe('splitBubbles', () => {
  it('splits on a line that is only dashes', () => {
    expect(splitBubbles('Hola\n---\n¿En qué te ayudo?')).toEqual([
      'Hola',
      '¿En qué te ayudo?',
    ]);
  });

  it('handles 3 bubbles and trims each', () => {
    expect(splitBubbles('uno\n---\n  dos  \n---\ntres')).toEqual([
      'uno',
      'dos',
      'tres',
    ]);
  });

  it('returns a single bubble when there is no separator', () => {
    expect(splitBubbles('un solo mensaje')).toEqual(['un solo mensaje']);
  });

  it('does NOT split inline dashes inside a sentence', () => {
    expect(splitBubbles('precio 100---200 rango')).toEqual(['precio 100---200 rango']);
  });

  it('drops the empty chunk from a trailing separator', () => {
    expect(splitBubbles('a\n---\n')).toEqual(['a']);
  });
});
