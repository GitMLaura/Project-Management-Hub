// Pure rules for scope items (story H1.2.1). No database here.
import type { DemoProfile } from "@/lib/demo-profiles";
import { normalizeName } from "@/lib/project-validation";

export type ItemType = "epic" | "feature" | "story" | "task";
export type ItemStatus = "a_fazer" | "em_andamento" | "bloqueado" | "concluido";

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  epic: "Épico",
  feature: "Funcionalidade",
  story: "História",
  task: "Tarefa",
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

const CHILD_TYPE: Record<ItemType, ItemType | null> = {
  epic: "feature",
  feature: "story",
  story: "task",
  task: null,
};

const PARENT_TYPE: Record<ItemType, ItemType | null> = {
  epic: null,
  feature: "epic",
  story: "feature",
  task: "story",
};

export function childTypeOf(type: ItemType): ItemType | null {
  return CHILD_TYPE[type];
}

export function parentTypeOf(type: ItemType): ItemType | null {
  return PARENT_TYPE[type];
}

export function isItemType(value: unknown): value is ItemType {
  return value === "epic" || value === "feature" || value === "story" || value === "task";
}

export function isItemStatus(value: unknown): value is ItemStatus {
  return ITEM_STATUSES.some((status) => status === value);
}

export type ItemInput = {
  projectId: string;
  type: ItemType;
  parentId: string | null; // null only for epics (their parent is the project)
  title: string;
  description: string;
  areaId: string;
  assigneeId: string;
  startDate: string; // YYYY-MM-DD, may be empty for tasks
  deadline: string; // YYYY-MM-DD
  status: ItemStatus;
  isCritical: boolean;
  storyPersona: string;
  storyAction: string;
  storyBenefit: string;
  acceptanceCriteria: string[];
};

export type ItemField =
  | "title"
  | "areaId"
  | "assigneeId"
  | "startDate"
  | "deadline"
  | "parentId"
  | "story"
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
    storyPersona: input.storyPersona.trim(),
    storyAction: input.storyAction.trim(),
    storyBenefit: input.storyBenefit.trim(),
    acceptanceCriteria: input.acceptanceCriteria
      .map((criterion) => criterion.trim())
      .filter(Boolean),
  };
}

// Runtime check for data that arrives from the browser (never trust its shape).
export function isItemInput(value: unknown): value is ItemInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.projectId === "string" &&
    isItemType(v.type) &&
    (v.parentId === null || typeof v.parentId === "string") &&
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    typeof v.areaId === "string" &&
    typeof v.assigneeId === "string" &&
    typeof v.startDate === "string" &&
    typeof v.deadline === "string" &&
    isItemStatus(v.status) &&
    typeof v.isCritical === "boolean" &&
    typeof v.storyPersona === "string" &&
    typeof v.storyAction === "string" &&
    typeof v.storyBenefit === "string" &&
    Array.isArray(v.acceptanceCriteria) &&
    v.acceptanceCriteria.every((criterion) => typeof criterion === "string")
  );
}

export function validateItem(rawInput: ItemInput): ItemValidationResult {
  const input = normalizeItemInput(rawInput);
  const errors: ItemFieldError[] = [];
  const add = (field: ItemField, message: string) => errors.push({ field, message });

  if (!input.title) add("title", "Informe o título.");
  if (!input.areaId) add("areaId", "Escolha a área.");
  if (!input.assigneeId) add("assigneeId", "Escolha o responsável.");

  // Rule E1: every item has a parent, except epics (their parent is the project).
  if (input.type === "epic" && input.parentId !== null) {
    add("parentId", "Um épico não tem item pai.");
  }
  if (input.type !== "epic" && !input.parentId) {
    add("parentId", "Todo item, exceto o épico, precisa de um item pai.");
  }

  const startOk = isValidIsoDate(input.startDate);
  const deadlineOk = isValidIsoDate(input.deadline);
  if (!deadlineOk) add("deadline", "Informe um prazo válido.");
  if (input.type === "task") {
    if (input.startDate && !startOk) add("startDate", "Informe uma data de início válida.");
  } else if (!startOk) {
    add("startDate", "Informe uma data de início válida.");
  }
  if (input.startDate && startOk && deadlineOk && input.deadline < input.startDate) {
    add("deadline", "O prazo não pode ser anterior ao início.");
  }

  if (input.type === "story") {
    if (!input.storyPersona || !input.storyAction || !input.storyBenefit) {
      add("story", "Preencha “Como…”, “quero…” e “para…” da história.");
    }
  }

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
