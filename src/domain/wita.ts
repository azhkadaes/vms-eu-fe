export const VISIT_TIME_ZONE = "Asia/Makassar";

const dateParts = new Intl.DateTimeFormat("en-US", {
  timeZone: VISIT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function witaDate(now: Date = new Date()): string {
  const parts = Object.fromEntries(dateParts.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function addCalendarDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function witaYear(now: Date = new Date()): number {
  return Number(witaDate(now).slice(0, 4));
}

export function millisecondsUntilNextWitaDate(now: Date = new Date()): number {
  const nextDate = addCalendarDays(witaDate(now), 1);
  return Math.max(0, Date.parse(`${nextDate}T00:00:00+08:00`) - now.getTime());
}

export function formatWitaTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: VISIT_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}
