import { describe, expect, it } from "vitest";
import { formatDate, formatLongDate } from "@/lib/format";

describe("formatDate", () => {
  it("formats an ISO date as dd/mm/yyyy", () => {
    expect(formatDate("2026-06-30")).toBe("30/06/2026");
    expect(formatDate("2026-01-05")).toBe("05/01/2026");
  });
});

describe("formatLongDate", () => {
  it("formats an ISO date as day, short month and year", () => {
    expect(formatLongDate("2027-02-26")).toBe("26 fev 2027");
    expect(formatLongDate("2026-11-05")).toBe("5 nov 2026");
  });
});
