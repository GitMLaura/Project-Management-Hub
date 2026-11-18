import { describe, expect, it } from "vitest";
import type { ItemRecord } from "./item-tree";
import { buildTaskInput, listGroupOptions, matchAssignee } from "./pending-task";
import { validateItem } from "./item-rules";

function item(partial: Partial<ItemRecord> & Pick<ItemRecord, "id" | "type" | "title">): ItemRecord {
  return {
    parentId: null,
    description: "",
    areaId: "a",
    assigneeId: "p",
    startDate: null,
    deadline: "2026-12-31",
    status: "a_fazer",
    isCritical: false,
    groupLabel: null,
    archivedAt: null,
    ...partial,
  };
}

describe("matchAssignee", () => {
  const people = [
    { id: "1", name: "Camila Tavares" },
    { id: "2", name: "João Pereira" },
  ];
  it("matches ignoring case and accents", () => {
    expect(matchAssignee("camila tavares", people)).toBe("1");
    expect(matchAssignee("Joao Pereira", people)).toBe("2");
  });
  it("returns empty when there is no match or no suggestion", () => {
    expect(matchAssignee("Fulano", people)).toBe("");
    expect(matchAssignee(null, people)).toBe("");
  });
});

describe("listGroupOptions", () => {
  const items = [
    item({ id: "g1", type: "group", title: "Pedido", groupLabel: "feature" }),
    item({ id: "g2", type: "group", title: "Login", groupLabel: "epic" }),
    item({ id: "g3", type: "group", title: "Antigo", groupLabel: "epic", archivedAt: "2026-11-01" }),
    item({ id: "t1", type: "task", title: "Tarefa", parentId: "g1" }),
  ];
  it("lists only live groups, sorted by name", () => {
    expect(listGroupOptions(items)).toEqual([
      { id: "g2", label: "Login" },
      { id: "g1", label: "Pedido" },
    ]);
  });
});

describe("buildTaskInput", () => {
  const choice = {
    projectId: "p1",
    areaId: "a1",
    groupId: "g1",
    assigneeId: "u1",
    deadline: "2026-12-01",
    description: "  Revisar o texto do e-mail  ",
  };
  it("builds a valid task inside the chosen group", () => {
    const input = buildTaskInput(choice);
    expect(input).toMatchObject({ groupId: "g1", title: "Revisar o texto do e-mail", status: "a_fazer" });
    expect(validateItem(input, "2026-12-31")).toEqual({ ok: true });
  });
  it("builds a loose task when no group is chosen", () => {
    expect(buildTaskInput({ ...choice, groupId: "" }).groupId).toBeNull();
  });
  it("respects the project deadline", () => {
    const result = validateItem(buildTaskInput({ ...choice, deadline: "2027-01-10" }), "2026-12-31");
    expect(result.ok).toBe(false);
  });
  it("requires an assignee", () => {
    expect(validateItem(buildTaskInput({ ...choice, assigneeId: "" })).ok).toBe(false);
  });
});
