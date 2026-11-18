// Project health (PRD section 4). A pure function: same input, same answer, always
// with the reasons in plain text. All thresholds live here, at the top, to be tuned.

export const LATE_TASKS_RED = 3; // this many late tasks (or more) = red
export const LATE_TASKS_YELLOW = 1; // 1 or 2 late tasks = yellow
export const DEVIATION_RED = 25; // percentage points
export const DEVIATION_YELLOW = 10; // percentage points
export const UNASSIGNED_DAYS_RED = 7; // no owner and due within this many days = red

export type HealthColor = "green" | "yellow" | "red";

export type HealthItem = {
  id: string;
  title: string;
  type: "group" | "task";
  status: "a_fazer" | "em_andamento" | "bloqueado" | "concluido";
  deadline: string; // YYYY-MM-DD
  isCritical: boolean;
  assigneeId: string | null;
};

export type HealthReason = {
  level: "red" | "yellow";
  text: string;
  itemIds: string[]; // the items behind this reason (for links in the interface)
};

export type HealthResult = {
  color: HealthColor;
  label: "Verde" | "Amarelo" | "Vermelho";
  reasons: HealthReason[]; // only the reasons of the final color
  summary: string; // e.g. "Vermelho: 3 tarefas atrasadas em Dev"
};

export type HealthInput = {
  items: readonly HealthItem[]; // active items of the project, epic or area being judged
  today: string; // YYYY-MM-DD
  periodStart: string; // start of the project or epic being judged
  periodDeadline: string;
  scopeLabel?: string; // e.g. "em Dev", appended to reasons about tasks
};

const LABELS: Record<HealthColor, HealthResult["label"]> = {
  green: "Verde",
  yellow: "Amarelo",
  red: "Vermelho",
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toDay(iso: string): number {
  return Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / DAY_MS);
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

// Expected progress: share of the period already elapsed, limited between 0 and 100.
export function expectedProgress(today: string, start: string, deadline: string): number {
  const total = toDay(deadline) - toDay(start);
  if (total <= 0) return toDay(today) >= toDay(deadline) ? 100 : 0;
  const elapsed = toDay(today) - toDay(start);
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function isLateTask(item: HealthItem, today: string): boolean {
  return item.type === "task" && item.status !== "concluido" && toDay(item.deadline) < toDay(today);
}

export function calculateHealth(input: HealthInput): HealthResult {
  const { items, today, periodStart, periodDeadline } = input;
  const where = input.scopeLabel ? ` ${input.scopeLabel}` : "";
  const reasons: HealthReason[] = [];

  // Late tasks.
  const lateTasks = items.filter((item) => isLateTask(item, today));
  if (lateTasks.length >= LATE_TASKS_RED) {
    reasons.push({
      level: "red",
      text: `${plural(lateTasks.length, "tarefa atrasada", "tarefas atrasadas")}${where}`,
      itemIds: lateTasks.map((item) => item.id),
    });
  } else if (lateTasks.length >= LATE_TASKS_YELLOW) {
    reasons.push({
      level: "yellow",
      text: `${plural(lateTasks.length, "tarefa atrasada", "tarefas atrasadas")}${where}`,
      itemIds: lateTasks.map((item) => item.id),
    });
  }

  // Critical item late or blocked (any level).
  const criticalProblems = items.filter(
    (item) =>
      item.isCritical &&
      item.status !== "concluido" &&
      (item.status === "bloqueado" || toDay(item.deadline) < toDay(today)),
  );
  if (criticalProblems.length > 0) {
    reasons.push({
      level: "red",
      text: `${plural(criticalProblems.length, "item crítico atrasado ou bloqueado", "itens críticos atrasados ou bloqueados")}${where}`,
      itemIds: criticalProblems.map((item) => item.id),
    });
  }

  // Deviation between expected and real progress (only when there are tasks to measure).
  const tasks = items.filter((item) => item.type === "task");
  if (tasks.length > 0) {
    const done = tasks.filter((item) => item.status === "concluido").length;
    const real = (done / tasks.length) * 100;
    const expected = expectedProgress(today, periodStart, periodDeadline);
    const deviation = expected - real;
    const text = `desvio de ${Math.round(deviation)} p.p. (esperado ${Math.round(expected)}%, real ${Math.round(real)}%)${where}`;
    if (deviation > DEVIATION_RED) {
      reasons.push({ level: "red", text, itemIds: [] });
    } else if (deviation > DEVIATION_YELLOW) {
      reasons.push({ level: "yellow", text, itemIds: [] });
    }
  }

  // Item without an owner due soon.
  const unassigned = items.filter(
    (item) =>
      !item.assigneeId &&
      item.status !== "concluido" &&
      toDay(item.deadline) - toDay(today) <= UNASSIGNED_DAYS_RED,
  );
  if (unassigned.length > 0) {
    reasons.push({
      level: "red",
      text: `${plural(unassigned.length, "item sem responsável", "itens sem responsável")} com prazo em até ${UNASSIGNED_DAYS_RED} dias${where}`,
      itemIds: unassigned.map((item) => item.id),
    });
  }

  // Blocked items (yellow).
  const blocked = items.filter((item) => item.status === "bloqueado");
  if (blocked.length > 0) {
    reasons.push({
      level: "yellow",
      text: `${plural(blocked.length, "item bloqueado", "itens bloqueados")}${where}`,
      itemIds: blocked.map((item) => item.id),
    });
  }

  // The final color is the most serious one among the conditions that apply.
  const color: HealthColor = reasons.some((r) => r.level === "red")
    ? "red"
    : reasons.length > 0
      ? "yellow"
      : "green";
  const shown = reasons.filter((r) => color === "red" ? r.level === "red" : r.level === "yellow");

  const summary =
    color === "green"
      ? `${LABELS.green}: sem atrasos, bloqueios ou desvio relevante${where}`
      : `${LABELS[color]}: ${shown.map((r) => r.text).join("; ")}`;

  return { color, label: LABELS[color], reasons: shown, summary };
}
