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

export type StoryOption = { id: string; label: string; deadline: string };

// Stories that can receive a task: not archived, inside a feature that is not archived.
// The label shows "Feature > Story" so the parent feature is visible (a task's parent is a story).
export function listStoryOptions(items: readonly ItemRecord[]): StoryOption[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const options: StoryOption[] = [];
  for (const story of items) {
    if (story.type !== "story" || story.archivedAt) continue;
    const feature = story.parentId ? byId.get(story.parentId) : undefined;
    if (!feature || feature.type !== "feature" || feature.archivedAt) continue;
    options.push({ id: story.id, label: `${feature.title} > ${story.title}`, deadline: story.deadline });
  }
  return options.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

export type PendingTaskChoice = {
  projectId: string;
  areaId: string; // the area of the summary that listed the pending
  storyId: string;
  assigneeId: string;
  deadline: string; // YYYY-MM-DD
  description: string;
};

// The task keeps the pending text as title. Tasks start as "a fazer" and are not critical.
export function buildTaskInput(choice: PendingTaskChoice): ItemInput {
  return {
    projectId: choice.projectId,
    type: "task",
    parentId: choice.storyId,
    title: choice.description.trim().slice(0, 200),
    description: "Criada a partir de uma pendência de rito.",
    areaId: choice.areaId,
    assigneeId: choice.assigneeId,
    startDate: "",
    deadline: choice.deadline,
    status: "a_fazer",
    isCritical: false,
    storyPersona: "",
    storyAction: "",
    storyBenefit: "",
    acceptanceCriteria: [],
  };
}
