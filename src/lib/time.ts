export const MANILA_TIMEZONE = "Asia/Manila";

const MANILA_UTC_OFFSET_HOURS = 8;

export function toUtcIsoFromManilaLocal(localDateTime: string) {
  const [datePart, timePart] = localDateTime.split("T");
  if (!datePart || !timePart) {
    throw new Error("Invalid local datetime format");
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  const utcMillis =
    Date.UTC(year, month - 1, day, hour, minute) - MANILA_UTC_OFFSET_HOURS * 60 * 60 * 1000;
  return new Date(utcMillis).toISOString();
}

export function formatInManila(dateInput: string | Date, options?: Intl.DateTimeFormatOptions) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return date.toLocaleString("en-PH", {
    timeZone: MANILA_TIMEZONE,
    ...options,
  });
}

export function getManilaDateParts(dateInput: string | Date) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}
