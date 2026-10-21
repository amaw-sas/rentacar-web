import { describe, it, expect, afterAll } from 'vitest';

// TZ is pinned BEFORE the dynamic import (see formatTime.tz.test.ts).
const originalTZ = process.env.TZ;
process.env.TZ = 'Asia/Tokyo';
afterAll(() => {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

const { formatQuoteDateTimeShort } = await import('../useDateFunctions');

describe('formatQuoteDateTimeShort — stable under TZ=Asia/Tokyo', () => {
  it('keeps weekday and clock of the civil date', () => {
    expect(formatQuoteDateTimeShort('2026-10-16', '07:30')).toBe('vie 16 oct. 7:30am');
    expect(formatQuoteDateTimeShort('2026-10-16', '00:15')).toBe('vie 16 oct. 12:15am');
  });
});
