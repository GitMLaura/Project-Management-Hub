// Pure rules for scope items (story H1.2.1). No database here.
import type { DemoProfile } from "@/lib/demo-profiles";
import { formatDate } from "@/lib/format";
import { normalizeName } from "@/lib/project-validation";

// The scope is made of tasks. A group is a named set of tasks, labelled "Funcionalidade"
// or "Épico" by whoever creates it (a task may also stay loose, outside any group).
export type ItemType = "group" | "task";
export type GroupLabel = "epic" | "feature";
export type ItemStatus = "a_fazer" | "em_andamento" | "bloqueado" | "concluido";

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  group: "Grupo",
  task: "Tarefa",
};

export const GROUP_LABELS: Record<GroupLabel, string> = {
  epic: "Épico",
  feature: "Funcionalidade",
};

export const ITEM_STATUSES: readonly ItemStatus[] = [
  "a_fazer",
  "em_andamento",
  "bloqueado",
  "concluido",
];

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  bloqueado: "Bloqueado",
  concluido: "Concluído",
};

export function isItemType(value: unknown): value is ItemType {
  return value === "group" || value === "task";
}

export function isGroupLabel(value: unknown): value is GroupLabel {
  return value === "epic" || value === "feature";
}

export function isItemStatus(value: unknown): value is ItemStatus {
  return ITEM_STATUSES.some((status) => status === value);
}

// A task, as it arrives from the form.
export type ItemInput = {
  projectId: string;
  groupId: string | null; // null = a loose task
  title: string;
  description: string;
  areaId: string;
  assigneeId: string;
  startDate: string; // YYYY-MM-DD, may be empty
  deadline: string; // YYYY-MM-DD
  status: ItemStatus;
  isCritical: boolean;
};

export type ItemField =
  | "title"
  | "areaId"
  | "assigneeId"
  | "startDate"
  | "deadline"
  | "groupId"
  | "status";

export type ItemFieldError = { field: ItemField; message: string };

export type ItemValidationResult =
  | { ok: true }
  | { ok: false; errors: ItemFieldError[] };

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function normalizeItemInput(input: ItemInput): ItemInput {
  return {
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    startDate: input.startDate.trim(),
    deadline: input.deadline.trim(),
  };
}

// Runtime check for data that arrives from the browser (never trust its shape).
export function isItemInput(value: unknown): value is ItemInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.projectId === "string" &&
    (v.groupId === null || typeof v.groupId === "string") &&
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    typeof v.areaId === "string" &&
    typeof v.assigneeId === "string" &&
    typeof v.startDate === "string" &&
    typeof v.deadline === "string" &&
    isItemStatus(v.status) &&
    typeof v.isCritical === "boolean"
  );
}

// A group, as it arrives from the "Agrupar" button.
export type GroupInput = {
  projectId: string;
  title: string;
  label: GroupLabel;
  taskIds: string[];
};

export function isGroupInput(value: unknown): value is GroupInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.projectId === "string" &&
    typeof v.title === "string" &&
    isGroupLabel(v.label) &&
    Array.isArray(v.taskIds) &&
    v.taskIds.every((id) => typeof id === "string")
  );
}

// Returns the message to show, or null when the group can be created.
export function validateGroup(input: GroupInput): string | null {
  if (!input.title.trim()) return "Informe o nome do grupo.";
  if (input.taskIds.length === 0) return "Marque pelo menos uma tarefa para agrupar.";
  return null;
}

// Rule: a task cannot end after the project (the database checks it too).
export function deadlineLimitError(deadline: string, projectDeadline: string | null): string | null {
  if (!isValidIsoDate(deadline)) return null;
  if (projectDeadline && deadline > projectDeadline) {
    return `O prazo não pode ultrapassar o prazo do projeto (${formatDate(projectDeadline)}).`;
  }
  return null;
}

export function validateItem(
  rawInput: ItemInput,
  projectDeadline: string | null = null,
): ItemValidationResult {
  const input = normalizeItemInput(rawInput);
  const errors: ItemFieldError[] = [];
  const add = (field: ItemField, message: string) => errors.push({ field, message });

  if (!input.title) add("title", "Informe o título.");
  if (!input.areaId) add("areaId", "Escolha a área.");
  if (!input.assigneeId) add("assigneeId", "Escolha o responsável.");

  const startOk = isValidIsoDate(input.startDate);
  const deadlineOk = isValidIsoDate(input.deadline);
  if (!deadlineOk) add("deadline", "Informe um prazo válido.");
  if (input.startDate && !startOk) add("startDate", "Informe uma data de início válida.");
  if (input.startDate && startOk && deadlineOk && input.deadline < input.startDate) {
    add("deadline", "O prazo não pode ser anterior ao início.");
  }

  const limitError = deadlineLimitError(input.deadline, projectDeadline);
  if (limitError) add("deadline", limitError);

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

// Roles apply only in the interface (PRD decision 4).
// Owner: any area. Area leader: only the leader's own area. Participant: cannot create.
export function canCreateItemInArea(profile: DemoProfile, areaName: string): boolean {
  if (profile.role === "owner") return true;
  if (profile.role === "area-lead") {
    return normalizeName(profile.area) === normalizeName(areaName);
  }
  return false;
}

export function canManageScope(profile: DemoProfile): boolean {
  return profile.role === "owner" || profile.role === "area-lead";
}

// For an area leader, the area they may create items in (null if the project has none like it).
export function findLeaderAreaId(
  profile: DemoProfile,
  areas: readonly { id: string; name: string }[],
): string | null {
  if (profile.role !== "area-lead") return null;
  const area = areas.find(
    (candidate) => normalizeName(candidate.name) === normalizeName(profile.area),
  );
  return area?.id ?? null;
}

// Who may change a task's status (roles apply only in the interface, PRD decision 4):
// the owner any task; an area leader the tasks of their area; anyone their own tasks.
export function canUpdateTaskStatus(
  profile: DemoProfile,
  task: { areaName: string; assigneeName: string },
): boolean {
  if (profile.role === "owner") return true;
  if (profile.role === "area-lead" && canCreateItemInArea(profile, task.areaName)) return true;
  return normalizeName(profile.name) === normalizeName(task.assigneeName);
}
