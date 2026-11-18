import { describe, expect, it } from "vitest";
import { buildItemTree, countDescendants, type ItemRecord } from "@/lib/item-tree";

export function item(id: string, parentId: string | null, type: ItemRecord["type"]): ItemRecord {
  return {
    id,
    parentId,
    type,
    groupLabel: type === "group" ? "feature" : null,
    title: id,
    description: "",
    areaId: "a1",
    assigneeId: "u1",
    startDate: null,
    deadline: "2026-12-31",
    status: "a_fazer",
    isCritical: false,
    archivedAt: null,
  };
}

describe("buildItemTree", () => {
  it("nests tasks under their group, keeps loose tasks and the input order", () => {
    const tree = buildItemTree([
      item("g1", null, "group"),
      item("t1", "g1", "task"),
      item("t2", null, "task"),
      item("t3", "g1", "task"),
    ]);
    expect(tree.map((node) => node.id)).toEqual(["g1", "t2"]);
    expect(tree[0].children.map((node) => node.id)).toEqual(["t1", "t3"]);
  });

  it("keeps an item with a missing parent as a root instead of losing it", () => {
    const tree = buildItemTree([item("t1", "ghost", "task")]);
    expect(tree.map((node) => node.id)).toEqual(["t1"]);
  });
});

describe("countDescendants", () => {
  it("counts the tasks inside a group", () => {
    const [group] = buildItemTree([item("g1", null, "group"), item("t1", "g1", "task"), item("t2", "g1", "task")]);
    expect(countDescendants(group)).toBe(2);
  });
});
