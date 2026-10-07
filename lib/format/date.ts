/**
 * Formats a date string or Date object to a localized string.
 */
export function formatDate(date: string | Date, locale: string = "en-PK", withTime: boolean = false): string {
  if (!date) return "";
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  if (withTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }
  return d.toLocaleDateString(locale, options);
}
