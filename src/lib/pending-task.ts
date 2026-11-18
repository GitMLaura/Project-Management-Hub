// Pure helpers to turn a ritual pending into a task (story H4.3.1). No database here.
import type { ItemInput } from "@/lib/item-rules";
import type { ItemRecord } from "@/lib/item-tree";
import { normalizeName } from "@/lib/project-validation";

export type PersonOption = { id: string; name: string };

// Finds the participant that the summary suggested (ignores case and accents).
// Returns the id, or "" when nobody matches so the person must choose.
export function matchAssignee(suggested: string | null, people: readonly PersonOption[]): string {
  if (!suggested) return "";
  const wanted = normalizeName(suggested);
  return people.find((person) => normalizeName(person.name) === wanted)?.id ?? "";
}

export type GroupOption = { id: string; label: string };

// Groups that can receive a task: the ones that are not archived.
export function listGroupOptions(items: readonly ItemRecord[]): GroupOption[] {
  return items
    .filter((item) => item.type === "group" && !item.archivedAt)
    .map((group) => ({ id: group.id, label: group.title }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

export type PendingTaskChoice = {
  projectId: string;
  areaId: string; // the area of the summary that listed the pending
  groupId: string; // "" = a loose task, outside any group
  assigneeId: string;
  deadline: string; // YYYY-MM-DD
  description: string;
};

// The task keeps the pending text as title. Tasks start as "a fazer" and are not critical.
export function buildTaskInput(choice: PendingTaskChoice): ItemInput {
  return {
    projectId: choice.projectId,
    groupId: choice.groupId || null,
    title: choice.description.trim().slice(0, 200),
    description: "Criada a partir de uma pendência de rito.",
    areaId: choice.areaId,
    assigneeId: choice.assigneeId,
    startDate: "",
    deadline: choice.deadline,
    status: "a_fazer",
    isCritical: false,
  };
}
