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
    storyPersona: null,
    storyAction: null,
    storyBenefit: null,
    acceptanceCriteria: [],
    archivedAt: null,
    ...extra,
  };
}

const tree = buildItemTree([
  item("e1", null, "epic"),
  item("f1", "e1", "feature"),
  item("s1", "f1", "story"),
  item("t1", "s1", "task", { status: "concluido" }),
  item("t2", "s1", "task", { areaId: "dev", assigneeId: "bia", status: "em_andamento" }),
  item("t3", "s1", "task"),
  item("t4", "s1", "task", { status: "concluido" }),
  item("e2", null, "epic"),
]);

describe("calcProgress (rule E6)", () => {
  it("is done tasks divided by all tasks inside the item", () => {
    expect(calcProgress(tree[0])).toEqual({ done: 2, total: 4, percent: 50 });
  });

  it("is 0 of 0 for an item without tasks", () => {
    expect(calcProgress(tree[1])).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it("counts a task as one task", () => {
    const task = tree[0].children[0].children[0].children[0];
    expect(calcProgress(task)).toEqual({ done: 1, total: 1, percent: 100 });
  });

  it("rounds the percentage", () => {
    const [epic] = buildItemTree([
      item("e", null, "epic"),
      item("f", "e", "feature"),
      item("s", "f", "story"),
      item("a", "s", "task", { status: "concluido" }),
      item("b", "s", "task"),
      item("c", "s", "task"),
    ]);
    expect(calcProgress(epic).percent).toBe(33);
  });

  it("builds a map for every item", () => {
    const map = buildProgressMap(tree);
    expect(map.e1.percent).toBe(50);
    expect(map.s1.total).toBe(4);
    expect(Object.keys(map)).toHaveLength(8);
  });
});

describe("filterTree", () => {
  it("returns everything without filters", () => {
    expect(filterTree(tree, {})).toHaveLength(2);
  });

  it("keeps matching items and their ancestors", () => {
    const result = filterTree(tree, { areaId: "dev" });
    expect(result.map((n) => n.id)).toEqual(["e1"]);
    const story = result[0].children[0].children[0];
    expect(story.children.map((n) => n.id)).toEqual(["t2"]);
  });

  it("combines area, person and status with AND", () => {
    expect(filterTree(tree, { assigneeId: "ana", status: "concluido" })[0].children[0].children[0].children.map((n) => n.id)).toEqual(["t1", "t4"]);
    expect(filterTree(tree, { assigneeId: "bia", status: "concluido" })).toEqual([]);
  });

  it("does not change the original tree", () => {
    filterTree(tree, { areaId: "dev" });
    expect(tree[0].children[0].children[0].children).toHaveLength(4);
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
