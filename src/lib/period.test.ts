import { describe, expect, it } from "vitest";
import type { ItemNode } from "@/lib/item-tree";
import { filterTasksByRange, parsePeriod, periodRange } from "@/lib/period";

function node(id: string, type: ItemNode["type"], deadline: string, children: ItemNode[] = []): ItemNode {
  return {
    id, parentId: null, type, title: id, description: "", areaId: "a", assigneeId: "p",
    startDate: null, deadline, status: "a_fazer", isCritical: false,
    groupLabel: null,
    archivedAt: null, children,
  };
}

describe("parsePeriod", () => {
  it("accepts the periods and falls back to the month", () => {
    expect(parsePeriod("day")).toBe("day");
    expect(parsePeriod("week")).toBe("week");
    expect(parsePeriod("month")).toBe("month");
    expect(parsePeriod("all")).toBe("all");
    expect(parsePeriod("year")).toBe("month");
    expect(parsePeriod(undefined)).toBe("month");
  });
});

describe("periodRange", () => {
  it("has no range for all", () => {
    expect(periodRange("all", "2026-11-18")).toBeNull();
  });
  it("is just today for day", () => {
    expect(periodRange("day", "2026-11-18")).toEqual({ start: "2026-11-18", end: "2026-11-18" });
  });
  it("runs Monday to Sunday for week", () => {
    // 18 Nov 2026 is a Wednesday
    expect(periodRange("week", "2026-11-18")).toEqual({ start: "2026-11-16", end: "2026-11-22" });
    // a Sunday still belongs to the week that started on the previous Monday
    expect(periodRange("week", "2026-11-22")).toEqual({ start: "2026-11-16", end: "2026-11-22" });
    // a Monday starts its own week
    expect(periodRange("week", "2026-11-16")).toEqual({ start: "2026-11-16", end: "2026-11-22" });
  });
  it("covers the calendar month, including February", () => {
    expect(periodRange("month", "2026-11-18")).toEqual({ start: "2026-11-01", end: "2026-11-30" });
    expect(periodRange("month", "2028-02-10")).toEqual({ start: "2028-02-01", end: "2028-02-29" });
  });
});

describe("filterTasksByRange", () => {
  const tree = [
    node("g", "group", "", [
      node("t1", "task", "2026-11-16"),
      node("t2", "task", "2026-11-30"),
    ]),
  ];
  it("keeps everything without a range", () => {
    expect(filterTasksByRange(tree, null)[0].children).toHaveLength(2);
  });
  it("drops tasks outside the range but keeps the parent", () => {
    const result = filterTasksByRange(tree, { start: "2026-11-16", end: "2026-11-22" });
    expect(result).toHaveLength(1);
    expect(result[0].children.map((task) => task.id)).toEqual(["t1"]);
  });
});
