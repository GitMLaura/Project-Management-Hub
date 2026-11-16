import { formatLongDate } from "@/lib/format";
import type { HealthEntry } from "@/lib/health-panel";
import type { StatusView } from "@/lib/status-view";

const TONE = {
  red: "border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-50",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-950 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-50",
  green: "border-green-200 bg-green-50 text-green-950 dark:border-green-900 dark:bg-green-950/40 dark:text-green-50",
} as const;

function Tile({ value, label, tone }: { value: string; label: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border bg-card p-5">
      <p className={`font-heading text-4xl font-semibold ${tone ?? ""}`}>{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// The big card at the top of the Status page: color, reasons, progress and deadline.
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
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <section
        aria-label="Saúde do projeto"
        className={`grid gap-6 rounded-2xl border p-6 md:grid-cols-[1fr_auto] ${TONE[health.color]}`}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold tracking-wide uppercase">
            Saúde do projeto · {health.label}
          </p>
          <h2 className="font-heading text-2xl font-semibold leading-snug sm:text-3xl">
            {headline}
          </h2>
          <div className="flex flex-col gap-2">
            <div className="relative">
              <div
                role="progressbar"
                aria-valuenow={totals.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progresso do projeto"
                className="h-2 overflow-hidden rounded-full bg-black/10"
              >
                <div className="h-full bg-foreground" style={{ width: `${totals.percent}%` }} />
              </div>
              <span
                aria-hidden="true"
                className="absolute -top-1 h-4 w-0.5 bg-primary"
                style={{ left: `${view.expectedPercent}%` }}
              />
            </div>
            <p className="font-medium">
              {totals.percent}% das tarefas do projeto concluídas ({totals.doneTasks} de{" "}
              {totals.totalTasks})
            </p>
            <p className="text-sm opacity-80">
              Esperado para hoje: {view.expectedPercent}% · medido em tarefas concluídas ÷ total de
              tarefas
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-1 rounded-xl bg-white/60 p-5 md:min-w-48 dark:bg-white/10">
          <p className="text-xs font-semibold tracking-wide uppercase">Prazo final</p>
          <p className="font-heading text-3xl font-semibold">{formatLongDate(deadline)}</p>
          <p className="text-sm font-medium">{daysText}</p>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-4">
        <Tile
          value={String(totals.lateTasks)}
          label="tarefas atrasadas"
          tone={totals.lateTasks > 0 ? "text-primary" : undefined}
        />
        <Tile value={String(totals.blockedItems)} label="itens bloqueados" />
        <Tile value={`${totals.doneTasks}/${totals.totalTasks}`} label="tarefas concluídas" />
        <Tile value={String(Math.max(view.daysLeft, 0))} label="dias até o prazo final" />
      </div>
    </div>
  );
}
