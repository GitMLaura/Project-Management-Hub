import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { CalendarMonth } from "@/lib/calendar";
import { formatDate } from "@/lib/format";
import { ITEM_STATUS_LABELS, ITEM_STATUSES } from "@/lib/item-rules";
import type { BoardTask, StatusCounts, StatusView } from "@/lib/status-view";

const BOARD_LIMIT = 3;

function situation(counts: StatusCounts): { text: string; className: string } {
  if (counts.lateTasks > 0) {
    return { text: `${counts.lateTasks} em atraso`, className: "border-red-300 bg-red-50 text-red-700" };
  }
  if (counts.blockedItems > 0) {
    return { text: "Bloqueado", className: "border-yellow-300 bg-yellow-50 text-yellow-800" };
  }
  if (counts.totalTasks > 0 && counts.doneTasks === counts.totalTasks) {
    return { text: "Concluído", className: "border-green-300 bg-green-50 text-green-800" };
  }
  return { text: "No prazo", className: "border-green-300 bg-green-50 text-green-800" };
}

export type EpicRow = {
  id: string;
  title: string;
  deadline: string;
  featureCount: number;
  counts: StatusCounts;
};

// Table of epics: situation, progress, deadline and a clear way into the epic's items.
export function EpicsTable({ projectId, epics }: { projectId: string; epics: EpicRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="hidden grid-cols-[minmax(0,1.6fr)_6.5rem_minmax(0,1.2fr)_3.5rem_6rem] gap-4 border-b px-5 py-3 text-xs text-muted-foreground md:grid">
        <span>Épico</span>
        <span>Situação</span>
        <span>Progresso</span>
        <span>Prazo</span>
        <span className="text-right">Itens</span>
      </div>
      <ul className="divide-y">
        {epics.map((epic) => {
          const tag = situation(epic.counts);
          return (
            <li
              key={epic.id}
              className="grid items-center gap-x-4 gap-y-2 px-5 py-4 md:grid-cols-[minmax(0,1.6fr)_6.5rem_minmax(0,1.2fr)_3.5rem_6rem]"
            >
              <div className="min-w-0">
                <p className="font-medium">{epic.title}</p>
                <p className="text-xs text-muted-foreground">
                  {epic.featureCount} {epic.featureCount === 1 ? "funcionalidade" : "funcionalidades"}
                </p>
              </div>
              <span>
                <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${tag.className}`}>
                  {tag.text}
                </span>
              </span>
              <div className="flex items-center gap-3">
                <div
                  role="progressbar"
                  aria-valuenow={epic.counts.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progresso de ${epic.title}`}
                  className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="bar-fill h-full rounded-full bg-foreground"
                    style={{ width: `${epic.counts.percent}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {epic.counts.percent}%
                </span>
              </div>
              <span className="text-sm tabular-nums text-muted-foreground">
                {formatDate(epic.deadline).slice(0, 5)}
              </span>
              <Link
                href={`/projects/${projectId}/scope#item-${epic.id}`}
                aria-label={`Ver itens do épico ${epic.title}`}
                className="inline-flex items-center justify-end gap-1 rounded-md text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                Ver itens
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Four columns, one per status. Each shows the first few tasks and sends the rest to Escopo.
export function TaskBoard({
  projectId,
  board,
  areaNames,
  assigneeNames,
}: {
  projectId: string;
  board: StatusView["board"];
  areaNames: Record<string, string>;
  assigneeNames: Record<string, string>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ITEM_STATUSES.map((status) => {
        const tasks: BoardTask[] = board[status];
        const shown = tasks.slice(0, BOARD_LIMIT);
        return (
          <section
            key={status}
            aria-label={`${ITEM_STATUS_LABELS[status]}: ${tasks.length}`}
            className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-3"
          >
            <h3 className="flex items-center justify-between px-1 text-sm font-semibold">
              {ITEM_STATUS_LABELS[status]}
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                {tasks.length}
              </span>
            </h3>
            {shown.length === 0 ? (
              <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">Nenhuma tarefa.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {shown.map((task) => (
                  <li key={task.id} className="flex flex-col gap-1 rounded-xl border bg-card p-3 shadow-xs">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {areaNames[task.areaId] ?? "Sem área"} · {assigneeNames[task.assigneeId] ?? "Sem responsável"}
                    </p>
                    <p
                      className={`text-xs tabular-nums ${task.late ? "font-medium text-red-700" : "text-muted-foreground"}`}
                    >
                      {task.late ? "Atrasada · " : "Prazo "}
                      {formatDate(task.deadline).slice(0, 5)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {tasks.length > shown.length && (
              <Link
                href={`/projects/${projectId}/scope?status=${status}`}
                className="px-1 text-xs font-medium text-primary hover:underline"
              >
                Ver mais {tasks.length - shown.length} no escopo
              </Link>
            )}
          </section>
        );
      })}
    </div>
  );
}

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

// Month with the deadlines of unfinished tasks. Past-due days are red; today is filled.
export function DeadlineCalendar({ projectId, month }: { projectId: string; month: CalendarMonth }) {
  const base = `/projects/${projectId}`;
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-heading font-semibold capitalize">{month.label}</p>
        <div className="flex gap-1">
          <Link
            href={`${base}?mes=${month.prev}`}
            aria-label="Mês anterior"
            className="rounded-md p-1.5 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href={`${base}?mes=${month.next}`}
            aria-label="Próximo mês"
            className="rounded-md p-1.5 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <table className="w-full table-fixed border-separate border-spacing-1 text-center text-xs">
        <thead>
          <tr>
            {WEEKDAYS.map((label, index) => (
              <th key={index} scope="col" className="pb-1 font-normal text-muted-foreground">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {month.weeks.map((week) => (
            <tr key={week[0].iso}>
              {week.map((day) => (
                <td
                  key={day.iso}
                  title={day.count > 0 ? `${day.count} ${day.count === 1 ? "prazo" : "prazos"}` : undefined}
                  className={`relative h-9 rounded-lg tabular-nums ${
                    day.isToday
                      ? "bg-primary font-semibold text-primary-foreground"
                      : day.inMonth
                        ? "bg-muted/60"
                        : "text-muted-foreground/50"
                  }`}
                >
                  {day.day}
                  {day.count > 0 && (
                    <span
                      aria-label={`${day.count} ${day.count === 1 ? "prazo" : "prazos"}${day.late > 0 ? ", atrasados" : ""}`}
                      className={`absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${
                        day.isToday ? "bg-primary-foreground" : day.late > 0 ? "bg-red-600" : "bg-foreground"
                      }`}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-foreground" aria-hidden="true" /> prazo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-red-600" aria-hidden="true" /> atrasado
        </span>
      </p>
    </div>
  );
}
