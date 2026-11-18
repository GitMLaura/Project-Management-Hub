// Pure helpers for viewing the scope tree: progress (rule E6) and filters.
import { isItemStatus, type ItemStatus } from "@/lib/item-rules";
import type { ItemNode } from "@/lib/item-tree";

export type Progress = { done: number; total: number; percent: number };

// Progress unit is the task: done tasks / all tasks inside the item (a task counts itself).
export function calcProgress(node: ItemNode): Progress {
  let done = 0;
  let total = 0;
  const visit = (current: ItemNode) => {
    if (current.type === "task") {
      total += 1;
      if (current.status === "concluido") done += 1;
    }
    current.children.forEach(visit);
  };
  visit(node);
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function buildProgressMap(nodes: readonly ItemNode[]): Record<string, Progress> {
  const map: Record<string, Progress> = {};
  const visit = (node: ItemNode) => {
    map[node.id] = calcProgress(node);
    node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return map;
}

export type ScopeFilters = {
  areaId?: string;
  assigneeId?: string;
  status?: ItemStatus;
};

export function hasActiveFilters(filters: ScopeFilters): boolean {
  return Boolean(filters.areaId || filters.assigneeId || filters.status);
}

function firstValue(value: string | string[] | undefined): string | undefined {
  const single = Array.isArray(value) ? value[0] : value;
  return single ? single : undefined;
}

// Reads filters from the URL. Unknown areas, people or statuses are ignored.
export function parseScopeFilters(
  params: Record<string, string | string[] | undefined>,
  valid: { areaIds: readonly string[]; assigneeIds: readonly string[] },
): ScopeFilters {
  const area = firstValue(params.area);
  const assignee = firstValue(params.assignee);
  const status = firstValue(params.status);
  return {
    areaId: area && valid.areaIds.includes(area) ? area : undefined,
    assigneeId: assignee && valid.assigneeIds.includes(assignee) ? assignee : undefined,
    status: isItemStatus(status) ? status : undefined,
  };
}

function matches(node: ItemNode, filters: ScopeFilters): boolean {
  if (node.type === "group") return false; // a group stays only through its tasks
  if (filters.areaId && node.areaId !== filters.areaId) return false;
  if (filters.assigneeId && node.assigneeId !== filters.assigneeId) return false;
  if (filters.status && node.status !== filters.status) return false;
  return true;
}

// Keeps the items that match and the ancestors needed to reach them.
export function filterTree(nodes: readonly ItemNode[], filters: ScopeFilters): ItemNode[] {
  if (!hasActiveFilters(filters)) return [...nodes];
  const result: ItemNode[] = [];
  for (const node of nodes) {
    const children = filterTree(node.children, filters);
    if (matches(node, filters) || children.length > 0) {
      result.push({ ...node, children });
    }
  }
  return result;
}
