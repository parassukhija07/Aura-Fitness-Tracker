import { getWeekDays, isSameDay } from './logDates';

// helper: local-midnight date constructor
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

// ---------------------------------------------------------------------------
// getWeekDays with startOnMonday=false (Sunday start)
// ---------------------------------------------------------------------------

test('getWeekDays(startOnMonday=false) — Sunday input returns same Sunday as day[0]', () => {
  // 2026-06-21 is a Sunday
  const result = getWeekDays(d(2026, 6, 21), 0, false);
  expect(result.length).toBe(7);
  expect(result[0].getDay()).toBe(0); // Sunday
  expect(isSameDay(result[0], d(2026, 6, 21))).toBe(true);
});

test('getWeekDays(startOnMonday=false) — Wednesday input starts on the preceding Sunday', () => {
  // 2026-06-17 is Wednesday; preceding Sunday is 2026-06-14
  const result = getWeekDays(d(2026, 6, 17), 0, false);
  expect(result.length).toBe(7);
  expect(result[0].getDay()).toBe(0); // Sunday
  expect(isSameDay(result[0], d(2026, 6, 14))).toBe(true);
  // last day should be Saturday 2026-06-20
  expect(result[6].getDay()).toBe(6);
  expect(isSameDay(result[6], d(2026, 6, 20))).toBe(true);
});

test('getWeekDays(startOnMonday=false) — consecutive days are +1 apart', () => {
  const result = getWeekDays(d(2026, 6, 17), 0, false);
  for (let i = 1; i < 7; i++) {
    expect(result[i].getTime()).toBe(result[i - 1].getTime() + 86400000);
  }
});

test('getWeekDays(startOnMonday=false) — weekOffset=1 shifts window by 7 days', () => {
  const week0 = getWeekDays(d(2026, 6, 17), 0, false);
  const week1 = getWeekDays(d(2026, 6, 17), 1, false);
  // week1[0] should be 7 days after week0[0]
  expect(week1[0].getTime()).toBe(week0[0].getTime() + 7 * 86400000);
});

test('getWeekDays(startOnMonday=false) — Monday input starts on the preceding Sunday', () => {
  // 2026-06-15 is Monday; preceding Sunday is 2026-06-14
  const result = getWeekDays(d(2026, 6, 15), 0, false);
  expect(result[0].getDay()).toBe(0); // Sunday
  expect(isSameDay(result[0], d(2026, 6, 14))).toBe(true);
});

// ---------------------------------------------------------------------------
// Backward compatibility: no third arg still produces Monday-anchored week
// ---------------------------------------------------------------------------

test('getWeekDays(no third arg) — still Monday-anchored (backward compatibility)', () => {
  // 2026-06-17 is Wednesday; Mon-anchored week starts 2026-06-15
  const result = getWeekDays(d(2026, 6, 17), 0);
  expect(result[0].getDay()).toBe(1); // Monday
  expect(isSameDay(result[0], d(2026, 6, 15))).toBe(true);
});
