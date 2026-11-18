// CSV of the Status page: one line per task, in the filter that is on screen.
import { ITEM_STATUS_LABELS } from "@/lib/item-rules";
import { isLateTask } from "@/lib/health";
import type { ItemNode } from "@/lib/item-tree";

const HEADER = ["Grupo", "Tarefa", "Área", "Responsável", "Status", "Prazo", "Atrasada"];

function cell(value: string): string {
  return /[;"\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// Every task with the name of its group (empty for a loose task).
function listTasks(nodes: readonly ItemNode[], group = ""): { task: ItemNode; group: string }[] {
  return nodes.flatMap((node) =>
    node.type === "task"
      ? [{ task: node, group }]
      : listTasks(node.children, node.title),
  );
}

// Separator ";" and a BOM so Excel in Brazilian Portuguese opens it with the right accents.
export function buildStatusCsv(input: {
  tree: readonly ItemNode[];
  areaNames: Record<string, string>;
  assigneeNames: Record<string, string>;
  today: string;
}): string {
  const lines = listTasks(input.tree).map(({ task: item, group }) =>
    [
      group,
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
