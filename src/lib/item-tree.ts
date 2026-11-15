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
