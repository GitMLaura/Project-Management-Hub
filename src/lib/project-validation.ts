// Pure rules for creating a project (story H1.1.1). No database here.

export type ParticipantInput = {
  name: string;
  area: string; // name of one of the project areas
  isOwner: boolean;
  isAreaLeader: boolean;
};

export type ProjectInput = {
  name: string;
  objective: string;
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  areas: string[];
  participants: ParticipantInput[];
};

export type ProjectField =
  | "name"
  | "objective"
  | "startDate"
  | "deadline"
  | "areas"
  | "participants";

export type FieldError = { field: ProjectField; message: string };

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: FieldError[] };

// Lowercase, no accents, collapsed spaces: "Design " and "design" are the same name.
function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function findDuplicates(names: string[]): boolean {
  const seen = new Set<string>();
  for (const name of names) {
    const key = normalizeName(name);
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

export function normalizeProjectInput(input: ProjectInput): ProjectInput {
  return {
    name: input.name.trim(),
    objective: input.objective.trim(),
    startDate: input.startDate.trim(),
    deadline: input.deadline.trim(),
    areas: input.areas.map((area) => area.trim()),
    participants: input.participants.map((participant) => ({
      ...participant,
      name: participant.name.trim(),
      area: participant.area.trim(),
    })),
  };
}

// Runtime check for data that arrives from the browser (never trust its shape).
export function isProjectInput(value: unknown): value is ProjectInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    typeof v.objective === "string" &&
    typeof v.startDate === "string" &&
    typeof v.deadline === "string" &&
    Array.isArray(v.areas) &&
    v.areas.every((area) => typeof area === "string") &&
    Array.isArray(v.participants) &&
    v.participants.every((p) => {
      if (typeof p !== "object" || p === null) return false;
      const participant = p as Record<string, unknown>;
      return (
        typeof participant.name === "string" &&
        typeof participant.area === "string" &&
        typeof participant.isOwner === "boolean" &&
        typeof participant.isAreaLeader === "boolean"
      );
    })
  );
}

export function validateProject(rawInput: ProjectInput): ValidationResult {
  const input = normalizeProjectInput(rawInput);
  const errors: FieldError[] = [];
  const add = (field: ProjectField, message: string) =>
    errors.push({ field, message });

  if (!input.name) add("name", "Informe o nome do projeto.");
  if (!input.objective) add("objective", "Informe o objetivo do projeto.");

  const startOk = isValidIsoDate(input.startDate);
  const deadlineOk = isValidIsoDate(input.deadline);
  if (!startOk) add("startDate", "Informe uma data de início válida.");
  if (!deadlineOk) add("deadline", "Informe um prazo válido.");
  if (startOk && deadlineOk && input.deadline < input.startDate) {
    add("deadline", "O prazo não pode ser anterior ao início.");
  }

  if (input.areas.length === 0) {
    add("areas", "Adicione pelo menos uma área.");
  } else if (input.areas.some((area) => !area)) {
    add("areas", "Preencha o nome de todas as áreas ou remova as vazias.");
  } else if (findDuplicates(input.areas)) {
    add("areas", "Há áreas com o mesmo nome.");
  }

  if (input.participants.length === 0) {
    add("participants", "Adicione pelo menos um participante.");
  } else {
    const areaKeys = new Set(input.areas.map(normalizeName));
    if (input.participants.some((p) => !p.name)) {
      add("participants", "Preencha o nome de todos os participantes ou remova os vazios.");
    } else if (findDuplicates(input.participants.map((p) => p.name))) {
      add("participants", "Há participantes com o mesmo nome.");
    }
    if (input.participants.some((p) => !areaKeys.has(normalizeName(p.area)))) {
      add("participants", "Escolha uma área existente para cada participante.");
    }

    const owners = input.participants.filter((p) => p.isOwner).length;
    if (owners !== 1) {
      add("participants", "Escolha exatamente um Dono do projeto.");
    }

    const leaderCountByArea = new Map<string, number>();
    for (const p of input.participants.filter((p) => p.isAreaLeader)) {
      const key = normalizeName(p.area);
      leaderCountByArea.set(key, (leaderCountByArea.get(key) ?? 0) + 1);
    }
    if ([...leaderCountByArea.values()].some((count) => count > 1)) {
      add("participants", "Cada área pode ter só um líder.");
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
