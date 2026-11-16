import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { AttentionItem, StatusCounts } from "@/lib/status-view";

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function badge(counts: StatusCounts): { text: string; className: string } {
  if (counts.lateTasks > 0) {
    return {
      text: `${counts.lateTasks} em atraso`,
      className: "border-red-300 bg-red-50 text-red-700",
    };
  }
  if (counts.blockedItems > 0) {
    return {
      text: plural(counts.blockedItems, "bloqueado", "bloqueados"),
      className: "border-yellow-300 bg-yellow-50 text-yellow-800",
    };
  }
  return { text: "Ok", className: "border-green-300 bg-green-50 text-green-800" };
}

function summaryText(counts: StatusCounts): string {
  const parts: string[] = [];
  if (counts.lateTasks > 0) parts.push(plural(counts.lateTasks, "tarefa atrasada", "tarefas atrasadas"));
  if (counts.blockedItems > 0) parts.push(plural(counts.blockedItems, "bloqueada", "bloqueadas"));
  return parts.length > 0 ? parts.join(" · ") : "Sem atrasos ou bloqueios";
}

// One card of "Saúde por área" or "Épicos em andamento".
export function StatusCard({
  name,
  counts,
  contextLabel,
  contextValues,
  contextTotal,
  contextAllLabel,
  action,
}: {
  name: string;
  counts: StatusCounts;
  contextLabel: string; // "Atuando em" or "Áreas"
  contextValues: string[];
  contextTotal: number; // when contextValues covers all of them, one word replaces the list
  contextAllLabel: string; // "Todos os épicos" or "Todas"
  action?: { href: string; label: string }; // explicit way into the items
}) {
  const everything = contextTotal > 0 && contextValues.length === contextTotal;
  const tag = badge(counts);
  return (
    <article className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-base font-semibold">{name}</h3>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${tag.className}`}>
          {tag.text}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{summaryText(counts)}</p>
      <div>
        <div
          role="progressbar"
          aria-valuenow={counts.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso de ${name}`}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div className="bar-fill h-full rounded-full bg-foreground" style={{ width: `${counts.percent}%` }} />
        </div>
        <p className="mt-2 font-mono text-xs text-muted-foreground tabular-nums">
          {counts.doneTasks} de {counts.totalTasks} tarefas · {counts.percent}%
        </p>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 border-t pt-3 text-xs">
        <span className="text-muted-foreground">{contextLabel}</span>
        {contextValues.length === 0 ? (
          <span>Nenhum ainda</span>
        ) : everything ? (
          <span>{contextAllLabel}</span>
        ) : (
          contextValues.map((value) => <span key={value}>{value}</span>)
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="-mb-1 inline-flex w-fit items-center gap-1 rounded-md text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {action.label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}

export function AttentionList({
  projectId,
  items,
  areaNames,
  assigneeNames,
}: {
  projectId: string;
  items: AttentionItem[];
  areaNames: Record<string, string>;
  assigneeNames: Record<string, string>;
}) {
  return (
    <ul className="divide-y rounded-2xl border bg-card">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/projects/${projectId}/scope`}
            className="flex items-start justify-between gap-3 p-4 outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium">{item.title}</span>
              <span className="text-xs text-muted-foreground">
                {areaNames[item.areaId] ?? "Sem área"} · {assigneeNames[item.assigneeId] ?? "Sem responsável"}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {item.daysOverdue > 0
                  ? `Venceu há ${item.daysOverdue} ${item.daysOverdue === 1 ? "dia" : "dias"} (${formatDate(item.deadline)})`
                  : `Prazo ${formatDate(item.deadline)}`}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                item.reason === "late"
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-yellow-300 bg-yellow-50 text-yellow-800"
              }`}
            >
              {item.reason === "late" ? "Atrasada" : "Bloqueado"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
