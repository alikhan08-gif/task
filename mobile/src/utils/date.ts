const UZ_WEEKDAY_SHORT = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
const UZ_WEEKDAY_LONG = [
  'Yakshanba',
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
];
const UZ_MONTH = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentyabr',
  'oktyabr',
  'noyabr',
  'dekabr',
];

export function calendarKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return calendarKey(a) === calendarKey(b);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function startOfWeek(date: Date): Date {
  const day = date.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = addDays(date, diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function formatWeekdayLong(date: Date, num: number): string {
  return `${UZ_WEEKDAY_LONG[date.getDay()]}, ${num}-${UZ_MONTH[date.getMonth()]}`;
}

export function formatDayShort(date: Date): { label: string; num: number } {
  return { label: UZ_WEEKDAY_SHORT[date.getDay()], num: date.getDate() };
}

export function formatHeaderDate(date: Date): string {
  return `${date.getDate()}-${UZ_MONTH[date.getMonth()]}, ${UZ_WEEKDAY_LONG[date.getDay()]}`;
}

export function formatTime(iso: string | null): string {
  if (!iso) return "Vaqt yo'q";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

