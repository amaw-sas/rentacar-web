import { describe, it, expect } from 'vitest';
import {
  formatTime12h,
  parseTime12hOr24h,
  isTime12hFormat,
  isTime24hFormat,
  createCurrentDateObject,
  createTimeFromString,
  toDatetime
} from '../useDateFunctions';

describe('format detection', () => {
  it('detects 12h format', () => {
    expect(isTime12hFormat('01:00pm')).toBe(true);
    expect(isTime12hFormat('12:30am')).toBe(true);
    expect(isTime12hFormat('11:59PM')).toBe(true);
    expect(isTime12hFormat('13:00')).toBe(false);
    expect(isTime12hFormat('invalid')).toBe(false);
  });

  it('detects 24h format', () => {
    expect(isTime24hFormat('13:00')).toBe(true);
    expect(isTime24hFormat('00:00')).toBe(true);
    expect(isTime24hFormat('23:59')).toBe(true);
    expect(isTime24hFormat('01:00pm')).toBe(false);
    expect(isTime24hFormat('invalid')).toBe(false);
  });
});

describe('formatTime12h', () => {
  it('converts 13:00 to 01:00pm', () => {
    const time = createTimeFromString('13:00');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('01:00pm');
  });

  it('converts 00:00 to 12:00am', () => {
    const time = createTimeFromString('00:00');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('12:00am');
  });

  it('converts 12:00 to 12:00pm', () => {
    const time = createTimeFromString('12:00');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('12:00pm');
  });

  it('converts 23:30 to 11:30pm', () => {
    const time = createTimeFromString('23:30');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('11:30pm');
  });

  it('converts 01:00 to 01:00am', () => {
    const time = createTimeFromString('01:00');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('01:00am');
  });

  it('converts 11:45 to 11:45am', () => {
    const time = createTimeFromString('11:45');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('11:45am');
  });
});

describe('parseTime12hOr24h', () => {
  it('parses 24h format', () => {
    const time = parseTime12hOr24h('13:00');
    expect(time?.hour).toBe(13);
    expect(time?.minute).toBe(0);
  });

  it('parses 12h format with pm', () => {
    const time = parseTime12hOr24h('01:00pm');
    expect(time?.hour).toBe(13);
    expect(time?.minute).toBe(0);
  });

  it('parses 12h format with am', () => {
    const time = parseTime12hOr24h('01:00am');
    expect(time?.hour).toBe(1);
    expect(time?.minute).toBe(0);
  });

  it('parses midnight correctly', () => {
    const time = parseTime12hOr24h('12:00am');
    expect(time?.hour).toBe(0);
    expect(time?.minute).toBe(0);
  });

  it('parses noon correctly', () => {
    const time = parseTime12hOr24h('12:00pm');
    expect(time?.hour).toBe(12);
    expect(time?.minute).toBe(0);
  });

  it('parses 11:59pm correctly', () => {
    const time = parseTime12hOr24h('11:59pm');
    expect(time?.hour).toBe(23);
    expect(time?.minute).toBe(59);
  });

  it('parses case insensitive (AM/PM)', () => {
    const timeUpper = parseTime12hOr24h('01:00PM');
    const timeLower = parseTime12hOr24h('01:00pm');
    expect(timeUpper?.hour).toBe(13);
    expect(timeLower?.hour).toBe(13);
  });

  it('returns null for invalid format', () => {
    expect(parseTime12hOr24h('25:00')).toBeNull();
    expect(parseTime12hOr24h('13:00xm')).toBeNull();
    expect(parseTime12hOr24h('invalid')).toBeNull();
    expect(parseTime12hOr24h('1:00pm')).toBeNull(); // single digit hour
  });
});
