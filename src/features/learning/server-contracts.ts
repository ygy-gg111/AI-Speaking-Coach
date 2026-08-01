import { z } from "zod";

export const calendarMonthQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  timezoneOffset: z.coerce.number().int().min(-840).max(840).default(0),
});

export const calendarDateParamsSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isValidDate),
  timezoneOffset: z.coerce.number().int().min(-840).max(840).default(0),
});

export const dashboardQuerySchema = z.object({
  timezoneOffset: z.coerce.number().int().min(-840).max(840).default(0),
});

export const reportQuerySchema = z.object({
  period: z.coerce.number().pipe(z.union([z.literal(7), z.literal(30)])),
  timezoneOffset: z.coerce.number().int().min(-840).max(840).default(0),
});

export function getLocalMonthRange(
  year: number,
  month: number,
  timezoneOffset: number,
) {
  return {
    start: localMidnightToUtc(year, month, 1, timezoneOffset),
    end: localMidnightToUtc(year, month + 1, 1, timezoneOffset),
  };
}

export function getLocalDateRange(date: string, timezoneOffset: number) {
  const [year, month, day] = date.split("-").map(Number);
  return {
    start: localMidnightToUtc(year, month, day, timezoneOffset),
    end: localMidnightToUtc(year, month, day + 1, timezoneOffset),
  };
}

export function getReportHistoryRange(
  period: 7 | 30,
  timezoneOffset: number,
  now = new Date(),
) {
  const localNow = new Date(now.getTime() - timezoneOffset * 60_000);
  const year = localNow.getUTCFullYear();
  const month = localNow.getUTCMonth() + 1;
  const day = localNow.getUTCDate();

  return {
    start: localMidnightToUtc(
      year,
      month,
      day - (period * 2 - 1),
      timezoneOffset,
    ),
    end: localMidnightToUtc(year, month, day + 1, timezoneOffset),
  };
}

function localMidnightToUtc(
  year: number,
  month: number,
  day: number,
  timezoneOffset: number,
) {
  return new Date(Date.UTC(year, month - 1, day) + timezoneOffset * 60_000);
}

function isValidDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}
