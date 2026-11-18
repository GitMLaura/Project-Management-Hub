import { describe, expect, it } from "vitest";
import type { ItemNode } from "@/lib/item-tree";
import { buildStatusCsv } from "@/lib/status-export";

const task: ItemNode = {
  id: "t", parentId: null, type: "task", title: 'Pagar "com cartão"; Pix', description: "", areaId: "a1",
  assigneeId: "p1", startDate: null, deadline: "2026-11-10", status: "em_andamento", isCritical: false,
  groupLabel: null, archivedAt: null, children: [],
};

describe("buildStatusCsv", () => {
  const csv = buildStatusCsv({
    tree: [{ ...task, id: "g", type: "group", title: "Grupo A", children: [task] }],
    areaNames: { a1: "Dev" },
    assigneeNames: { p1: "Diego" },
    today: "2026-11-16",
  });

  it("starts with a BOM and the header", () => {
    expect(csv.startsWith("﻿Grupo;Tarefa;Área;Responsável;Status;Prazo;Atrasada")).toBe(true);
  });

  it("writes one line per task with labels, dd/mm/yyyy and the late flag", () => {
    const lines = csv.trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe('Grupo A;"Pagar ""com cartão""; Pix";Dev;Diego;Em andamento;10/11/2026;Sim');
  });
});
