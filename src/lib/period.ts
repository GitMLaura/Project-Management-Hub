// Period filter of the Status page (day, week, month): keeps only the tasks due in it.
import type { ItemNode } from "@/lib/item-tree";

export type Period = "all" | "day" | "week" | "month";

export const PERIOD_LABELS: Record<Period, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
  all: "Tudo",
};

// The Status page opens on the current month; "all" must be asked for.
export function parsePeriod(raw: string | undefined): Period {
  return raw === "day" || raw === "week" || raw === "all" ? raw : "month";
}

export type DateRange = { start: string; end: string }; // YYYY-MM-DD, both included

const DAY_MS = 24 * 60 * 60 * 1000;

function shift(isoDate: string, days: number): string {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

// Today; the week from Monday to Sunday; the calendar month. `all` has no range.
export function periodRange(period: Period, today: string): DateRange | null {
  if (period === "all") return null;
  if (period === "day") return { start: today, end: today };
  if (period === "week") {
    const weekday = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 = Sunday
    const sinceMonday = (weekday + 6) % 7;
    const start = shift(today, -sinceMonday);
    return { start, end: shift(start, 6) };
  }
  const [year, month] = today.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = today.slice(0, 7);
  return { start: `${prefix}-01`, end: `${prefix}-${String(last).padStart(2, "0")}` };
}

// Removes the tasks whose deadline is outside the range. Epics, features and stories stay.
export function filterTasksByRange(nodes: readonly ItemNode[], range: DateRange | null): ItemNode[] {
  if (!range) return [...nodes];
  return nodes
    .filter((node) => node.type !== "task" || (node.deadline >= range.start && node.deadline <= range.end))
    .map((node) => ({ ...node, children: filterTasksByRange(node.children, range) }));
}
