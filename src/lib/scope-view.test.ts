import { describe, expect, it } from "vitest";
import { buildItemTree, type ItemRecord } from "@/lib/item-tree";
import {
  buildProgressMap,
  calcProgress,
  filterTree,
  parseScopeFilters,
} from "@/lib/scope-view";

function item(
  id: string,
  parentId: string | null,
  type: ItemRecord["type"],
  extra: Partial<ItemRecord> = {},
): ItemRecord {
  return {
    id,
    parentId,
    type,
    title: id,
    description: "",
    areaId: "design",
    assigneeId: "ana",
    startDate: null,
    deadline: "2026-12-31",
    status: "a_fazer",
    isCritical: false,
    groupLabel: type === "group" ? "feature" : null,
    archivedAt: null,
    ...extra,
  };
}

const tree = buildItemTree([
  item("g1", null, "group"),
  item("t1", "g1", "task", { status: "concluido" }),
  item("t2", "g1", "task", { areaId: "dev", assigneeId: "bia", status: "em_andamento" }),
  item("t3", "g1", "task"),
  item("t4", "g1", "task", { status: "concluido" }),
  item("g2", null, "group"),
  item("t5", null, "task", { status: "concluido" }),
]);

describe("calcProgress (rule E6)", () => {
  it("is done tasks divided by all tasks inside the item", () => {
    expect(calcProgress(tree[0])).toEqual({ done: 2, total: 4, percent: 50 });
  });

  it("is 0 of 0 for a group without tasks", () => {
    expect(calcProgress(tree[1])).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it("counts a task as one task", () => {
    expect(calcProgress(tree[2])).toEqual({ done: 1, total: 1, percent: 100 });
  });

  it("rounds the percentage", () => {
    const [group] = buildItemTree([
      item("g", null, "group"),
      item("a", "g", "task", { status: "concluido" }),
      item("b", "g", "task"),
      item("c", "g", "task"),
    ]);
    expect(calcProgress(group).percent).toBe(33);
  });

  it("builds a map for every item", () => {
    const map = buildProgressMap(tree);
    expect(map.g1.percent).toBe(50);
    expect(map.g1.total).toBe(4);
    expect(Object.keys(map)).toHaveLength(7);
  });
});

describe("filterTree", () => {
  it("returns everything without filters", () => {
    expect(filterTree(tree, {})).toHaveLength(3);
  });

  it("keeps matching items and their ancestors", () => {
    const result = filterTree(tree, { areaId: "dev" });
    expect(result.map((n) => n.id)).toEqual(["g1"]);
    expect(result[0].children.map((n) => n.id)).toEqual(["t2"]);
  });

  it("combines area, person and status with AND", () => {
    expect(filterTree(tree, { assigneeId: "ana", status: "concluido" }).map((n) => n.id)).toEqual(["g1", "t5"]);
    expect(filterTree(tree, { assigneeId: "bia", status: "concluido" })).toEqual([]);
  });

  it("does not change the original tree", () => {
    filterTree(tree, { areaId: "dev" });
    expect(tree[0].children).toHaveLength(4);
  });
});

describe("parseScopeFilters", () => {
  const valid = { areaIds: ["design", "dev"], assigneeIds: ["ana"] };

  it("reads known values", () => {
    expect(parseScopeFilters({ area: "dev", assignee: "ana", status: "bloqueado" }, valid)).toEqual({
      areaId: "dev",
      assigneeId: "ana",
      status: "bloqueado",
    });
  });

  it("ignores unknown or empty values", () => {
    expect(parseScopeFilters({ area: "x", assignee: "", status: "feito" }, valid)).toEqual({
      areaId: undefined,
      assigneeId: undefined,
      status: undefined,
    });
  });
});
