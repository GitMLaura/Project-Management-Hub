// Numbers for the Status page of a project: totals, per-area and per-epic cards and
// the list of items that need attention. Pure: the health color still comes from health.ts.
import { expectedProgress, isLateTask } from "@/lib/health";
import { ITEM_STATUSES, type ItemStatus } from "@/lib/item-rules";
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

export type BoardTask = {
  id: string;
  title: string;
  areaId: string;
  assigneeId: string;
  deadline: string;
  late: boolean;
};

export type StatusView = {
  // Tasks (not stories or epics) grouped by status: soonest deadline first, finished ones last-first.
  board: Record<ItemStatus, BoardTask[]>;
  totals: StatusCounts;
  expectedPercent: number;
  daysLeft: number; // negative when the deadline has passed
  areaCounts: Record<string, StatusCounts>;
  // Epics (ids) in which each area has at least one item.
  areaEpics: Record<string, string[]>;
  epicCounts: Record<string, StatusCounts>;
  // Areas that have at least one item inside each epic.
  epicAreas: Record<string, string[]>;
  attention: AttentionItem[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toDay(iso: string): number {
  return Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / DAY_MS);
}

function flatten(nodes: readonly ItemNode[]): ItemNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

function countItems(items: readonly ItemNode[], today: string): StatusCounts {
  const tasks = items.filter((item) => item.type === "task");
  const doneTasks = tasks.filter((item) => item.status === "concluido").length;
  return {
    lateTasks: items.filter((item) => isLateTask(item, today)).length,
    blockedItems: items.filter((item) => item.status === "bloqueado").length,
    doneTasks,
    totalTasks: tasks.length,
    percent: tasks.length === 0 ? 0 : Math.round((doneTasks / tasks.length) * 100),
  };
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function buildStatusView(input: {
  tree: readonly ItemNode[]; // active items only
  areaIds: readonly string[];
  projectStart: string;
  projectDeadline: string;
  today: string;
}): StatusView {
  const { tree, today } = input;
  const all = flatten(tree);

  const areaCounts: StatusView["areaCounts"] = {};
  const areaEpics: StatusView["areaEpics"] = {};
  for (const areaId of input.areaIds) {
    const mine = all.filter((item) => item.areaId === areaId);
    areaCounts[areaId] = countItems(mine, today);
    areaEpics[areaId] = tree
      .filter((epic) => flatten([epic]).some((item) => item.areaId === areaId))
      .map((epic) => epic.id);
  }

  const epicCounts: StatusView["epicCounts"] = {};
  const epicAreas: StatusView["epicAreas"] = {};
  for (const epic of tree) {
    const inside = flatten([epic]);
    epicCounts[epic.id] = countItems(inside, today);
    epicAreas[epic.id] = unique(inside.map((item) => item.areaId));
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

  const board = Object.fromEntries(ITEM_STATUSES.map((status) => [status, [] as BoardTask[]])) as Record<
    ItemStatus,
    BoardTask[]
  >;
  for (const item of all.filter((node) => node.type === "task")) {
    board[item.status].push({
      id: item.id,
      title: item.title,
      areaId: item.areaId,
      assigneeId: item.assigneeId,
      deadline: item.deadline,
      late: isLateTask(item, today),
    });
  }
  for (const status of ITEM_STATUSES) {
    board[status].sort((a, b) =>
      status === "concluido" ? b.deadline.localeCompare(a.deadline) : a.deadline.localeCompare(b.deadline),
    );
  }

  return {
    board,
    totals: countItems(all, today),
    expectedPercent: Math.round(
      expectedProgress(today, input.projectStart, input.projectDeadline),
    ),
    daysLeft: toDay(input.projectDeadline) - toDay(today),
    areaCounts,
    areaEpics,
    epicCounts,
    epicAreas,
    attention,
  };
}
