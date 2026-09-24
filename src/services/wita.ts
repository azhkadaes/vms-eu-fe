export const VISIT_TIME_ZONE = "Asia/Makassar";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: VISIT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function witaDate(now: Date = new Date()): string {
  const parts = Object.fromEntries(dateFormatter.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
