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
    groupLabel: null,
    archivedAt: null,
    children: [],
    ...partial,
  };
}

const tree: ItemNode[] = [
  node({
    id: "g1",
    type: "group",
    groupLabel: "feature",
    children: [
      node({ id: "t1", type: "task", status: "concluido" }),
      node({ id: "t2", type: "task", deadline: "2026-11-01" }), // late
      node({ id: "t3", type: "task", areaId: "a2", status: "bloqueado" }),
    ],
  }),
  node({ id: "g2", type: "group", groupLabel: "epic", children: [] }),
  node({ id: "t4", type: "task", areaId: "a2", status: "concluido" }), // loose task
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
    expect(view.totals).toMatchObject({ lateTasks: 1, blockedItems: 1, doneTasks: 2, totalTasks: 4, percent: 50 });
  });

  it("calculates expected progress and days left", () => {
    expect(view.expectedPercent).toBe(50);
    expect(view.daysLeft).toBe(15);
  });

  it("counts per area and lists the groups where an area works", () => {
    expect(view.areaCounts.a1.totalTasks).toBe(2);
    expect(view.areaCounts.a2.totalTasks).toBe(2);
    expect(view.areaCounts.a2.blockedItems).toBe(1);
    expect(view.areaGroups.a1).toEqual(["g1"]);
    expect(view.areaGroups.a2).toEqual(["g1"]);
  });

  it("lists late and blocked items for attention, most overdue first", () => {
    expect(view.attention.map((item) => [item.id, item.reason])).toEqual([
      ["t2", "late"],
      ["t3", "blocked"],
    ]);
    expect(view.attention[0].daysOverdue).toBe(15);
    expect(view.attention[1].daysOverdue).toBe(0);
  });
});
