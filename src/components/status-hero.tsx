import { HealthBadge } from "@/components/health-badge";
import { formatLongDate } from "@/lib/format";
import type { HealthEntry } from "@/lib/health-panel";
import type { StatusView } from "@/lib/status-view";

const TONE = {
  red: "border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-50",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-950 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-50",
  green: "border-green-200 bg-green-50 text-green-950 dark:border-green-900 dark:bg-green-950/40 dark:text-green-50",
} as const;

// Top of the Status page: the project's health and why, then the four numbers behind it.
export function StatusHero({
  health,
  view,
  deadline,
}: {
  health: HealthEntry["health"];
  view: StatusView;
  deadline: string;
}) {
  const { totals } = view;
  const headline =
    health.reasons.length > 0
      ? health.reasons.map((reason) => reason.text).join(" · ")
      : "Sem atrasos, bloqueios ou desvio relevante";
  const daysText =
    view.daysLeft >= 0
      ? `faltam ${view.daysLeft} dias`
      : `${Math.abs(view.daysLeft)} dias além do prazo`;

  return (
    <>
      <section
        aria-labelledby="health-title"
        className={`grid gap-6 rounded-2xl border p-8 md:grid-cols-[1fr_auto] md:gap-12 ${TONE[health.color]}`}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="health-title" className="text-base font-semibold">
              Saúde do projeto
            </h2>
            <HealthBadge color={health.color} label={health.label} />
          </div>
          <p className="max-w-3xl font-heading text-3xl leading-snug font-semibold text-balance sm:text-4xl">
            {headline}
          </p>
          <div className="flex flex-col gap-2">
            <div className="relative pt-1">
              <div
                role="progressbar"
                aria-valuenow={totals.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progresso do projeto"
                className="h-2 overflow-hidden rounded-full bg-black/10"
              >
                <div
                  className="bar-fill h-full rounded-full bg-foreground"
                  style={{ width: `${totals.percent}%` }}
                />
              </div>
              <span
                aria-hidden="true"
                className="absolute top-0 h-4 w-0.5 rounded-full bg-primary"
                style={{ left: `${view.expectedPercent}%` }}
              />
            </div>
            <p className="font-medium tabular-nums">
              {totals.percent}% das tarefas concluídas ({totals.doneTasks} de {totals.totalTasks})
            </p>
            <p className="text-sm opacity-80">
              A marca vermelha é o esperado para hoje: {view.expectedPercent}%. Medido em tarefas
              concluídas ÷ total de tarefas.
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-1 md:min-w-56 md:border-l md:border-current/15 md:pl-12">
          <p className="text-sm font-medium">Prazo final</p>
          <p className="font-heading text-4xl font-semibold">{formatLongDate(deadline)}</p>
          <p className="text-sm tabular-nums">{daysText}</p>
        </div>
      </section>
    </>
  );
}

const PILL = {
  red: "bg-red-100 text-red-800",
  yellow: "bg-yellow-100 text-yellow-900",
  green: "bg-green-100 text-green-800",
  neutral: "bg-muted text-muted-foreground",
} as const;

function Metric({
  label,
  value,
  pill,
  tone,
}: {
  label: string;
  value: string;
  pill: string;
  tone: keyof typeof PILL;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="flex items-center gap-2">
        <span className="font-heading text-5xl leading-none font-semibold tabular-nums">{value}</span>
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${PILL[tone]}`}>{pill}</span>
      </p>
    </div>
  );
}

// The numbers behind the health color, shown beside the page title.
export function StatusMetrics({ view }: { view: StatusView }) {
  const { totals } = view;
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4" role="group" aria-label="Números do projeto">
      <Metric
        label="Atrasadas"
        value={String(totals.lateTasks)}
        pill={totals.lateTasks > 0 ? "Atenção" : "Em dia"}
        tone={totals.lateTasks > 0 ? "red" : "green"}
      />
      <Metric
        label="Bloqueados"
        value={String(totals.blockedItems)}
        pill={totals.blockedItems > 0 ? "Atenção" : "Nenhum"}
        tone={totals.blockedItems > 0 ? "yellow" : "green"}
      />
      <Metric
        label="Concluídas"
        value={`${totals.doneTasks}/${totals.totalTasks}`}
        pill={`${totals.percent}%`}
        tone="neutral"
      />
    </div>
  );
}
