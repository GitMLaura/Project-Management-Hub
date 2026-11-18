import { describe, expect, it } from "vitest";
import { DEMO_PROFILES, type DemoProfile } from "@/lib/demo-profiles";
import {
  canCreateItemInArea,
  deadlineLimitError,
  canManageScope,
  canUpdateTaskStatus,
  findLeaderAreaId,
  isGroupInput,
  isItemInput,
  validateGroup,
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
    groupId: "group-1",
    title: "Criar tela de login",
    description: "",
    areaId: "a1",
    assigneeId: "u1",
    startDate: "",
    deadline: "2026-03-10",
    status: "a_fazer",
    isCritical: false,
  };
}

function errorFields(input: ItemInput): string[] {
  const result = validateItem(input);
  return result.ok ? [] : result.errors.map((error) => error.field);
}

describe("validateItem", () => {
  it("accepts a valid task without start date, inside a group or loose", () => {
    expect(validateItem(validTask())).toEqual({ ok: true });
    expect(validateItem({ ...validTask(), groupId: null })).toEqual({ ok: true });
  });

  it("requires title, area and assignee", () => {
    const input = { ...validTask(), title: " ", areaId: "", assigneeId: "" };
    expect(errorFields(input)).toEqual(["title", "areaId", "assigneeId"]);
  });

  it("validates optional start date and the deadline order", () => {
    expect(errorFields({ ...validTask(), startDate: "2026-13-01" })).toContain("startDate");
    expect(errorFields({ ...validTask(), startDate: "2026-03-11" })).toContain("deadline");
    expect(validateItem({ ...validTask(), startDate: "2026-03-10" }).ok).toBe(true);
  });

  it("requires a valid deadline", () => {
    expect(errorFields({ ...validTask(), deadline: "" })).toContain("deadline");
  });
});

describe("isItemInput", () => {
  it("accepts a well-formed object and rejects bad shapes", () => {
    expect(isItemInput(validTask())).toBe(true);
    expect(isItemInput({ ...validTask(), groupId: null })).toBe(true);
    expect(isItemInput(null)).toBe(false);
    expect(isItemInput({ ...validTask(), status: "feito" })).toBe(false);
    expect(isItemInput({ ...validTask(), groupId: 3 })).toBe(false);
  });
});

describe("groups", () => {
  const group = { projectId: "p1", title: "Login", label: "feature" as const, taskIds: ["t1"] };

  it("accepts a named group with tasks and rejects bad shapes", () => {
    expect(isGroupInput(group)).toBe(true);
    expect(isGroupInput({ ...group, label: "story" })).toBe(false);
    expect(isGroupInput({ ...group, taskIds: [1] })).toBe(false);
    expect(validateGroup(group)).toBeNull();
  });

  it("needs a name and at least one task", () => {
    expect(validateGroup({ ...group, title: "  " })).toContain("nome do grupo");
    expect(validateGroup({ ...group, taskIds: [] })).toContain("pelo menos uma tarefa");
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

describe("deadline limit", () => {
  it("blocks a task deadline after the project deadline", () => {
    const result = validateItem({ ...validTask(), deadline: "2026-03-11" }, "2026-03-10");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { field: "deadline", message: "O prazo não pode ultrapassar o prazo do projeto (10/03/2026)." },
      ]);
    }
  });

  it("accepts a deadline equal to or before the project deadline", () => {
    expect(validateItem(validTask(), "2026-03-10").ok).toBe(true);
    expect(validateItem(validTask(), "2026-04-01").ok).toBe(true);
  });

  it("ignores the limit when there is none or the deadline is not valid", () => {
    expect(deadlineLimitError("2027-01-01", null)).toBeNull();
    expect(deadlineLimitError("", "2026-06-30")).toBeNull();
  });
});

describe("canUpdateTaskStatus", () => {
  const designTask = { areaName: "Design", assigneeName: "Ana Lima" };

  it("lets the owner update any task", () => {
    expect(canUpdateTaskStatus(profile("owner"), designTask)).toBe(true);
  });

  it("lets an area leader update tasks of their area only", () => {
    expect(canUpdateTaskStatus(profile("design-lead"), designTask)).toBe(true);
    expect(canUpdateTaskStatus(profile("dev-lead"), designTask)).toBe(false);
  });

  it("lets anyone update a task they are responsible for", () => {
    const own = { areaName: "Design", assigneeName: "bruno  siqueira" };
    expect(canUpdateTaskStatus(profile("participant"), own)).toBe(true);
    expect(canUpdateTaskStatus(profile("dev-lead"), { areaName: "Design", assigneeName: "Camila Tavares" })).toBe(true);
  });

  it("blocks a participant on someone else's task", () => {
    expect(canUpdateTaskStatus(profile("participant"), designTask)).toBe(false);
  });
});
