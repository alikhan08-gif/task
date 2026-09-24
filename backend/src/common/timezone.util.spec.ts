import {
  calendarDateInTimezone,
  daysBetweenCalendarDates,
} from './timezone.util';

describe('timezone.util', () => {
  it("UTC kechqurun bo'lsa ham, Toshkentda ertasi kun bo'lishi mumkin", () => {
    const lateUtc = new Date('2026-01-01T20:00:00.000Z');
    expect(calendarDateInTimezone(lateUtc, 'Asia/Tashkent')).toBe('2026-01-02');
    expect(calendarDateInTimezone(lateUtc, 'UTC')).toBe('2026-01-01');
  });

  it("kalendar kunlar orasidagi farqni to'g'ri hisoblaydi", () => {
    expect(daysBetweenCalendarDates('2026-01-01', '2026-01-02')).toBe(1);
    expect(daysBetweenCalendarDates('2026-01-01', '2026-01-05')).toBe(4);
    expect(daysBetweenCalendarDates('2026-01-05', '2026-01-01')).toBe(-4);
  });
});
