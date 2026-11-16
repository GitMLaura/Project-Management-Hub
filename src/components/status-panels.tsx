import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { StatusCounts } from "@/lib/status-view";

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
