// Pure helper: turns a flat list of items into a tree (epic > feature > story > task).
import type { ItemStatus, ItemType } from "@/lib/item-rules";

export type ItemRecord = {
  id: string;
  parentId: string | null;
  type: ItemType;
  title: string;
  description: string;
  areaId: string;
  assigneeId: string;
  startDate: string | null;
  deadline: string;
  status: ItemStatus;
  isCritical: boolean;
  storyPersona: string | null;
  storyAction: string | null;
  storyBenefit: string | null;
  acceptanceCriteria: string[];
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

// Rule E5: anything that is not a task and has no (active) children needs more detail.
export function isScopeIncomplete(node: ItemNode): boolean {
  return node.type !== "task" && node.children.length === 0;
}

export function countIncompleteScope(nodes: readonly ItemNode[]): number {
  return nodes.reduce(
    (total, node) => total + (isScopeIncomplete(node) ? 1 : 0) + countIncompleteScope(node.children),
    0,
  );
}
