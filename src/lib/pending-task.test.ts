import { describe, expect, it } from "vitest";
import type { ItemRecord } from "./item-tree";
import { buildTaskInput, listStoryOptions, matchAssignee } from "./pending-task";
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
    storyPersona: null,
    storyAction: null,
    storyBenefit: null,
    acceptanceCriteria: [],
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

describe("listStoryOptions", () => {
  const items = [
    item({ id: "e", type: "epic", title: "Épico" }),
    item({ id: "f1", type: "feature", title: "Login", parentId: "e" }),
    item({ id: "f2", type: "feature", title: "Pedido", parentId: "e", archivedAt: "2026-11-01" }),
    item({ id: "s1", type: "story", title: "Entrar", parentId: "f1" }),
    item({ id: "s2", type: "story", title: "Arquivada", parentId: "f1", archivedAt: "2026-11-01" }),
    item({ id: "s3", type: "story", title: "Em feature arquivada", parentId: "f2" }),
    item({ id: "t1", type: "task", title: "Tarefa", parentId: "s1" }),
  ];
  it("lists only live stories inside live features, with the feature in the label", () => {
    expect(listStoryOptions(items)).toEqual([{ id: "s1", label: "Login > Entrar", deadline: "2026-12-31" }]);
  });
});

describe("buildTaskInput", () => {
  const choice = {
    projectId: "p1",
    areaId: "a1",
    storyId: "s1",
    assigneeId: "u1",
    deadline: "2026-12-01",
    description: "  Revisar o texto do e-mail  ",
  };
  it("builds a valid task under the chosen story", () => {
    const input = buildTaskInput(choice);
    expect(input).toMatchObject({ type: "task", parentId: "s1", title: "Revisar o texto do e-mail", status: "a_fazer" });
    expect(validateItem(input, { parentDeadline: "2026-12-31" })).toEqual({ ok: true });
  });
  it("respects the deadline of the parent story (rule E2)", () => {
    const result = validateItem(buildTaskInput({ ...choice, deadline: "2027-01-10" }), { parentDeadline: "2026-12-31" });
    expect(result.ok).toBe(false);
  });
  it("requires an assignee", () => {
    expect(validateItem(buildTaskInput({ ...choice, assigneeId: "" })).ok).toBe(false);
  });
});
