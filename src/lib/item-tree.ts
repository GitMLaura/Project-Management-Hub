// Pure helper: turns a flat list of items into a tree (group > task; a task may be loose).
import type { GroupLabel, ItemStatus, ItemType } from "@/lib/item-rules";

export type ItemRecord = {
  id: string;
  parentId: string | null;
  type: ItemType;
  groupLabel: GroupLabel | null; // only groups have one
  title: string;
  description: string;
  // Empty for groups: only tasks have an area, an owner and a deadline.
  areaId: string;
  assigneeId: string;
  startDate: string | null;
  deadline: string;
  status: ItemStatus;
  isCritical: boolean;
  archivedAt: string | null;
};

export type ItemNode = ItemRecord & { children: ItemNode[] };

// Keeps the input order. An item whose parent is missing becomes a root so it never disappears.
export function buildItemTree(items: readonly ItemRecord[]): ItemNode[] {
  const nodes = new Map<string, ItemNode>(
    items.map((item) => [item.id, { ...item, children: [] }]),
  );
  const roots: ItemNode[] = [];
  for (const item of items) {
    const node = nodes.get(item.id);
    if (!node) continue;
    const parent = item.parentId ? nodes.get(item.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

// How many items sit below this one (used to warn before archiving).
export function countDescendants(node: ItemNode): number {
  return node.children.reduce((total, child) => total + 1 + countDescendants(child), 0);
}
