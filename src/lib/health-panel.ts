// Builds the data of the health panel: the project and each area.
import { calculateHealth, type HealthItem, type HealthResult } from "@/lib/health";
import type { ItemNode, ItemRecord } from "@/lib/item-tree";

export type HealthEntry = {
  id: string;
  name: string;
  health: HealthResult;
  // Titles of the items behind the reasons, by id (for links).
  itemTitles: Record<string, string>;
};

export type HealthPanel = {
  project: HealthEntry;
  areas: HealthEntry[];
};

type PanelInput = {
  projectName: string;
  projectStart: string;
  projectDeadline: string;
  areas: readonly { id: string; name: string }[];
  tree: readonly ItemNode[]; // active items only
  today: string;
};

function toHealthItem(item: ItemRecord): HealthItem {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    status: item.status,
    deadline: item.deadline,
    isCritical: item.isCritical,
    assigneeId: item.assigneeId || null,
  };
}

function flatten(nodes: readonly ItemNode[]): ItemNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

function entry(
  id: string,
  name: string,
  records: readonly ItemRecord[],
  period: { start: string; deadline: string },
  today: string,
  scopeLabel?: string,
): HealthEntry {
  const health = calculateHealth({
    items: records.map(toHealthItem),
    today,
    periodStart: period.start,
    periodDeadline: period.deadline,
    scopeLabel,
  });
  const itemTitles: Record<string, string> = {};
  for (const reason of health.reasons) {
    for (const itemId of reason.itemIds) {
      const found = records.find((record) => record.id === itemId);
      if (found) itemTitles[itemId] = found.title;
    }
  }
  return { id, name, health, itemTitles };
}

export function buildHealthPanel(input: PanelInput): HealthPanel {
  const { tree, today } = input;
  // Health looks at tasks only: groups just gather them.
  const all = flatten(tree).filter((item) => item.type === "task");
  const projectPeriod = { start: input.projectStart, deadline: input.projectDeadline };

  return {
    project: entry("project", input.projectName, all, projectPeriod, today),
    // For an area the period is the project's (PRD section 4).
    areas: input.areas.map((area) =>
      entry(
        area.id,
        area.name,
        all.filter((item) => item.areaId === area.id),
        projectPeriod,
        today,
        `em ${area.name}`,
      ),
    ),
  };
}
