import { describe, expect, it } from 'vitest';

import {
  getDaysSinceLastContact,
  getLastContactTone,
} from '@/app/(logged-in)/org/[slug]/customers/utils';

describe('customer contact age', () => {
  const now = new Date(2026, 8, 28, 12);

  it('counts calendar days, including a day change less than 24 hours ago', () => {
    expect(
      getDaysSinceLastContact(new Date(2026, 8, 27, 23, 55), new Date(2026, 8, 28, 0, 5))
    ).toBe(1);
    expect(getDaysSinceLastContact(new Date(2026, 8, 28, 8), now)).toBe(0);
    expect(getDaysSinceLastContact(new Date(2026, 8, 14, 12), now)).toBe(14);
  });

  it('handles missing and future contact dates', () => {
    expect(getDaysSinceLastContact(null, now)).toBeNull();
    expect(getDaysSinceLastContact(new Date(2026, 8, 29), now)).toBe(0);
  });

  it.each([
    [null, 'neutral'],
    [0, 'neutral'],
    [13, 'neutral'],
    [14, 'warning'],
    [29, 'warning'],
    [30, 'destructive'],
    [31, 'destructive'],
  ] as const)('uses %s days as %s', (days, tone) => {
    expect(getLastContactTone(days)).toBe(tone);
  });
});
