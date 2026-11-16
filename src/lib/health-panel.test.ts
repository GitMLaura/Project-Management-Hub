import { describe, expect, it } from "vitest";
import { buildHealthPanel } from "@/lib/health-panel";
import { buildItemTree, type ItemRecord } from "@/lib/item-tree";

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
    title: `Item ${id}`,
    description: "",
    areaId: "dev",
    assigneeId: "u1",
    startDate: "2026-04-26",
    deadline: "2026-08-04",
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

const lateTask = (id: string, areaId: string, parentId: string) =>
  item(id, parentId, "task", { areaId, deadline: "2026-06-01", startDate: null });

const tree = buildItemTree([
  item("e1", null, "epic"),
  item("f1", "e1", "feature"),
  item("s1", "f1", "story"),
  lateTask("t1", "dev", "s1"),
  lateTask("t2", "dev", "s1"),
  lateTask("t3", "dev", "s1"),
  item("t4", "s1", "task", { areaId: "design", status: "concluido", deadline: "2026-06-01", startDate: null }),
  item("e2", null, "epic", { areaId: "design" }),
  item("f2", "e2", "feature", { areaId: "design" }),
  item("s2", "f2", "story", { areaId: "design" }),
  item("t5", "s2", "task", { areaId: "design", status: "concluido", deadline: "2026-06-01", startDate: null }),
  item("t6", "s2", "task", { areaId: "design", status: "concluido", deadline: "2026-08-01", startDate: null }),
]);

const panel = buildHealthPanel({
  projectName: "Aurora",
  projectStart: "2026-04-26",
  projectDeadline: "2026-08-04",
  areas: [
    { id: "dev", name: "Dev" },
    { id: "design", name: "Design" },
  ],
  tree,
  today: "2026-06-15",
});

describe("buildHealthPanel", () => {
  it("judges the project, each epic and each area", () => {
    expect(panel.epics).toHaveLength(2);
    expect(panel.areas.map((a) => a.name)).toEqual(["Dev", "Design"]);
    expect(panel.project.health.color).toBe("red");
  });

  it("shows the late tasks of one area with its name in the reason", () => {
    const dev = panel.areas[0];
    expect(dev.health.color).toBe("red");
    expect(dev.health.summary).toContain("Vermelho: 3 tarefas atrasadas em Dev");
    expect(dev.health.reasons[0].itemIds).toEqual(["t1", "t2", "t3"]);
    expect(dev.itemTitles.t1).toBe("Item t1");
  });

  it("keeps a healthy area green even if the project is red", () => {
    expect(panel.areas[1].health.color).toBe("green");
    expect(panel.epics[1].health.color).toBe("green");
  });
});
