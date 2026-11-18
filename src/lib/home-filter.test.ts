import { describe, expect, it } from "vitest";
import { filterHomeProjects, parseHealthFilter, projectsOfPerson } from "@/lib/home-filter";

const projects = [
  { name: "Hits", objective: "App de delivery", health: "red" as const, people: ["Helena Duarte", "Bruno Siqueira"] },
  { name: "Vibe", objective: "Música ao vivo", health: "green" as const, people: ["Camila Tavares"] },
];

describe("home filters", () => {
  it("keeps only the projects the person takes part in", () => {
    expect(projectsOfPerson(projects, "helena duarte").map((p) => p.name)).toEqual(["Hits"]);
    expect(projectsOfPerson(projects, "Ninguém")).toEqual([]);
  });

  it("filters by status, person and search text (ignoring accents)", () => {
    expect(filterHomeProjects(projects, { status: "green" }).map((p) => p.name)).toEqual(["Vibe"]);
    expect(filterHomeProjects(projects, { person: "Bruno Siqueira" }).map((p) => p.name)).toEqual(["Hits"]);
    expect(filterHomeProjects(projects, { query: "musica" }).map((p) => p.name)).toEqual(["Vibe"]);
    expect(filterHomeProjects(projects, {})).toHaveLength(2);
  });

  it("ignores an unknown status value", () => {
    expect(parseHealthFilter("blue")).toBeUndefined();
    expect(parseHealthFilter("red")).toBe("red");
  });
});
