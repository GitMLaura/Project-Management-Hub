// Numbers for the Status page of a project: totals, per-area cards and
// the list of items that need attention. Pure: the health color still comes from health.ts.
import { expectedProgress, isLateTask } from "@/lib/health";
import type { ItemNode } from "@/lib/item-tree";

export type StatusCounts = {
  lateTasks: number;
  blockedItems: number;
  doneTasks: number;
  totalTasks: number;
  percent: number;
};

export type AttentionItem = {
  id: string;
  title: string;
  reason: "late" | "blocked";
  deadline: string;
  daysOverdue: number; // 0 when the deadline has not passed
  areaId: string;
  assigneeId: string;
};

export type StatusView = {
  totals: StatusCounts;
  expectedPercent: number;
  daysLeft: number; // negative when the deadline has passed
  areaCounts: Record<string, StatusCounts>;
  // Groups (ids) in which each area has at least one task.
  areaGroups: Record<string, string[]>;
  attention: AttentionItem[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toDay(iso: string): number {
  return Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / DAY_MS);
}

// Groups only gather tasks, so every number below looks at tasks.
function flattenTasks(nodes: readonly ItemNode[]): ItemNode[] {
  return nodes.flatMap((node) => [
    ...(node.type === "task" ? [node] : []),
    ...flattenTasks(node.children),
  ]);
}

function countItems(items: readonly ItemNode[], today: string): StatusCounts {
  const tasks = items;
  const doneTasks = tasks.filter((item) => item.status === "concluido").length;
  return {
    lateTasks: items.filter((item) => isLateTask(item, today)).length,
    blockedItems: items.filter((item) => item.status === "bloqueado").length,
    doneTasks,
    totalTasks: tasks.length,
    percent: tasks.length === 0 ? 0 : Math.round((doneTasks / tasks.length) * 100),
  };
}

export function buildStatusView(input: {
  tree: readonly ItemNode[]; // active items only
  areaIds: readonly string[];
  projectStart: string;
  projectDeadline: string;
  today: string;
}): StatusView {
  const { tree, today } = input;
  const all = flattenTasks(tree);

  const areaCounts: StatusView["areaCounts"] = {};
  const areaGroups: StatusView["areaGroups"] = {};
  for (const areaId of input.areaIds) {
    areaCounts[areaId] = countItems(
      all.filter((item) => item.areaId === areaId),
      today,
    );
    areaGroups[areaId] = tree
      .filter((node) => node.type === "group")
      .filter((group) => flattenTasks([group]).some((item) => item.areaId === areaId))
      .map((group) => group.id);
  }

  const attention: AttentionItem[] = all
    .filter((item) => isLateTask(item, today) || item.status === "bloqueado")
    .map((item): AttentionItem => ({
      id: item.id,
      title: item.title,
      reason: item.status === "bloqueado" ? "blocked" : "late",
      deadline: item.deadline,
      daysOverdue: Math.max(0, toDay(today) - toDay(item.deadline)),
      areaId: item.areaId,
      assigneeId: item.assigneeId,
    }))
    // Blocked items first would hide the late ones: most overdue first, then blocked by deadline.
    .sort((a, b) => b.daysOverdue - a.daysOverdue || a.deadline.localeCompare(b.deadline));

  return {
    totals: countItems(all, today),
    expectedPercent: Math.round(
      expectedProgress(today, input.projectStart, input.projectDeadline),
    ),
    daysLeft: toDay(input.projectDeadline) - toDay(today),
    areaCounts,
    areaGroups,
    attention,
  };
}
