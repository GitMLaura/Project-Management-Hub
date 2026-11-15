import { describe, expect, it } from "vitest";
import {
  isProjectInput,
  normalizeProjectInput,
  validateProject,
  type ProjectInput,
} from "@/lib/project-validation";

function validInput(): ProjectInput {
  return {
    name: "Projeto Aurora",
    objective: "Entregar o app de delivery",
    startDate: "2026-01-05",
    deadline: "2026-06-30",
    areas: ["Design", "Desenvolvimento"],
    participants: [
      { name: "Helena Duarte", area: "Design", isOwner: true, isAreaLeader: false },
      { name: "Rafael Moura", area: "Design", isOwner: false, isAreaLeader: true },
      { name: "Camila Tavares", area: "Desenvolvimento", isOwner: false, isAreaLeader: true },
    ],
  };
}

function errorFields(input: ProjectInput): string[] {
  const result = validateProject(input);
  return result.ok ? [] : result.errors.map((error) => error.field);
}

describe("validateProject", () => {
  it("accepts a valid project", () => {
    expect(validateProject(validInput())).toEqual({ ok: true });
  });

  it("requires name and objective", () => {
    const input = { ...validInput(), name: "  ", objective: "" };
    expect(errorFields(input)).toEqual(["name", "objective"]);
  });

  it("requires valid dates and a deadline not before the start", () => {
    expect(errorFields({ ...validInput(), startDate: "" })).toContain("startDate");
    expect(errorFields({ ...validInput(), deadline: "2026-02-30" })).toContain("deadline");
    expect(errorFields({ ...validInput(), deadline: "2026-01-04" })).toContain("deadline");
  });

  it("accepts a deadline equal to the start date", () => {
    expect(validateProject({ ...validInput(), deadline: "2026-01-05" }).ok).toBe(true);
  });

  it("requires at least one area, without empty or duplicated names", () => {
    expect(errorFields({ ...validInput(), areas: [], participants: [] })).toContain("areas");
    expect(errorFields({ ...validInput(), areas: ["Design", " "] })).toContain("areas");
    expect(errorFields({ ...validInput(), areas: ["Design", "design "] })).toContain("areas");
  });

  it("requires at least one participant", () => {
    expect(errorFields({ ...validInput(), participants: [] })).toContain("participants");
  });

  it("requires each participant to belong to an existing area", () => {
    const input = validInput();
    input.participants[1].area = "QA";
    expect(errorFields(input)).toContain("participants");
  });

  it("requires exactly one owner", () => {
    const none = validInput();
    none.participants[0].isOwner = false;
    expect(errorFields(none)).toContain("participants");

    const two = validInput();
    two.participants[1].isOwner = true;
    expect(errorFields(two)).toContain("participants");
  });

  it("allows only one leader per area", () => {
    const input = validInput();
    input.participants[0].isAreaLeader = true; // Design now has two leaders
    expect(errorFields(input)).toContain("participants");
  });

  it("allows an area without a leader", () => {
    const input = validInput();
    input.participants[2].isAreaLeader = false;
    expect(validateProject(input).ok).toBe(true);
  });

  it("rejects duplicated participant names", () => {
    const input = validInput();
    input.participants[1].name = "helena duarte";
    expect(errorFields(input)).toContain("participants");
  });
});

describe("normalizeProjectInput", () => {
  it("trims all text fields", () => {
    const input = validInput();
    input.name = "  Aurora  ";
    input.areas = [" Design "];
    input.participants = [
      { name: " Ana ", area: " Design ", isOwner: true, isAreaLeader: false },
    ];
    const normalized = normalizeProjectInput(input);
    expect(normalized.name).toBe("Aurora");
    expect(normalized.areas).toEqual(["Design"]);
    expect(normalized.participants[0]).toMatchObject({ name: "Ana", area: "Design" });
  });
});

describe("isProjectInput", () => {
  it("accepts a well-formed object", () => {
    expect(isProjectInput(validInput())).toBe(true);
  });

  it("rejects wrong shapes", () => {
    expect(isProjectInput(null)).toBe(false);
    expect(isProjectInput({})).toBe(false);
    expect(isProjectInput({ ...validInput(), areas: "Design" })).toBe(false);
    expect(
      isProjectInput({ ...validInput(), participants: [{ name: "x" }] }),
    ).toBe(false);
  });
});
