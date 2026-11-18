// Which projects the home page lists: the ones the active person takes part in, narrowed by
// the status, person and search filters. Pure: no database here.
import type { HealthColor } from "@/lib/health";
import { normalizeName } from "@/lib/project-validation";

export type HomeProject = {
  name: string;
  objective: string;
  health: HealthColor;
  people: string[]; // names of everyone who takes part in the project
};

export type HomeFilters = {
  status?: HealthColor;
  person?: string; // a person's name
  query?: string;
};

export function parseHealthFilter(raw: string | undefined): HealthColor | undefined {
  return raw === "green" || raw === "yellow" || raw === "red" ? raw : undefined;
}

function includesPerson(people: readonly string[], name: string): boolean {
  const wanted = normalizeName(name);
  return people.some((person) => normalizeName(person) === wanted);
}

// The "projects I take part in" rule: the demo profile's name must be among the participants.
export function projectsOfPerson<T extends HomeProject>(projects: readonly T[], person: string): T[] {
  return projects.filter((project) => includesPerson(project.people, person));
}

export function filterHomeProjects<T extends HomeProject>(
  projects: readonly T[],
  filters: HomeFilters,
): T[] {
  const query = normalizeName(filters.query ?? "");
  return projects.filter((project) => {
    if (filters.status && project.health !== filters.status) return false;
    if (filters.person && !includesPerson(project.people, filters.person)) return false;
    if (query && !normalizeName(`${project.name} ${project.objective}`).includes(query)) return false;
    return true;
  });
}
