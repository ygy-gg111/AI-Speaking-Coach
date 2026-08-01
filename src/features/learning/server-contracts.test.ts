import { describe, expect, it } from "vitest";

import {
  calendarDateParamsSchema,
  getLocalDateRange,
  getLocalMonthRange,
  getReportHistoryRange,
} from "./server-contracts";

describe("calendar server contracts", () => {
  it("converts a UTC+8 month into UTC boundaries", () => {
    const range = getLocalMonthRange(2026, 7, -480);

    expect(range.start.toISOString()).toBe("2026-06-30T16:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-07-31T16:00:00.000Z");
  });

  it("converts a local date into a one-day UTC range", () => {
    const range = getLocalDateRange("2026-07-31", -480);

    expect(range.start.toISOString()).toBe("2026-07-30T16:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-07-31T16:00:00.000Z");
  });

  it("rejects impossible calendar dates", () => {
    expect(
      calendarDateParamsSchema.safeParse({
        date: "2026-02-30",
        timezoneOffset: -480,
      }).success,
    ).toBe(false);
  });

  it("builds two report periods of timezone-aware history", () => {
    const range = getReportHistoryRange(
      7,
      -480,
      new Date("2026-07-31T04:00:00.000Z"),
    );

    expect(range.start.toISOString()).toBe("2026-07-17T16:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-07-31T16:00:00.000Z");
  });
});
