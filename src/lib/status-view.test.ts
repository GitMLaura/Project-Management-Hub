import { describe, expect, it } from "vitest";
import type { ItemNode } from "@/lib/item-tree";
import { buildStatusView } from "@/lib/status-view";

function node(partial: Partial<ItemNode> & Pick<ItemNode, "id" | "type">): ItemNode {
  return {
    parentId: null,
    title: partial.id,
    description: "",
    areaId: "a1",
    assigneeId: "p1",
    startDate: null,
    deadline: "2026-12-01",
    status: "a_fazer",
    isCritical: false,
    storyPersona: null,
    storyAction: null,
    storyBenefit: null,
    acceptanceCriteria: [],
    archivedAt: null,
    children: [],
    ...partial,
  };
}

const tree: ItemNode[] = [
  node({
    id: "e1",
    type: "epic",
    children: [
      node({ id: "t1", type: "task", status: "concluido" }),
      node({ id: "t2", type: "task", deadline: "2026-11-01" }), // late
      node({ id: "t3", type: "task", areaId: "a2", status: "bloqueado" }),
    ],
  }),
  node({ id: "e2", type: "epic", areaId: "a2", children: [] }),
];

const view = buildStatusView({
  tree,
  areaIds: ["a1", "a2"],
  projectStart: "2026-11-01",
  projectDeadline: "2026-12-01",
  today: "2026-11-16",
});

describe("buildStatusView", () => {
  it("adds up totals", () => {
    expect(view.totals).toMatchObject({ lateTasks: 1, blockedItems: 1, doneTasks: 1, totalTasks: 3, percent: 33 });
  });

  it("calculates expected progress and days left", () => {
    expect(view.expectedPercent).toBe(50);
    expect(view.daysLeft).toBe(15);
  });

  it("counts per area and lists the epics where an area works", () => {
    expect(view.areaCounts.a1.totalTasks).toBe(2);
    expect(view.areaCounts.a2.blockedItems).toBe(1);
    expect(view.areaEpics.a2).toEqual(["e1", "e2"]);
  });

  it("counts per epic and lists its areas", () => {
    expect(view.epicCounts.e1.totalTasks).toBe(3);
    expect(view.epicAreas.e1).toEqual(["a1", "a2"]);
  });

  it("lists late and blocked items for attention", () => {
    expect(view.attention.map((item) => [item.id, item.reason])).toEqual([
      ["t2", "late"],
      ["t3", "blocked"],
    ]);
  });
});
