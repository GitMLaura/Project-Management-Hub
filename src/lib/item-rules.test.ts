import { describe, expect, it } from "vitest";
import { DEMO_PROFILES, type DemoProfile } from "@/lib/demo-profiles";
import {
  canCreateItemInArea,
  canManageScope,
  childTypeOf,
  findLeaderAreaId,
  isItemInput,
  parentTypeOf,
  validateItem,
  type ItemInput,
} from "@/lib/item-rules";

function profile(id: string): DemoProfile {
  const found = DEMO_PROFILES.find((p) => p.id === id);
  if (!found) throw new Error(`unknown profile ${id}`);
  return found;
}

function validTask(): ItemInput {
  return {
    projectId: "p1",
    type: "task",
    parentId: "story-1",
    title: "Criar tela de login",
    description: "",
    areaId: "a1",
    assigneeId: "u1",
    startDate: "",
    deadline: "2026-03-10",
    status: "a_fazer",
    isCritical: false,
    storyPersona: "",
    storyAction: "",
    storyBenefit: "",
    acceptanceCriteria: [],
  };
}

function validStory(): ItemInput {
  return {
    ...validTask(),
    type: "story",
    parentId: "feature-1",
    startDate: "2026-03-01",
    storyPersona: "cliente",
    storyAction: "recuperar minha senha",
    storyBenefit: "voltar a pedir comida",
    acceptanceCriteria: ["Recebo um e-mail com o link"],
  };
}

function errorFields(input: ItemInput): string[] {
  const result = validateItem(input);
  return result.ok ? [] : result.errors.map((error) => error.field);
}

describe("hierarchy helpers", () => {
  it("maps each type to its child and parent type", () => {
    expect(childTypeOf("epic")).toBe("feature");
    expect(childTypeOf("feature")).toBe("story");
    expect(childTypeOf("story")).toBe("task");
    expect(childTypeOf("task")).toBeNull();
    expect(parentTypeOf("epic")).toBeNull();
    expect(parentTypeOf("task")).toBe("story");
  });
});

describe("validateItem", () => {
  it("accepts a valid task without start date", () => {
    expect(validateItem(validTask())).toEqual({ ok: true });
  });

  it("accepts a valid story", () => {
    expect(validateItem(validStory())).toEqual({ ok: true });
  });

  it("requires title, area and assignee", () => {
    const input = { ...validTask(), title: " ", areaId: "", assigneeId: "" };
    expect(errorFields(input)).toEqual(["title", "areaId", "assigneeId"]);
  });

  it("requires a parent for everything except epics (E1)", () => {
    expect(errorFields({ ...validTask(), parentId: null })).toContain("parentId");
    const epic: ItemInput = { ...validTask(), type: "epic", parentId: null, startDate: "2026-03-01" };
    expect(validateItem(epic).ok).toBe(true);
    expect(errorFields({ ...epic, parentId: "x" })).toContain("parentId");
  });

  it("requires a start date for non-task items", () => {
    expect(errorFields({ ...validStory(), startDate: "" })).toContain("startDate");
  });

  it("validates optional task start date and the deadline order", () => {
    expect(errorFields({ ...validTask(), startDate: "2026-13-01" })).toContain("startDate");
    expect(errorFields({ ...validTask(), startDate: "2026-03-11" })).toContain("deadline");
    expect(validateItem({ ...validTask(), startDate: "2026-03-10" }).ok).toBe(true);
  });

  it("requires a valid deadline", () => {
    expect(errorFields({ ...validTask(), deadline: "" })).toContain("deadline");
  });

  it("requires the three story fields", () => {
    expect(errorFields({ ...validStory(), storyBenefit: "  " })).toContain("story");
    expect(errorFields({ ...validStory(), storyPersona: "" })).toContain("story");
  });
});

describe("isItemInput", () => {
  it("accepts a well-formed object and rejects bad shapes", () => {
    expect(isItemInput(validTask())).toBe(true);
    expect(isItemInput(null)).toBe(false);
    expect(isItemInput({ ...validTask(), type: "bug" })).toBe(false);
    expect(isItemInput({ ...validTask(), status: "feito" })).toBe(false);
    expect(isItemInput({ ...validTask(), parentId: 3 })).toBe(false);
    expect(isItemInput({ ...validTask(), acceptanceCriteria: [1] })).toBe(false);
  });
});

describe("permissions (interface only)", () => {
  it("owner creates in any area", () => {
    expect(canCreateItemInArea(profile("owner"), "QA")).toBe(true);
  });

  it("area leader creates only in the own area, ignoring case and accents", () => {
    expect(canCreateItemInArea(profile("design-lead"), "design")).toBe(true);
    expect(canCreateItemInArea(profile("design-lead"), "Desenvolvimento")).toBe(false);
    expect(canCreateItemInArea(profile("dev-lead"), "DESENVOLVIMENTO")).toBe(true);
  });

  it("participant cannot create", () => {
    expect(canCreateItemInArea(profile("participant"), "QA")).toBe(false);
  });

  it("canManageScope allows owner and area leaders only", () => {
    const allowed = DEMO_PROFILES.filter(canManageScope).map((p) => p.id);
    expect(allowed).toEqual(["owner", "design-lead", "dev-lead"]);
  });

  it("finds the leader's area in the project, or null", () => {
    const areas = [
      { id: "a1", name: "Design" },
      { id: "a2", name: "Comercial" },
    ];
    expect(findLeaderAreaId(profile("design-lead"), areas)).toBe("a1");
    expect(findLeaderAreaId(profile("dev-lead"), areas)).toBeNull();
    expect(findLeaderAreaId(profile("owner"), areas)).toBeNull();
  });
});
