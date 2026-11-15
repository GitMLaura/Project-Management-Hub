import { describe, expect, it } from "vitest";
import { buildItemTree, type ItemRecord } from "@/lib/item-tree";

function item(id: string, parentId: string | null, type: ItemRecord["type"]): ItemRecord {
  return {
    id,
    parentId,
    type,
    title: id,
    description: "",
    areaId: "a1",
    assigneeId: "u1",
    startDate: null,
    deadline: "2026-12-31",
    status: "a_fazer",
    isCritical: false,
    storyPersona: null,
    storyAction: null,
    storyBenefit: null,
    acceptanceCriteria: [],
  };
}

describe("buildItemTree", () => {
  it("nests items under their parents and keeps the input order", () => {
    const tree = buildItemTree([
      item("e1", null, "epic"),
      item("f1", "e1", "feature"),
      item("f2", "e1", "feature"),
      item("s1", "f1", "story"),
      item("t1", "s1", "task"),
      item("e2", null, "epic"),
    ]);
    expect(tree.map((node) => node.id)).toEqual(["e1", "e2"]);
    expect(tree[0].children.map((node) => node.id)).toEqual(["f1", "f2"]);
    expect(tree[0].children[0].children[0].children[0].id).toBe("t1");
  });

  it("keeps an item with a missing parent as a root instead of losing it", () => {
    const tree = buildItemTree([item("t1", "ghost", "task")]);
    expect(tree.map((node) => node.id)).toEqual(["t1"]);
  });

  it("returns an empty tree for no items", () => {
    expect(buildItemTree([])).toEqual([]);
  });
});
