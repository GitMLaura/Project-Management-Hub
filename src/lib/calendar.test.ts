import { describe, expect, it } from "vitest";
import { buildCalendarMonth, parseMonth } from "@/lib/calendar";

describe("parseMonth", () => {
  it("reads YYYY-MM", () => {
    expect(parseMonth("2027-02", "2026-11-16")).toEqual({ year: 2027, month: 2 });
  });
  it("falls back to the month of today for anything else", () => {
    expect(parseMonth(undefined, "2026-11-16")).toEqual({ year: 2026, month: 11 });
    expect(parseMonth("2026-13", "2026-11-16")).toEqual({ year: 2026, month: 11 });
    expect(parseMonth("abc", "2026-11-16")).toEqual({ year: 2026, month: 11 });
  });
});

describe("buildCalendarMonth", () => {
  const month = buildCalendarMonth({
    year: 2026,
    month: 11,
    today: "2026-11-16",
    deadlines: [
      { deadline: "2026-11-10", done: false }, // late
      { deadline: "2026-11-10", done: true }, // done: ignored
      { deadline: "2026-11-20", done: false },
    ],
  });
  const days = month.weeks.flat();

  it("builds full weeks starting on Sunday", () => {
    expect(month.weeks.every((week) => week.length === 7)).toBe(true);
    expect(month.weeks[0][0].iso).toBe("2026-11-01"); // 1 Nov 2026 is a Sunday
    expect(month.label).toBe("novembro 2026");
  });

  it("marks today and days outside the month", () => {
    expect(days.find((day) => day.isToday)?.iso).toBe("2026-11-16");
    expect(days.some((day) => !day.inMonth)).toBe(true);
  });

  it("counts pending deadlines and which ones are late", () => {
    expect(days.find((day) => day.iso === "2026-11-10")).toMatchObject({ count: 1, late: 1 });
    expect(days.find((day) => day.iso === "2026-11-20")).toMatchObject({ count: 1, late: 0 });
  });

  it("links to the neighbour months, across years", () => {
    expect(month.prev).toBe("2026-10");
    expect(month.next).toBe("2026-12");
    const january = buildCalendarMonth({ year: 2027, month: 1, today: "2027-01-05", deadlines: [] });
    expect(january.prev).toBe("2026-12");
  });
});
