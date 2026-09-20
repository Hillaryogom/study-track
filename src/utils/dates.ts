/**
 * Local-date helpers. Every function works in the browser's local time zone and
 * exchanges `YYYY-MM-DD` strings, which is the storage format for study dates.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value) && !Number.isNaN(fromIsoDate(value).getTime());
}

/** Parses at local midday so daylight-saving shifts cannot move the calendar day. */
export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
}

export function addDays(value: string, amount: number): string {
  const date = fromIsoDate(value);
  date.setDate(date.getDate() + amount);
  return toIsoDate(date);
}

export function differenceInDays(later: string, earlier: string): number {
  const ms = fromIsoDate(later).getTime() - fromIsoDate(earlier).getTime();
  return Math.round(ms / 86_400_000);
}

/** Weeks start on Monday, matching the weekly planner in the visual reference. */
export function startOfWeek(value: string): string {
  const date = fromIsoDate(value);
  const weekday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - weekday);
  return toIsoDate(date);
}

export function endOfWeek(value: string): string {
  return addDays(startOfWeek(value), 6);
}

export function isWithinRange(value: string, startDate: string, endDate: string): boolean {
  return value >= startDate && value <= endDate;
}

export function lastNDays(count: number, reference: string): string[] {
  return Array.from({ length: count }, (_, index) => addDays(reference, index - (count - 1)));
}

export function formatDayLabel(value: string): string {
  return fromIsoDate(value).toLocaleDateString(undefined, { weekday: "short" });
}

export function formatShortDate(value: string): string {
  return fromIsoDate(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function formatLongDate(value: string): string {
  return fromIsoDate(value).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateRange(startDate: string, endDate: string): string {
  return startDate === endDate
    ? formatShortDate(startDate)
    : `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`;
}

/** Renders minutes as the compact `1h 30m` form used across cards and charts. */
export function formatDuration(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function minutesToHours(totalMinutes: number, fractionDigits = 1): number {
  return Number((totalMinutes / 60).toFixed(fractionDigits));
}
