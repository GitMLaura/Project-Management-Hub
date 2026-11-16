// CSV of the Status page: one line per item, in the filter that is on screen.
import { ITEM_STATUS_LABELS, ITEM_TYPE_LABELS } from "@/lib/item-rules";
import { isLateTask } from "@/lib/health";
import type { ItemNode } from "@/lib/item-tree";

const HEADER = ["Tipo", "Título", "Área", "Responsável", "Status", "Prazo", "Atrasada"];

function cell(value: string): string {
  return /[;"\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function flatten(nodes: readonly ItemNode[]): ItemNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

// Separator ";" and a BOM so Excel in Brazilian Portuguese opens it with the right accents.
export function buildStatusCsv(input: {
  tree: readonly ItemNode[];
  areaNames: Record<string, string>;
  assigneeNames: Record<string, string>;
  today: string;
}): string {
  const lines = flatten(input.tree).map((item) =>
    [
      ITEM_TYPE_LABELS[item.type],
      item.title,
      input.areaNames[item.areaId] ?? "",
      input.assigneeNames[item.assigneeId] ?? "",
      ITEM_STATUS_LABELS[item.status],
      item.deadline.split("-").reverse().join("/"),
      isLateTask(item, input.today) ? "Sim" : "Não",
    ]
      .map(cell)
      .join(";"),
  );
  return `﻿${[HEADER.join(";"), ...lines].join("\r\n")}\r\n`;
}
