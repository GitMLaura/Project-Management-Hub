import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/format";

describe("formatDate", () => {
  it("formats an ISO date as dd/mm/yyyy", () => {
    expect(formatDate("2026-06-30")).toBe("30/06/2026");
    expect(formatDate("2026-01-05")).toBe("05/01/2026");
  });
});
